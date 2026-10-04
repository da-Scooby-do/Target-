-- Marketplace: building materials (wood, doors, ceramics, more) sold by TFS and approved suppliers.
-- Prices are fixed per unit; staff can change any price. Customers order into a cart, staff confirm
-- the order and add shipping, and invoice outside the app. Suppliers apply, staff approve them, and
-- every new or re-priced supplier product is reviewed by staff before it shows in the catalogue.

-- ---------------------------------------------------------------- types and tables

create type public.supplier_status as enum ('pending', 'approved', 'suspended');
create type public.product_status as enum ('pending', 'active', 'hidden', 'rejected');
create type public.order_status as enum ('submitted', 'confirmed', 'shipped', 'delivered', 'cancelled');

create table public.product_categories (
  slug text primary key,
  sort int not null default 0,
  name_en text not null,
  name_nl text not null,
  name_ar text not null
);

insert into public.product_categories (slug, sort, name_en, name_nl, name_ar) values
  ('wood', 1, 'Wood & timber', 'Hout', 'الأخشاب'),
  ('doors', 2, 'Doors', 'Deuren', 'الأبواب'),
  ('ceramics', 3, 'Ceramics & tiles', 'Keramiek & tegels', 'السيراميك والبلاط'),
  ('building', 4, 'Building materials', 'Bouwmaterialen', 'مواد البناء');

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 200),
  country text check (country is null or length(country) <= 100),
  description text check (description is null or length(description) <= 2000),
  website text check (website is null or length(website) <= 300),
  status public.supplier_status not null default 'pending',
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers (id) on delete cascade, -- null: sold by TFS
  category text not null references public.product_categories (slug),
  name text not null check (length(trim(name)) between 1 and 200),
  description text check (description is null or length(description) <= 4000),
  unit text not null check (unit in ('piece', 'm2', 'm3', 'lm', 'pallet', 'set', 'kg')),
  price numeric(12, 2) not null check (price >= 0),
  currency text not null default 'EUR' check (currency in ('EUR', 'USD')),
  min_qty numeric(12, 2) not null default 1 check (min_qty > 0),
  origin_country text check (origin_country is null or length(origin_country) <= 100),
  lead_time_days int check (lead_time_days is null or lead_time_days between 0 and 365),
  specs jsonb not null default '[]'::jsonb check (jsonb_typeof(specs) = 'array' and jsonb_array_length(specs) <= 20),
  images text[] not null default '{}' check (cardinality(images) <= 8),
  status public.product_status not null default 'pending',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_catalogue_idx on public.products (status, category, created_at desc);
create index products_supplier_idx on public.products (supplier_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  company_id uuid references public.companies (id) on delete set null,
  customer_id uuid references public.profiles (id) on delete set null,
  status public.order_status not null default 'submitted',
  delivery_address text not null check (length(trim(delivery_address)) between 1 and 600),
  notes text check (notes is null or length(notes) <= 2000),
  customer_reference text check (customer_reference is null or length(customer_reference) <= 100),
  currency text not null default 'EUR',
  subtotal numeric(12, 2) not null,
  shipping numeric(12, 2) check (shipping is null or shipping >= 0),
  staff_note text check (staff_note is null or length(staff_note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index orders_company_idx on public.orders (company_id, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  supplier_id uuid references public.suppliers (id) on delete set null,
  name text not null,
  unit text not null,
  unit_price numeric(12, 2) not null,
  quantity numeric(12, 2) not null check (quantity > 0),
  line_total numeric(12, 2) not null
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_supplier_idx on public.order_items (supplier_id);

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- helpers

create or replace function public.my_supplier_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.id from public.suppliers s where s.company_id = public.my_company_id();
$$;

create or replace function public.my_supplier_approved()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.suppliers s where s.company_id = public.my_company_id() and s.status = 'approved');
$$;

-- Orders a customer (or colleague) can see.
create or replace function public.can_see_order(p_order uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.orders o
    where o.id = p_order
      and (o.customer_id = auth.uid()
           or (o.company_id is not null and o.company_id = public.my_company_id())
           or public.is_staff())
  );
$$;

create or replace function public.new_order_reference()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  candidate text;
begin
  loop
    code := '';
    for i in 1..5 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    candidate := 'TFS-O-' || extract(year from now())::int || '-' || code;
    exit when not exists (select 1 from public.orders where reference = candidate);
  end loop;
  return candidate;
end;
$$;

-- Supplier edits go back to review; only staff publish, reject or change status freely.
create or replace function public.product_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Staff, and database maintenance without a signed-in user (migrations, the dashboard), are trusted.
  if auth.uid() is null or public.is_staff() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.created_by := auth.uid();
    return new;
  end if;
  new.supplier_id := old.supplier_id;
  if new.status = 'hidden' then
    return new;
  end if;
  if old.status = 'active' and new.price = old.price and new.status = 'active' then
    return new;
  end if;
  new.status := 'pending';
  return new;
end;
$$;

create trigger products_guard before insert or update on public.products
  for each row execute function public.product_guard();

-- ---------------------------------------------------------------- notifications

alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (kind in (
  'quote_received', 'quote_priced', 'shipment_booked', 'shipment_update', 'team_joined',
  'staff_new_quote', 'staff_quote_answered',
  'order_placed', 'order_update', 'staff_new_order', 'supplier_new_order',
  'supplier_approved', 'staff_new_supplier', 'product_approved', 'product_rejected', 'staff_product_review'
));

create or replace function public.notify_staff(p_kind text, p_data jsonb, p_link text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, kind, data, link)
  select p.id, p_kind, p_data, p_link from public.profiles p where p.role = 'staff';
$$;

create or replace function public.on_product_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company uuid;
begin
  if new.supplier_id is null then
    return new;
  end if;
  select company_id into v_company from public.suppliers where id = new.supplier_id;
  if new.status = 'pending' and (tg_op = 'INSERT' or old.status is distinct from 'pending') then
    perform public.notify_staff('staff_product_review', jsonb_build_object('name', new.name), '/app/admin/products?status=pending');
  elsif tg_op = 'UPDATE' and new.status = 'active' and old.status <> 'active' then
    perform public.notify(v_company, null, 'product_approved', jsonb_build_object('name', new.name), '/app/supplier/products');
  elsif tg_op = 'UPDATE' and new.status = 'rejected' and old.status <> 'rejected' then
    perform public.notify(v_company, null, 'product_rejected', jsonb_build_object('name', new.name), '/app/supplier/products');
  end if;
  return new;
end;
$$;

create trigger products_notify after insert or update of status on public.products
  for each row execute function public.on_product_change();

-- ---------------------------------------------------------------- row level security

alter table public.product_categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "categories: everyone reads" on public.product_categories
  for select to anon, authenticated using (true);

create policy "suppliers: approved are public" on public.suppliers
  for select to anon, authenticated using (status = 'approved');
create policy "suppliers: own company and staff read" on public.suppliers
  for select to authenticated using (company_id = (select public.my_company_id()) or (select public.is_staff()));
create policy "suppliers: own company updates profile" on public.suppliers
  for update to authenticated using (company_id = (select public.my_company_id())) with check (company_id = (select public.my_company_id()));
revoke update on public.suppliers from authenticated, anon;
grant update (name, country, description, website) on public.suppliers to authenticated;

create policy "products: active are public" on public.products
  for select to anon, authenticated using (
    status = 'active'
    and (supplier_id is null or exists (select 1 from public.suppliers s where s.id = supplier_id and s.status = 'approved'))
  );
create policy "products: own supplier and staff read" on public.products
  for select to authenticated using (supplier_id = (select public.my_supplier_id()) or (select public.is_staff()));
create policy "products: approved supplier or staff inserts" on public.products
  for insert to authenticated with check (
    (select public.is_staff())
    or (supplier_id = (select public.my_supplier_id()) and (select public.my_supplier_approved()))
  );
create policy "products: own supplier or staff updates" on public.products
  for update to authenticated
  using ((select public.is_staff()) or supplier_id = (select public.my_supplier_id()))
  with check ((select public.is_staff()) or supplier_id = (select public.my_supplier_id()));
create policy "products: own supplier or staff deletes" on public.products
  for delete to authenticated using ((select public.is_staff()) or supplier_id = (select public.my_supplier_id()));

create policy "orders: customer, company, staff or supplier read" on public.orders
  for select to authenticated using (
    customer_id = (select auth.uid())
    or (company_id is not null and company_id = (select public.my_company_id()))
    or (select public.is_staff())
    or exists (select 1 from public.order_items i where i.order_id = orders.id and i.supplier_id = (select public.my_supplier_id()))
  );

create policy "order items: with the order, or own supplier lines" on public.order_items
  for select to authenticated using (
    (select public.can_see_order(order_id))
    or supplier_id = (select public.my_supplier_id())
  );

-- ---------------------------------------------------------------- product images (public bucket)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "products bucket: staff and own supplier upload" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'products'
    and ((select public.is_staff())
         or ((storage.foldername(name))[1] = (select public.my_supplier_id())::text and (select public.my_supplier_approved())))
  );
create policy "products bucket: staff and own supplier delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'products'
    and ((select public.is_staff()) or (storage.foldername(name))[1] = (select public.my_supplier_id())::text)
  );

-- ---------------------------------------------------------------- functions called by the app

-- A company applies to sell on the marketplace; staff approve it.
create or replace function public.apply_as_supplier(p_name text, p_country text, p_description text, p_website text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company uuid := public.my_company_id();
  v_id uuid;
begin
  if v_company is null or not public.is_company_owner() then
    raise exception 'only the company owner can apply';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'missing name';
  end if;
  insert into public.suppliers (company_id, name, country, description, website)
  values (
    v_company,
    left(trim(p_name), 200),
    nullif(left(trim(p_country), 100), ''),
    nullif(left(trim(p_description), 2000), ''),
    nullif(left(trim(p_website), 300), '')
  )
  on conflict (company_id) do nothing
  returning id into v_id;
  if v_id is null then
    raise exception 'already applied';
  end if;
  perform public.notify_staff('staff_new_supplier', jsonb_build_object('name', trim(p_name)), '/app/admin/suppliers');
  return v_id;
end;
$$;

create or replace function public.set_supplier_status(p_id uuid, p_status public.supplier_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.suppliers;
begin
  if not public.is_staff() then
    raise exception 'staff only';
  end if;
  update public.suppliers
    set status = p_status, approved_at = case when p_status = 'approved' then coalesce(approved_at, now()) else approved_at end
    where id = p_id
    returning * into s;
  if not found then
    raise exception 'not found';
  end if;
  if p_status = 'approved' then
    perform public.notify(s.company_id, null, 'supplier_approved', jsonb_build_object('name', s.name), '/app/supplier');
  end if;
end;
$$;

-- Place an order from the cart. Prices are read from the catalogue, never from the browser.
create or replace function public.place_order(p_items jsonb, p_delivery text, p_notes text, p_reference text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ref text;
  v_order uuid;
  v_currency text;
  v_subtotal numeric(12, 2) := 0;
  v_item jsonb;
  v_qty numeric(12, 2);
  p public.products;
  v_supplier_company uuid;
begin
  if auth.uid() is null then
    raise exception 'sign in first';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'invalid items';
  end if;
  if coalesce(trim(p_delivery), '') = '' then
    raise exception 'missing delivery address';
  end if;
  if (select count(*) from public.orders where customer_id = auth.uid() and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'rate limited';
  end if;

  v_ref := public.new_order_reference();
  insert into public.orders (reference, company_id, customer_id, delivery_address, notes, customer_reference, subtotal)
  values (
    v_ref,
    public.my_company_id(),
    auth.uid(),
    left(trim(p_delivery), 600),
    nullif(left(trim(p_notes), 2000), ''),
    nullif(left(trim(p_reference), 100), ''),
    0
  )
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select pr.* into p from public.products pr
      where pr.id = (v_item ->> 'product_id')::uuid
        and pr.status = 'active'
        and (pr.supplier_id is null or exists (select 1 from public.suppliers s where s.id = pr.supplier_id and s.status = 'approved'));
    if not found then
      raise exception 'product unavailable';
    end if;
    v_qty := round((v_item ->> 'quantity')::numeric, 2);
    if v_qty is null or v_qty < p.min_qty or v_qty > 1000000 then
      raise exception 'invalid quantity';
    end if;
    if v_currency is null then
      v_currency := p.currency;
    elsif v_currency <> p.currency then
      raise exception 'mixed currencies';
    end if;
    insert into public.order_items (order_id, product_id, supplier_id, name, unit, unit_price, quantity, line_total)
    values (v_order, p.id, p.supplier_id, p.name, p.unit, p.price, v_qty, round(p.price * v_qty, 2));
    v_subtotal := v_subtotal + round(p.price * v_qty, 2);
  end loop;

  update public.orders set subtotal = v_subtotal, currency = coalesce(v_currency, 'EUR') where id = v_order;

  perform public.notify(public.my_company_id(), auth.uid(), 'order_placed', jsonb_build_object('ref', v_ref), '/app/orders/' || v_ref);
  perform public.notify_staff('staff_new_order',
    jsonb_build_object('ref', v_ref, 'name', coalesce((select full_name from public.profiles where id = auth.uid()), '')),
    '/app/admin/orders/' || v_ref);
  for v_supplier_company in
    select distinct s.company_id from public.order_items i join public.suppliers s on s.id = i.supplier_id where i.order_id = v_order
  loop
    perform public.notify(v_supplier_company, null, 'supplier_new_order', jsonb_build_object('ref', v_ref), '/app/supplier/orders');
  end loop;
  return v_ref;
end;
$$;

-- Staff move an order along: confirm it with shipping, then shipped, delivered or cancelled.
create or replace function public.update_order(p_ref text, p_status public.order_status, p_shipping numeric, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.orders;
begin
  if not public.is_staff() then
    raise exception 'staff only';
  end if;
  update public.orders
    set status = p_status,
        shipping = coalesce(p_shipping, shipping),
        staff_note = coalesce(nullif(left(trim(p_note), 2000), ''), staff_note),
        confirmed_at = case when p_status = 'confirmed' then coalesce(confirmed_at, now()) else confirmed_at end
    where reference = p_ref
    returning * into o;
  if not found then
    raise exception 'not found';
  end if;
  perform public.notify(o.company_id, o.customer_id, 'order_update',
    jsonb_build_object('ref', o.reference, 'status', o.status), '/app/orders/' || o.reference);
end;
$$;

-- Customers can cancel an order until staff confirm it.
create or replace function public.cancel_order(p_ref text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.orders;
begin
  select * into o from public.orders
    where reference = p_ref
      and (customer_id = auth.uid() or (company_id is not null and company_id = public.my_company_id()));
  if not found then
    raise exception 'not found';
  end if;
  if o.status <> 'submitted' then
    raise exception 'already confirmed';
  end if;
  update public.orders set status = 'cancelled' where id = o.id;
  perform public.notify_staff('staff_new_order', jsonb_build_object('ref', o.reference, 'name', 'cancelled'), '/app/admin/orders/' || o.reference);
end;
$$;

revoke execute on function public.my_supplier_id() from public, anon;
revoke execute on function public.my_supplier_approved() from public, anon;
revoke execute on function public.can_see_order(uuid) from public, anon;
revoke execute on function public.new_order_reference() from public, anon, authenticated;
revoke execute on function public.product_guard() from public, anon, authenticated;
revoke execute on function public.notify_staff(text, jsonb, text) from public, anon, authenticated;
revoke execute on function public.on_product_change() from public, anon, authenticated;
revoke execute on function public.apply_as_supplier(text, text, text, text) from public, anon;
revoke execute on function public.set_supplier_status(uuid, public.supplier_status) from public, anon;
revoke execute on function public.place_order(jsonb, text, text, text) from public, anon;
revoke execute on function public.update_order(text, public.order_status, numeric, text) from public, anon;
revoke execute on function public.cancel_order(text) from public, anon;
grant execute on function public.my_supplier_id() to authenticated;
grant execute on function public.my_supplier_approved() to authenticated;
grant execute on function public.can_see_order(uuid) to authenticated;
grant execute on function public.apply_as_supplier(text, text, text, text) to authenticated;
grant execute on function public.set_supplier_status(uuid, public.supplier_status) to authenticated;
grant execute on function public.place_order(jsonb, text, text, text) to authenticated;
grant execute on function public.update_order(text, public.order_status, numeric, text) to authenticated;
grant execute on function public.cancel_order(text) to authenticated;
