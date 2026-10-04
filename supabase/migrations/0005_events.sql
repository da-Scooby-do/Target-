-- Events: trade conferences, trade missions, webinars and networking meetings organised by TFS.
-- Staff publish events; anyone can register (signed in or not). A full event puts new
-- registrations on a waiting list. Seats taken are kept on the event by a trigger.

create type public.event_kind as enum ('conference', 'trade_mission', 'webinar', 'networking', 'expo');
create type public.event_status as enum ('draft', 'published', 'cancelled');
create type public.registration_status as enum ('registered', 'waitlist', 'cancelled');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  kind public.event_kind not null default 'conference',
  title text not null check (length(trim(title)) between 1 and 200),
  summary text check (summary is null or length(summary) <= 400),
  description text check (description is null or length(description) <= 8000),
  starts_at timestamptz not null,
  ends_at timestamptz,
  online boolean not null default false,
  venue text check (venue is null or length(venue) <= 200),
  city text check (city is null or length(city) <= 100),
  country text check (country is null or length(country) <= 100),
  image text check (image is null or length(image) <= 300),
  capacity int check (capacity is null or capacity between 1 and 100000),
  price_note text check (price_note is null or length(price_note) <= 100),
  language text check (language is null or length(language) <= 60),
  seats_taken int not null default 0,
  status public.event_status not null default 'draft',
  is_example boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);
create index events_upcoming_idx on public.events (status, starts_at);

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  name text not null check (length(trim(name)) between 1 and 200),
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  company text check (company is null or length(company) <= 200),
  phone text check (phone is null or length(phone) <= 50),
  attendees int not null default 1 check (attendees between 1 and 10),
  notes text check (notes is null or length(notes) <= 1000),
  status public.registration_status not null default 'registered',
  created_at timestamptz not null default now()
);
create unique index event_registrations_once on public.event_registrations (event_id, lower(email)) where status <> 'cancelled';
create index event_registrations_user_idx on public.event_registrations (user_id);

create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();

-- Keep seats_taken in step with confirmed registrations.
create or replace function public.event_count_seats()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event uuid := coalesce(new.event_id, old.event_id);
begin
  update public.events
    set seats_taken = coalesce((select sum(attendees) from public.event_registrations where event_id = v_event and status = 'registered'), 0)
    where id = v_event;
  return null;
end;
$$;

create trigger event_registrations_count after insert or update on public.event_registrations
  for each row execute function public.event_count_seats();

-- ---------------------------------------------------------------- notifications

alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (kind in (
  'quote_received', 'quote_priced', 'shipment_booked', 'shipment_update', 'team_joined',
  'staff_new_quote', 'staff_quote_answered',
  'order_placed', 'order_update', 'staff_new_order', 'supplier_new_order',
  'supplier_approved', 'staff_new_supplier', 'product_approved', 'product_rejected', 'staff_product_review',
  'event_registered', 'event_waitlist', 'event_promoted', 'staff_event_registration'
));

-- ---------------------------------------------------------------- row level security

alter table public.events enable row level security;
alter table public.event_registrations enable row level security;

create policy "events: published are public" on public.events
  for select to anon, authenticated using (status <> 'draft');
create policy "events: staff read all" on public.events
  for select to authenticated using ((select public.is_staff()));
create policy "events: staff insert" on public.events
  for insert to authenticated with check ((select public.is_staff()));
create policy "events: staff update" on public.events
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "events: staff delete" on public.events
  for delete to authenticated using ((select public.is_staff()));

create policy "registrations: own and staff read" on public.event_registrations
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_staff()));
create policy "registrations: staff update" on public.event_registrations
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

-- ---------------------------------------------------------------- functions called by the app

-- Register for a published, upcoming event. Signed-in users are linked; guests give their details.
create or replace function public.register_for_event(
  p_event uuid, p_name text, p_email text, p_company text, p_phone text, p_attendees int, p_notes text
)
returns public.registration_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.events;
  v_email text := lower(trim(p_email));
  v_status public.registration_status;
  v_attendees int := greatest(1, least(coalesce(p_attendees, 1), 10));
begin
  select * into e from public.events where id = p_event for update;
  if not found or e.status <> 'published' then
    raise exception 'event unavailable';
  end if;
  if coalesce(e.ends_at, e.starts_at) < now() then
    raise exception 'event is over';
  end if;
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' then
    raise exception 'invalid email';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'missing name';
  end if;
  if exists (select 1 from public.event_registrations where event_id = p_event and lower(email) = v_email and status <> 'cancelled') then
    raise exception 'already registered';
  end if;
  if (select count(*) from public.event_registrations where lower(email) = v_email and created_at > now() - interval '1 hour') >= 10
     or (select count(*) from public.event_registrations where created_at > now() - interval '1 minute') >= 60 then
    raise exception 'rate limited';
  end if;

  v_status := case when e.capacity is not null and e.seats_taken + v_attendees > e.capacity then 'waitlist' else 'registered' end;
  insert into public.event_registrations (event_id, user_id, name, email, company, phone, attendees, notes, status)
  values (
    p_event,
    auth.uid(),
    left(trim(p_name), 200),
    v_email,
    nullif(left(trim(p_company), 200), ''),
    nullif(left(trim(p_phone), 50), ''),
    v_attendees,
    nullif(left(trim(p_notes), 1000), ''),
    v_status
  );

  if auth.uid() is not null then
    insert into public.notifications (user_id, kind, data, link)
    values (auth.uid(), case when v_status = 'waitlist' then 'event_waitlist' else 'event_registered' end,
            jsonb_build_object('name', e.title), '/events/' || e.slug);
  end if;
  perform public.notify_staff('staff_event_registration',
    jsonb_build_object('name', trim(p_name), 'ref', e.title), '/app/admin/events/' || e.id);
  return v_status;
end;
$$;

-- Cancel your own registration. Frees seats; the first waiting registration that now fits moves up.
create or replace function public.cancel_event_registration(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.event_registrations;
begin
  select * into r from public.event_registrations
    where id = p_id and status <> 'cancelled' and (user_id = auth.uid() or public.is_staff());
  if not found then
    raise exception 'not found';
  end if;
  update public.event_registrations set status = 'cancelled' where id = r.id;
  if r.status = 'registered' then
    perform public.promote_waitlist(r.event_id);
  end if;
end;
$$;

create or replace function public.promote_waitlist(p_event uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.events;
  w public.event_registrations;
begin
  for w in select * from public.event_registrations where event_id = p_event and status = 'waitlist' order by created_at loop
    select * into e from public.events where id = p_event;
    exit when e.capacity is not null and e.seats_taken + w.attendees > e.capacity;
    update public.event_registrations set status = 'registered' where id = w.id;
    if w.user_id is not null then
      insert into public.notifications (user_id, kind, data, link)
      values (w.user_id, 'event_promoted', jsonb_build_object('name', e.title), '/events/' || e.slug);
    end if;
  end loop;
end;
$$;

revoke execute on function public.event_count_seats() from public, anon, authenticated;
revoke execute on function public.promote_waitlist(uuid) from public, anon, authenticated;
revoke execute on function public.register_for_event(uuid, text, text, text, text, int, text) from public;
revoke execute on function public.cancel_event_registration(uuid) from public, anon;
grant execute on function public.register_for_event(uuid, text, text, text, text, int, text) to anon, authenticated;
grant execute on function public.cancel_event_registration(uuid) to authenticated;
