-- Contact form messages: stored so staff see them in the admin, even when no notification email is set up.

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 200),
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  phone text check (phone is null or length(phone) <= 50),
  subject text not null check (length(trim(subject)) between 1 and 200),
  message text not null check (length(trim(message)) between 1 and 5000),
  locale text not null default 'en',
  handled boolean not null default false,
  created_at timestamptz not null default now()
);
create index contact_messages_created_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

create policy "messages: staff read" on public.contact_messages
  for select to authenticated using ((select public.is_staff()));
create policy "messages: staff update" on public.contact_messages
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (kind in (
  'quote_received', 'quote_priced', 'shipment_booked', 'shipment_update', 'team_joined',
  'staff_new_quote', 'staff_quote_answered',
  'order_placed', 'order_update', 'staff_new_order', 'supplier_new_order',
  'supplier_approved', 'staff_new_supplier', 'product_approved', 'product_rejected', 'staff_product_review',
  'event_registered', 'event_waitlist', 'event_promoted', 'staff_event_registration',
  'staff_new_message'
));

-- Anyone can send a message; the form is the only way in. Rate limited per email and overall.
create or replace function public.send_contact_message(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(payload ->> 'email'));
  v_id uuid;
begin
  if (select count(*) from public.contact_messages where lower(email) = v_email and created_at > now() - interval '1 hour') >= 5
     or (select count(*) from public.contact_messages where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'rate limited';
  end if;
  insert into public.contact_messages (name, email, phone, subject, message, locale)
  values (
    left(trim(payload ->> 'name'), 200),
    v_email,
    nullif(left(trim(coalesce(payload ->> 'phone', '')), 50), ''),
    left(trim(payload ->> 'subject'), 200),
    left(trim(payload ->> 'message'), 5000),
    coalesce(nullif(payload ->> 'locale', ''), 'en')
  )
  returning id into v_id;
  perform public.notify_staff('staff_new_message',
    jsonb_build_object('name', trim(payload ->> 'name'), 'ref', left(trim(payload ->> 'subject'), 80)), '/app/admin/messages');
  return v_id;
end;
$$;

revoke execute on function public.send_contact_message(jsonb) from public;
grant execute on function public.send_contact_message(jsonb) to anon, authenticated;
