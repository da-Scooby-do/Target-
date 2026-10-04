-- Target Facility Service: customer portal and staff admin.
-- Customers see only their own quotes and shipments. Staff (profiles.role = 'staff') see everything.
-- Writes that customers or visitors make go through security-definer functions with their own checks.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- types

create type public.user_role as enum ('customer', 'staff');
create type public.quote_status as enum ('pending', 'quoted', 'accepted', 'declined', 'expired');
create type public.shipment_status as enum ('booked', 'picked_up', 'in_transit', 'customs', 'delivered', 'cancelled');

-- ---------------------------------------------------------------- tables

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  company text,
  phone text,
  locale text not null default 'en' check (locale in ('en', 'nl', 'ar')),
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_id uuid references public.profiles (id) on delete set null,
  email text not null,
  name text not null,
  company text,
  phone text,
  service text not null,
  mode text not null check (mode in ('sea', 'air', 'road', 'unsure')),
  origin text not null,
  destination text not null,
  ready_date date,
  cargo text not null,
  weight text,
  notes text,
  locale text not null default 'en' check (locale in ('en', 'nl', 'ar')),
  status public.quote_status not null default 'pending',
  price numeric(12, 2) check (price is null or price >= 0),
  currency text not null default 'EUR',
  price_note text,
  valid_until date,
  quoted_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quotes_customer_idx on public.quotes (customer_id, created_at desc);
create index quotes_status_idx on public.quotes (status, created_at desc);
create index quotes_email_idx on public.quotes (lower(email));

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  quote_id uuid references public.quotes (id) on delete set null,
  customer_id uuid references public.profiles (id) on delete set null,
  mode text not null check (mode in ('sea', 'air', 'road', 'unsure')),
  origin text not null,
  destination text not null,
  status public.shipment_status not null default 'booked',
  eta date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shipments_customer_idx on public.shipments (customer_id, created_at desc);
create unique index shipments_quote_once on public.shipments (quote_id) where quote_id is not null;

create table public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  status public.shipment_status not null,
  location text,
  note text,
  occurred_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);
create index shipment_events_shipment_idx on public.shipment_events (shipment_id, occurred_at);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  name text not null,
  storage_path text not null unique,
  size integer,
  content_type text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index documents_shipment_idx on public.documents (shipment_id);

-- ---------------------------------------------------------------- helpers

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'staff');
$$;

-- Reference like TFS-Q-2026-7K3F (quotes) or TFS-S-2026-7K3F9P (shipments, longer: they are public to track).
create or replace function public.new_reference(kind text)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  len int := case when kind = 'S' then 6 else 4 end;
  code text;
  candidate text;
  taken boolean;
begin
  loop
    code := '';
    for i in 1..len loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    candidate := 'TFS-' || kind || '-' || extract(year from now())::int || '-' || code;
    if kind = 'S' then
      select exists (select 1 from public.shipments where reference = candidate) into taken;
    else
      select exists (select 1 from public.quotes where reference = candidate) into taken;
    end if;
    exit when not taken;
  end loop;
  return candidate;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger quotes_touch before update on public.quotes
  for each row execute function public.touch_updated_at();
create trigger shipments_touch before update on public.shipments
  for each row execute function public.touch_updated_at();

alter table public.shipments alter column reference set default public.new_reference('S');

-- A new milestone moves the shipment to that status.
create or replace function public.apply_shipment_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.shipments set status = new.status where id = new.shipment_id;
  return new;
end;
$$;

create trigger shipment_events_apply after insert on public.shipment_events
  for each row execute function public.apply_shipment_event();

-- New login: create the profile and attach any quotes sent earlier with the same email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_locale text := coalesce(new.raw_user_meta_data ->> 'locale', 'en');
begin
  if user_locale not in ('en', 'nl', 'ar') then
    user_locale := 'en';
  end if;
  insert into public.profiles (id, email, full_name, locale)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', user_locale)
  on conflict (id) do nothing;

  update public.quotes set customer_id = new.id
  where customer_id is null and lower(email) = lower(new.email);
  update public.shipments s set customer_id = new.id
  from public.quotes q
  where s.quote_id = q.id and q.customer_id = new.id and s.customer_id is null;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- row level security

alter table public.profiles enable row level security;
alter table public.quotes enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_events enable row level security;
alter table public.documents enable row level security;

create policy "profiles: read own or staff" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select public.is_staff()));
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Customers may only change these columns of their own profile (never role or email).
revoke update on public.profiles from authenticated, anon;
grant update (full_name, company, phone, locale) on public.profiles to authenticated;

create policy "quotes: read own or staff" on public.quotes
  for select to authenticated using (customer_id = (select auth.uid()) or (select public.is_staff()));
create policy "quotes: staff update" on public.quotes
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "shipments: read own or staff" on public.shipments
  for select to authenticated using (customer_id = (select auth.uid()) or (select public.is_staff()));
create policy "shipments: staff insert" on public.shipments
  for insert to authenticated with check ((select public.is_staff()));
create policy "shipments: staff update" on public.shipments
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "events: read with shipment" on public.shipment_events
  for select to authenticated using (
    exists (
      select 1 from public.shipments s
      where s.id = shipment_id and (s.customer_id = (select auth.uid()) or (select public.is_staff()))
    )
  );
create policy "events: staff insert" on public.shipment_events
  for insert to authenticated with check ((select public.is_staff()));

create policy "documents: read with shipment" on public.documents
  for select to authenticated using (
    exists (
      select 1 from public.shipments s
      where s.id = shipment_id and (s.customer_id = (select auth.uid()) or (select public.is_staff()))
    )
  );
create policy "documents: staff insert" on public.documents
  for insert to authenticated with check ((select public.is_staff()));
create policy "documents: staff delete" on public.documents
  for delete to authenticated using ((select public.is_staff()));

-- ---------------------------------------------------------------- functions called by the site

-- Quote request from the public form (visitor or logged-in customer).
create or replace function public.create_quote(payload jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  ref text;
  v_email text := lower(trim(payload ->> 'email'));
  v_locale text := coalesce(payload ->> 'locale', 'en');
begin
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' then
    raise exception 'invalid email';
  end if;
  if coalesce(trim(payload ->> 'name'), '') = '' or coalesce(trim(payload ->> 'origin'), '') = ''
     or coalesce(trim(payload ->> 'destination'), '') = '' or coalesce(trim(payload ->> 'cargo'), '') = '' then
    raise exception 'missing field';
  end if;
  if v_locale not in ('en', 'nl', 'ar') then
    v_locale := 'en';
  end if;
  -- Abuse limits: per email per hour, and overall per minute.
  if (select count(*) from public.quotes where lower(email) = v_email and created_at > now() - interval '1 hour') >= 5
     or (select count(*) from public.quotes where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'rate limited';
  end if;

  ref := public.new_reference('Q');
  insert into public.quotes (
    reference, customer_id, email, name, company, phone, service, mode,
    origin, destination, ready_date, cargo, weight, notes, locale
  ) values (
    ref,
    coalesce(
      auth.uid(),
      (select id from public.profiles where lower(email) = v_email limit 1)
    ),
    v_email,
    left(trim(payload ->> 'name'), 200),
    nullif(left(trim(payload ->> 'company'), 200), ''),
    nullif(left(trim(payload ->> 'phone'), 50), ''),
    left(payload ->> 'service', 100),
    coalesce(nullif(payload ->> 'mode', ''), 'unsure'),
    left(trim(payload ->> 'origin'), 200),
    left(trim(payload ->> 'destination'), 200),
    nullif(payload ->> 'ready_date', '')::date,
    left(trim(payload ->> 'cargo'), 2000),
    nullif(left(trim(payload ->> 'weight'), 500), ''),
    nullif(left(trim(payload ->> 'notes'), 2000), ''),
    v_locale
  );
  return ref;
end;
$$;

-- Public tracking by shipment reference. Returns only route and milestones, no customer details.
create or replace function public.track_shipment(ref text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'reference', s.reference,
    'status', s.status,
    'mode', s.mode,
    'origin', s.origin,
    'destination', s.destination,
    'eta', s.eta,
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'status', e.status, 'location', e.location, 'note', e.note, 'occurred_at', e.occurred_at
      ) order by e.occurred_at)
      from public.shipment_events e where e.shipment_id = s.id
    ), '[]'::jsonb)
  )
  from public.shipments s
  where s.reference = upper(trim(ref));
$$;

-- Customer accepts or declines a priced quote.
create or replace function public.respond_to_quote(ref text, accept boolean)
returns public.quote_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.quotes;
  next_status public.quote_status := case when accept then 'accepted' else 'declined' end;
begin
  select * into q from public.quotes where reference = ref and customer_id = auth.uid();
  if not found then
    raise exception 'not found';
  end if;
  if q.status <> 'quoted' then
    raise exception 'not open';
  end if;
  if q.valid_until is not null and q.valid_until < current_date then
    update public.quotes set status = 'expired' where id = q.id;
    raise exception 'expired';
  end if;
  update public.quotes set status = next_status, responded_at = now() where id = q.id;
  return next_status;
end;
$$;

-- Attach quotes sent before the account existed (also run by the sign-up trigger).
create or replace function public.claim_my_quotes()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.quotes set customer_id = auth.uid()
  where customer_id is null and lower(email) = lower(auth.jwt() ->> 'email');
  update public.shipments s set customer_id = auth.uid()
  from public.quotes q
  where s.quote_id = q.id and q.customer_id = auth.uid() and s.customer_id is null;
end;
$$;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.create_quote(jsonb) to anon, authenticated;
grant execute on function public.track_shipment(text) to anon, authenticated;
grant execute on function public.respond_to_quote(text, boolean) to authenticated;
grant execute on function public.claim_my_quotes() to authenticated;
-- new_reference is used as a column default by staff inserts.
grant execute on function public.new_reference(text) to authenticated;

-- ---------------------------------------------------------------- document storage

insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 15728640)
on conflict (id) do nothing;

create policy "documents bucket: staff all" on storage.objects
  for all to authenticated
  using (bucket_id = 'documents' and (select public.is_staff()))
  with check (bucket_id = 'documents' and (select public.is_staff()));

create policy "documents bucket: customer read own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and exists (
      select 1 from public.documents d
      join public.shipments s on s.id = d.shipment_id
      where d.storage_path = objects.name and s.customer_id = (select auth.uid())
    )
  );
