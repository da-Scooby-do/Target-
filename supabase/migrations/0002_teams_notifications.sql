-- Companies and team accounts, saved addresses, in-app notifications.
-- Every customer belongs to one company; colleagues in the same company share quotes and shipments.
-- Accounts are linked to a company (and to earlier quotes) only once their email is confirmed.

-- ---------------------------------------------------------------- tables

create type public.member_role as enum ('owner', 'member');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 200),
  vat_number text check (vat_number is null or length(vat_number) <= 50),
  country text check (country is null or length(country) <= 100),
  created_at timestamptz not null default now()
);

create table public.company_members (
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);
-- One company per person in this version.
create unique index company_members_one_company on public.company_members (user_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create unique index invitations_open_once on public.invitations (company_id, lower(email)) where accepted_at is null;

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  label text not null check (length(trim(label)) between 1 and 100),
  contact_name text check (contact_name is null or length(contact_name) <= 200),
  street text not null check (length(trim(street)) between 1 and 200),
  postcode text check (postcode is null or length(postcode) <= 20),
  city text not null check (length(trim(city)) between 1 and 100),
  country text not null check (length(trim(country)) between 1 and 100),
  phone text check (phone is null or length(phone) <= 50),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index addresses_company_idx on public.addresses (company_id, label);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in (
    'quote_received', 'quote_priced', 'shipment_booked', 'shipment_update', 'team_joined',
    'staff_new_quote', 'staff_quote_answered'
  )),
  data jsonb not null default '{}'::jsonb,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.profiles add column if not exists phone_verified boolean not null default false;
alter table public.quotes add column company_id uuid references public.companies (id) on delete set null;
alter table public.quotes add column packages jsonb;
alter table public.quotes add column incoterm text check (incoterm is null or length(incoterm) <= 10);
alter table public.quotes add column customer_reference text check (customer_reference is null or length(customer_reference) <= 100);
alter table public.shipments add column company_id uuid references public.companies (id) on delete set null;
create index quotes_company_idx on public.quotes (company_id, created_at desc);
create index shipments_company_idx on public.shipments (company_id, created_at desc);

-- ---------------------------------------------------------------- helpers

create or replace function public.my_company_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select company_id from public.company_members where user_id = auth.uid();
$$;

create or replace function public.is_company_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.company_members where user_id = auth.uid() and role = 'owner');
$$;

-- Notify everyone in a company (or the single customer when there is no company).
create or replace function public.notify(p_company uuid, p_customer uuid, p_kind text, p_data jsonb, p_link text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_company is not null then
    insert into public.notifications (user_id, kind, data, link)
    select m.user_id, p_kind, p_data, p_link from public.company_members m where m.company_id = p_company;
  elsif p_customer is not null then
    insert into public.notifications (user_id, kind, data, link) values (p_customer, p_kind, p_data, p_link);
  end if;
end;
$$;

-- Give a confirmed account its company: join an open invitation, else create a company of its own.
-- Then attach quotes and shipments sent earlier with the same email.
create or replace function public.link_confirmed_user(p_user uuid, p_email text, p_meta jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company uuid;
  v_invite public.invitations;
  v_name text;
begin
  select company_id into v_company from public.company_members where user_id = p_user;
  if v_company is null then
    select * into v_invite from public.invitations
      where lower(email) = lower(p_email) and accepted_at is null
      order by created_at desc limit 1;
    if found then
      insert into public.company_members (company_id, user_id, role) values (v_invite.company_id, p_user, 'member');
      update public.invitations set accepted_at = now() where id = v_invite.id;
      v_company := v_invite.company_id;
      perform public.notify(v_company, null, 'team_joined',
        jsonb_build_object('name', coalesce(p_meta ->> 'full_name', p_email)), '/app/team');
    else
      v_name := coalesce(nullif(trim(p_meta ->> 'company'), ''), nullif(trim(p_meta ->> 'full_name'), ''), split_part(p_email, '@', 1));
      insert into public.companies (name) values (left(v_name, 200)) returning id into v_company;
      insert into public.company_members (company_id, user_id, role) values (v_company, p_user, 'owner');
    end if;
  end if;

  update public.quotes set customer_id = coalesce(customer_id, p_user), company_id = coalesce(company_id, v_company)
    where lower(email) = lower(p_email) and (customer_id is null or customer_id = p_user) and company_id is null;
  update public.shipments s set customer_id = coalesce(s.customer_id, q.customer_id), company_id = coalesce(s.company_id, q.company_id)
    from public.quotes q
    where s.quote_id = q.id and q.company_id = v_company and s.company_id is null;
end;
$$;

-- Replace the sign-up trigger: create the profile on insert; link only once the email is confirmed.
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
  insert into public.profiles (id, email, full_name, phone, locale)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 200),
    left(new.raw_user_meta_data ->> 'phone', 50),
    user_locale
  )
  on conflict (id) do nothing;
  if new.email_confirmed_at is not null then
    perform public.link_confirmed_user(new.id, new.email, new.raw_user_meta_data);
  end if;
  return new;
end;
$$;

create or replace function public.handle_user_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    perform public.link_confirmed_user(new.id, new.email, new.raw_user_meta_data);
  end if;
  return new;
end;
$$;

create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users
  for each row execute function public.handle_user_confirmed();

-- Kept for the app to call on load; now also covers company linking.
create or replace function public.claim_my_quotes()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := auth.jwt() ->> 'email';
begin
  if auth.uid() is null or v_email is null then
    return;
  end if;
  perform public.link_confirmed_user(auth.uid(), v_email, '{}'::jsonb);
end;
$$;

-- ---------------------------------------------------------------- notification triggers

create or replace function public.on_quote_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.notify(new.company_id, new.customer_id, 'quote_received',
      jsonb_build_object('ref', new.reference, 'from', new.origin, 'to', new.destination), '/app/quotes/' || new.reference);
    insert into public.notifications (user_id, kind, data, link)
      select p.id, 'staff_new_quote',
        jsonb_build_object('ref', new.reference, 'from', new.origin, 'to', new.destination, 'name', new.name),
        '/app/admin/quotes/' || new.reference
      from public.profiles p where p.role = 'staff';
  elsif new.status = 'quoted' and (old.status is distinct from 'quoted' or old.price is distinct from new.price) then
    perform public.notify(new.company_id, new.customer_id, 'quote_priced',
      jsonb_build_object('ref', new.reference, 'from', new.origin, 'to', new.destination), '/app/quotes/' || new.reference);
  elsif new.status in ('accepted', 'declined') and old.status = 'quoted' then
    insert into public.notifications (user_id, kind, data, link)
      select p.id, 'staff_quote_answered',
        jsonb_build_object('ref', new.reference, 'status', new.status, 'name', new.name),
        '/app/admin/quotes/' || new.reference
      from public.profiles p where p.role = 'staff';
  end if;
  return new;
end;
$$;

create trigger quotes_notify after insert or update on public.quotes
  for each row execute function public.on_quote_change();

create or replace function public.on_shipment_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.notify(new.company_id, new.customer_id, 'shipment_booked',
    jsonb_build_object('ref', new.reference, 'from', new.origin, 'to', new.destination), '/app/shipments/' || new.reference);
  return new;
end;
$$;

create trigger shipments_notify after insert on public.shipments
  for each row execute function public.on_shipment_insert();

create or replace function public.on_shipment_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.shipments;
begin
  if new.status = 'booked' then
    return new; -- the booking itself is already notified
  end if;
  select * into s from public.shipments where id = new.shipment_id;
  perform public.notify(s.company_id, s.customer_id, 'shipment_update',
    jsonb_build_object('ref', s.reference, 'status', new.status, 'location', new.location), '/app/shipments/' || s.reference);
  return new;
end;
$$;

create trigger shipment_events_notify after insert on public.shipment_events
  for each row execute function public.on_shipment_event();

-- Shipments booked from a quote inherit its company.
create or replace function public.shipment_company_default()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.company_id is null and new.quote_id is not null then
    select company_id into new.company_id from public.quotes where id = new.quote_id;
  end if;
  return new;
end;
$$;

create trigger shipments_company_default before insert on public.shipments
  for each row execute function public.shipment_company_default();

-- ---------------------------------------------------------------- row level security

alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.invitations enable row level security;
alter table public.addresses enable row level security;
alter table public.notifications enable row level security;

create policy "companies: members and staff read" on public.companies
  for select to authenticated using (id = (select public.my_company_id()) or (select public.is_staff()));
create policy "companies: owner updates" on public.companies
  for update to authenticated
  using (id = (select public.my_company_id()) and (select public.is_company_owner()))
  with check (id = (select public.my_company_id()));

-- People with an open invitation can see the name of the company that invited them.
create policy "companies: invitees read" on public.companies
  for select to authenticated using (
    exists (
      select 1 from public.invitations i
      where i.company_id = companies.id and i.accepted_at is null
        and lower(i.email) = lower((select auth.jwt()) ->> 'email')
    )
  );

create policy "members: same company and staff read" on public.company_members
  for select to authenticated using (company_id = (select public.my_company_id()) or (select public.is_staff()));

create policy "profiles: colleagues read" on public.profiles
  for select to authenticated using (
    id in (select user_id from public.company_members where company_id = (select public.my_company_id()))
  );

create policy "invitations: company reads" on public.invitations
  for select to authenticated using (company_id = (select public.my_company_id()));
create policy "invitations: invitee reads own" on public.invitations
  for select to authenticated using (lower(email) = lower((select auth.jwt()) ->> 'email') and accepted_at is null);

create policy "addresses: company reads" on public.addresses
  for select to authenticated using (company_id = (select public.my_company_id()));
create policy "addresses: company inserts" on public.addresses
  for insert to authenticated with check (company_id = (select public.my_company_id()));
create policy "addresses: company updates" on public.addresses
  for update to authenticated using (company_id = (select public.my_company_id())) with check (company_id = (select public.my_company_id()));
create policy "addresses: company deletes" on public.addresses
  for delete to authenticated using (company_id = (select public.my_company_id()));

create policy "notifications: own read" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications: own mark read" on public.notifications
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke update on public.notifications from authenticated, anon;
grant update (read_at) on public.notifications to authenticated;

-- Company-wide visibility for quotes and shipments (colleagues share them).
alter policy "quotes: read own or staff" on public.quotes rename to "quotes: company, own or staff";
alter policy "quotes: company, own or staff" on public.quotes using (
    customer_id = (select auth.uid())
    or (company_id is not null and company_id = (select public.my_company_id()))
    or (select public.is_staff())
  );

alter policy "shipments: read own or staff" on public.shipments rename to "shipments: company, own or staff";
alter policy "shipments: company, own or staff" on public.shipments using (
    customer_id = (select auth.uid())
    or (company_id is not null and company_id = (select public.my_company_id()))
    or (select public.is_staff())
  );

-- Events and documents follow their shipment's visibility.
alter policy "events: read with shipment" on public.shipment_events
  using (exists (select 1 from public.shipments s where s.id = shipment_id));
alter policy "documents: read with shipment" on public.documents
  using (exists (select 1 from public.shipments s where s.id = shipment_id));

-- Added next to the 0001 "customer read own" policy (storage policies can't be altered from a migration).
create policy "documents bucket: customer read" on storage.objects
  for select to authenticated using (
    bucket_id = 'documents'
    and exists (select 1 from public.documents d where d.storage_path = objects.name)
  );

-- ---------------------------------------------------------------- functions called by the app

-- Quote requests now carry the company, packages, Incoterm and the customer's own reference.
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
  v_customer uuid;
  v_company uuid;
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
  if (select count(*) from public.quotes where lower(email) = v_email and created_at > now() - interval '1 hour') >= 10
     or (select count(*) from public.quotes where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'rate limited';
  end if;
  if payload ? 'packages' and (jsonb_typeof(payload -> 'packages') <> 'array' or jsonb_array_length(payload -> 'packages') > 50) then
    raise exception 'invalid packages';
  end if;

  if auth.uid() is not null then
    v_customer := auth.uid();
    v_company := public.my_company_id();
  end if;

  ref := public.new_reference('Q');
  insert into public.quotes (
    reference, customer_id, company_id, email, name, company, phone, service, mode,
    origin, destination, ready_date, cargo, weight, notes, locale, packages, incoterm, customer_reference
  ) values (
    ref,
    v_customer,
    v_company,
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
    v_locale,
    payload -> 'packages',
    nullif(left(trim(payload ->> 'incoterm'), 10), ''),
    nullif(left(trim(payload ->> 'customer_reference'), 100), '')
  );
  return ref;
end;
$$;

-- Customers in the same company can answer each other's quotes.
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
  select * into q from public.quotes
    where reference = ref
      and (customer_id = auth.uid() or (company_id is not null and company_id = public.my_company_id()));
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

-- Team: owners invite colleagues by email. Existing accounts accept in the app; new ones join on sign-up.
create or replace function public.invite_member(p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company uuid := public.my_company_id();
  v_email text := lower(trim(p_email));
  v_id uuid;
begin
  if v_company is null or not public.is_company_owner() then
    raise exception 'only the company owner can invite';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' then
    raise exception 'invalid email';
  end if;
  if exists (
    select 1 from public.company_members m join public.profiles p on p.id = m.user_id
    where m.company_id = v_company and lower(p.email) = v_email
  ) then
    raise exception 'already a member';
  end if;
  if (select count(*) from public.invitations where company_id = v_company and created_at > now() - interval '1 day') >= 20 then
    raise exception 'rate limited';
  end if;
  insert into public.invitations (company_id, email, invited_by) values (v_company, v_email, auth.uid())
    on conflict (company_id, lower(email)) where accepted_at is null do update set created_at = now()
    returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.revoke_invitation(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_company_owner() then
    raise exception 'only the company owner can revoke';
  end if;
  delete from public.invitations where id = p_id and company_id = public.my_company_id() and accepted_at is null;
end;
$$;

-- An existing account accepts an invitation: it moves to the new company.
-- Its own quotes stay visible to it (customer_id); an empty old company is removed.
create or replace function public.accept_invitation(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.invitations;
  v_old uuid := public.my_company_id();
begin
  select * into v_invite from public.invitations
    where id = p_id and accepted_at is null and lower(email) = lower(auth.jwt() ->> 'email');
  if not found then
    raise exception 'invitation not found';
  end if;
  if v_old = v_invite.company_id then
    update public.invitations set accepted_at = now() where id = p_id;
    return;
  end if;
  if v_old is not null and public.is_company_owner()
     and exists (select 1 from public.company_members where company_id = v_old and user_id <> auth.uid()) then
    raise exception 'transfer ownership first';
  end if;
  delete from public.company_members where user_id = auth.uid();
  insert into public.company_members (company_id, user_id, role) values (v_invite.company_id, auth.uid(), 'member');
  update public.invitations set accepted_at = now() where id = p_id;
  if v_old is not null and not exists (select 1 from public.company_members where company_id = v_old) then
    delete from public.companies where id = v_old;
  end if;
  perform public.notify(v_invite.company_id, null, 'team_joined',
    jsonb_build_object('name', coalesce((select full_name from public.profiles where id = auth.uid()), auth.jwt() ->> 'email')),
    '/app/team');
end;
$$;

-- Owners remove a colleague; the removed person gets a company of their own again.
create or replace function public.remove_member(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company uuid := public.my_company_id();
  v_name text;
  v_new uuid;
begin
  if not public.is_company_owner() then
    raise exception 'only the company owner can remove members';
  end if;
  if p_user = auth.uid() then
    raise exception 'owners cannot remove themselves';
  end if;
  delete from public.company_members where company_id = v_company and user_id = p_user;
  if not found then
    raise exception 'not a member';
  end if;
  select coalesce(full_name, split_part(email, '@', 1)) into v_name from public.profiles where id = p_user;
  insert into public.companies (name) values (left(v_name, 200)) returning id into v_new;
  insert into public.company_members (company_id, user_id, role) values (v_new, p_user, 'owner');
end;
$$;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.my_company_id() to authenticated;
grant execute on function public.is_company_owner() to authenticated;
grant execute on function public.create_quote(jsonb) to anon, authenticated;
grant execute on function public.track_shipment(text) to anon, authenticated;
grant execute on function public.respond_to_quote(text, boolean) to authenticated;
grant execute on function public.claim_my_quotes() to authenticated;
grant execute on function public.new_reference(text) to authenticated;
grant execute on function public.invite_member(text) to authenticated;
grant execute on function public.revoke_invitation(uuid) to authenticated;
grant execute on function public.accept_invitation(uuid) to authenticated;
grant execute on function public.remove_member(uuid) to authenticated;
