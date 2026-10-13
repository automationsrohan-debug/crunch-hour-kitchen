
-- ============ ENUMS ============
create type public.app_role as enum ('admin','manager','cashier','kitchen','rider');
create type public.order_status as enum ('new','accepted','preparing','ready','out_for_delivery','completed','cancelled');
create type public.order_type as enum ('delivery','pickup','walk_in','takeaway');
create type public.order_channel as enum ('online','pos');
create type public.expense_category as enum ('ingredients','packaging','rent','electricity','gas','salaries','delivery','maintenance','miscellaneous');

-- ============ ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;
create or replace function public.is_manager(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','manager'))
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Bootstrap: first signed-in user may claim admin only if no admin exists yet
create or replace function public.claim_first_admin()
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if exists (select 1 from public.user_roles where role = 'admin') then return false; end if;
  insert into public.user_roles(user_id, role) values (auth.uid(), 'admin');
  return true;
end $$;
revoke execute on function public.claim_first_admin() from anon, public;
grant execute on function public.claim_first_admin() to authenticated;

-- ============ AUDIT ============
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);
create index on public.audit_logs(created_at desc);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "Managers read audit" on public.audit_logs for select to authenticated using (public.is_manager(auth.uid()));

-- ============ SETTINGS ============
create table public.restaurant_settings (
  id int primary key default 1 check (id = 1),
  restaurant_name text not null default 'KRUNCH HOUR',
  phone text,
  whatsapp text,
  address text,
  opening_hours text,
  delivery_fee numeric(10,2) not null default 0 check (delivery_fee >= 0),
  free_delivery_over numeric(10,2),
  min_order_amount numeric(10,2) not null default 0,
  delivery_zones text,
  accepting_orders boolean not null default true,
  estimated_delivery_minutes int not null default 45,
  updated_at timestamptz not null default now()
);
insert into public.restaurant_settings(id) values (1);
grant select on public.restaurant_settings to anon, authenticated;
grant update on public.restaurant_settings to authenticated;
grant all on public.restaurant_settings to service_role;
alter table public.restaurant_settings enable row level security;
create policy "Public read settings" on public.restaurant_settings for select to anon, authenticated using (true);
create policy "Managers update settings" on public.restaurant_settings for update to authenticated using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));

-- ============ MENU ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 60),
  slug text not null unique,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null check (length(name) between 1 and 100),
  slug text not null unique,
  description text,
  image_key text,
  base_price numeric(10,2) not null check (base_price >= 0),
  is_available boolean not null default true,
  is_featured boolean not null default false,
  is_demo boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.products(category_id);
create table public.product_variations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  sort_order int not null default 0,
  is_available boolean not null default true
);
create index on public.product_variations(product_id);
create table public.addons (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  is_available boolean not null default true
);
create index on public.addons(category_id);

grant select on public.categories, public.products, public.product_variations, public.addons to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_variations, public.addons to authenticated;
grant all on public.categories, public.products, public.product_variations, public.addons to service_role;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variations enable row level security;
alter table public.addons enable row level security;
create policy "Public read categories" on public.categories for select to anon, authenticated using (is_active or public.is_staff(auth.uid()));
create policy "Managers write categories" on public.categories for all to authenticated using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));
create policy "Public read products" on public.products for select to anon, authenticated using (true);
create policy "Managers write products" on public.products for all to authenticated using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));
create policy "Public read variations" on public.product_variations for select to anon, authenticated using (true);
create policy "Managers write variations" on public.product_variations for all to authenticated using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));
create policy "Public read addons" on public.addons for select to anon, authenticated using (true);
create policy "Managers write addons" on public.addons for all to authenticated using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));

-- ============ COUPONS ============
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and length(code) between 3 and 30),
  description text,
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  min_order_amount numeric(10,2) not null default 0,
  max_discount numeric(10,2),
  max_uses int,
  used_count int not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.coupons to authenticated;
grant all on public.coupons to service_role;
alter table public.coupons enable row level security;
create policy "Staff read coupons" on public.coupons for select to authenticated using (public.is_staff(auth.uid()));
create policy "Managers write coupons" on public.coupons for all to authenticated using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));

-- ============ CUSTOMERS / ORDERS ============
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  default_address text,
  notes text,
  segment text,
  total_orders int not null default 0,
  total_spent numeric(12,2) not null default 0,
  last_order_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.customers(name);

create sequence public.order_number_seq start 1001;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  order_type order_type not null,
  channel order_channel not null default 'online',
  status order_status not null default 'new',
  delivery_address text,
  instructions text,
  subtotal numeric(12,2) not null,
  discount_amount numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  coupon_code text,
  payment_method text not null,
  rider_name text,
  inventory_deducted boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.orders(status);
create index on public.orders(created_at desc);
create index on public.orders(customer_id);
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variation_id uuid references public.product_variations(id) on delete set null,
  product_name text not null,
  variation_name text,
  addons jsonb not null default '[]',
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity between 1 and 50),
  line_total numeric(12,2) not null,
  notes text
);
create index on public.order_items(order_id);
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method text not null,
  amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending','paid','refunded')),
  received_by uuid,
  created_at timestamptz not null default now()
);
create index on public.payments(order_id);

grant select, insert, update, delete on public.customers, public.orders, public.order_items, public.payments to authenticated;
grant all on public.customers, public.orders, public.order_items, public.payments to service_role;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
create policy "Staff read customers" on public.customers for select to authenticated using (public.is_staff(auth.uid()));
create policy "Managers update customers" on public.customers for update to authenticated using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));
create policy "Staff read orders" on public.orders for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff update orders" on public.orders for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "Staff read items" on public.order_items for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff read payments" on public.payments for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff update payments" on public.payments for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- ============ INVENTORY ============
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null, phone text, notes text,
  created_at timestamptz not null default now()
);
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  unit text not null,
  current_stock numeric(12,3) not null default 0,
  low_stock_threshold numeric(12,3) not null default 0,
  cost_per_unit numeric(10,2),
  supplier_id uuid references public.suppliers(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variation_id uuid references public.product_variations(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0)
);
create index on public.recipes(product_id);
create table public.stock_movements (
  id bigint generated always as identity primary key,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  change numeric(12,3) not null,
  reason text not null check (reason in ('order','purchase','adjustment','waste')),
  order_id uuid references public.orders(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  unit_cost numeric(10,2),
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index on public.stock_movements(ingredient_id, created_at desc);
create unique index stock_movements_order_once on public.stock_movements(order_id, ingredient_id) where reason = 'order';
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  category expense_category not null,
  amount numeric(12,2) not null check (amount > 0),
  expense_date date not null default current_date,
  description text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index on public.expenses(expense_date);

grant select, insert, update, delete on public.suppliers, public.ingredients, public.recipes, public.stock_movements, public.expenses to authenticated;
grant all on public.suppliers, public.ingredients, public.recipes, public.stock_movements, public.expenses to service_role;
alter table public.suppliers enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.stock_movements enable row level security;
alter table public.expenses enable row level security;
create policy "Managers all suppliers" on public.suppliers for all to authenticated using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));
create policy "Staff read ingredients" on public.ingredients for select to authenticated using (public.is_staff(auth.uid()));
create policy "Managers write ingredients" on public.ingredients for all to authenticated using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));
create policy "Managers all recipes" on public.recipes for all to authenticated using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));
create policy "Managers read movements" on public.stock_movements for select to authenticated using (public.is_manager(auth.uid()));
create policy "Managers all expenses" on public.expenses for all to authenticated using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));

-- ============ ORDER PLACEMENT (server-side pricing) ============
create or replace function public.normalize_pk_phone(p text)
returns text language plpgsql immutable as $$
declare d text := regexp_replace(coalesce(p,''), '[\s\-()]', '', 'g');
begin
  if d ~ '^\+923[0-9]{9}$' then return '0' || substring(d from 4); end if;
  if d ~ '^923[0-9]{9}$' then return '0' || substring(d from 3); end if;
  if d ~ '^03[0-9]{9}$' then return d; end if;
  return null;
end $$;

create or replace function public.compute_coupon_discount(_code text, _subtotal numeric)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare c record; d numeric;
begin
  select * into c from public.coupons where code = upper(trim(_code)) and is_active;
  if not found then raise exception 'Invalid discount code'; end if;
  if c.starts_at is not null and now() < c.starts_at then raise exception 'Discount code not active yet'; end if;
  if c.expires_at is not null and now() > c.expires_at then raise exception 'Discount code has expired'; end if;
  if c.max_uses is not null and c.used_count >= c.max_uses then raise exception 'Discount code usage limit reached'; end if;
  if _subtotal < c.min_order_amount then raise exception 'Minimum order of Rs. % required for this code', c.min_order_amount; end if;
  if c.discount_type = 'percent' then d := round(_subtotal * c.discount_value / 100, 0);
  else d := c.discount_value; end if;
  if c.max_discount is not null then d := least(d, c.max_discount); end if;
  return least(d, _subtotal);
end $$;

-- Public check of a coupon (returns discount for given subtotal, or error)
create or replace function public.check_coupon(_code text, _subtotal numeric)
returns numeric language sql stable security definer set search_path = public as $$
  select public.compute_coupon_discount(_code, _subtotal)
$$;
grant execute on function public.check_coupon(text, numeric) to anon, authenticated;

create or replace function public.place_order(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s record; it jsonb; p record; v record; a record;
  _type order_type := (payload->>'order_type')::order_type;
  _channel order_channel := coalesce((payload->>'channel')::order_channel, 'online');
  _name text := trim(coalesce(payload->>'customer_name',''));
  _phone text := public.normalize_pk_phone(payload->>'customer_phone');
  _addr text := nullif(trim(coalesce(payload->>'delivery_address','')), '');
  _instr text := nullif(left(trim(coalesce(payload->>'instructions','')), 500), '');
  _coupon text := nullif(upper(trim(coalesce(payload->>'coupon_code',''))), '');
  _manual_discount numeric := coalesce((payload->>'manual_discount')::numeric, 0);
  _subtotal numeric := 0; _discount numeric := 0; _fee numeric := 0; _total numeric;
  _unit numeric; _qty int; _addon_list jsonb; _lines jsonb := '[]';
  _cust uuid; _order uuid; _num text; _method text;
begin
  select * into s from public.restaurant_settings where id = 1;

  if _channel = 'pos' then
    if not public.is_staff(auth.uid()) then raise exception 'Staff only'; end if;
    if _type not in ('walk_in','takeaway','pickup','delivery') then raise exception 'Invalid order type'; end if;
  else
    if _type not in ('delivery','pickup') then raise exception 'Invalid order type'; end if;
    if not s.accepting_orders then raise exception 'Sorry, we are not accepting online orders right now'; end if;
    _manual_discount := 0;
  end if;

  if _channel = 'online' or _phone is not null or coalesce(payload->>'customer_phone','') <> '' then
    if _phone is null then raise exception 'Please enter a valid Pakistani mobile number (e.g. 03XX XXXXXXX)'; end if;
  end if;
  if _channel = 'online' and (length(_name) < 2 or length(_name) > 80) then raise exception 'Please enter your name'; end if;
  if _name = '' then _name := 'Walk-in'; end if;
  if _type = 'delivery' and (_addr is null or length(_addr) < 8) then raise exception 'Please enter a complete delivery address'; end if;
  if _type <> 'delivery' then _addr := null; end if;

  if jsonb_typeof(payload->'items') <> 'array' or jsonb_array_length(payload->'items') = 0 then raise exception 'Your cart is empty'; end if;
  if jsonb_array_length(payload->'items') > 40 then raise exception 'Too many items'; end if;

  for it in select * from jsonb_array_elements(payload->'items') loop
    _qty := (it->>'quantity')::int;
    if _qty is null or _qty < 1 or _qty > 50 then raise exception 'Invalid quantity'; end if;
    select pr.*, c.is_active as cat_active into p from public.products pr join public.categories c on c.id = pr.category_id
      where pr.id = (it->>'product_id')::uuid;
    if not found or not p.is_available or not p.cat_active then raise exception 'An item in your cart is no longer available'; end if;
    _unit := p.base_price; v := null;
    if it->>'variation_id' is not null then
      select * into v from public.product_variations where id = (it->>'variation_id')::uuid and product_id = p.id and is_available;
      if not found then raise exception 'Selected size for % is unavailable', p.name; end if;
      _unit := v.price;
    elsif exists (select 1 from public.product_variations where product_id = p.id and is_available) then
      raise exception 'Please choose a size for %', p.name;
    end if;
    _addon_list := '[]';
    if jsonb_typeof(it->'addon_ids') = 'array' then
      for a in select ad.* from public.addons ad
        where ad.id in (select (x)::uuid from jsonb_array_elements_text(it->'addon_ids') x) loop
        if a.category_id <> p.category_id or not a.is_available then raise exception 'Invalid add-on for %', p.name; end if;
        _unit := _unit + a.price;
        _addon_list := _addon_list || jsonb_build_object('id', a.id, 'name', a.name, 'price', a.price);
      end loop;
      if jsonb_array_length(_addon_list) <> (select count(distinct x) from jsonb_array_elements_text(it->'addon_ids') x) then
        raise exception 'Invalid add-on selection';
      end if;
    end if;
    _subtotal := _subtotal + _unit * _qty;
    _lines := _lines || jsonb_build_object('product_id', p.id, 'variation_id', v.id, 'product_name', p.name,
      'variation_name', v.name, 'addons', _addon_list, 'unit_price', _unit, 'quantity', _qty,
      'line_total', _unit * _qty, 'notes', nullif(left(trim(coalesce(it->>'notes','')),200),''));
  end loop;

  if _channel = 'online' and _subtotal < s.min_order_amount then
    raise exception 'Minimum order amount is Rs. %', s.min_order_amount;
  end if;

  if _coupon is not null then
    _discount := public.compute_coupon_discount(_coupon, _subtotal);
    update public.coupons set used_count = used_count + 1 where code = _coupon;
  end if;
  if _manual_discount > 0 then
    if not public.is_manager(auth.uid()) then raise exception 'Manual discounts need manager authorization'; end if;
    _discount := least(_subtotal, _discount + _manual_discount);
  end if;

  if _type = 'delivery' then
    _fee := s.delivery_fee;
    if s.free_delivery_over is not null and _subtotal - _discount >= s.free_delivery_over then _fee := 0; end if;
  end if;
  _total := _subtotal - _discount + _fee;
  _method := case when _type = 'delivery' then 'cash_on_delivery' when _channel = 'pos' then 'cash' else 'cash_on_pickup' end;

  if _phone is not null then
    insert into public.customers(name, phone, default_address) values (_name, _phone, _addr)
      on conflict (phone) do update set name = excluded.name, default_address = coalesce(excluded.default_address, customers.default_address)
      returning id into _cust;
  end if;

  _num := 'KH-' || nextval('public.order_number_seq');
  insert into public.orders(order_number, customer_id, customer_name, customer_phone, order_type, channel, status,
    delivery_address, instructions, subtotal, discount_amount, delivery_fee, total, coupon_code, payment_method, created_by)
  values (_num, _cust, _name, coalesce(_phone,''), _type, _channel, case when _channel='pos' then 'accepted'::order_status else 'new' end,
    _addr, _instr, _subtotal, _discount, _fee, _total, _coupon, _method, auth.uid())
  returning id into _order;

  insert into public.order_items(order_id, product_id, variation_id, product_name, variation_name, addons, unit_price, quantity, line_total, notes)
  select _order, (l->>'product_id')::uuid, nullif(l->>'variation_id','')::uuid, l->>'product_name', l->>'variation_name',
    l->'addons', (l->>'unit_price')::numeric, (l->>'quantity')::int, (l->>'line_total')::numeric, l->>'notes'
  from jsonb_array_elements(_lines) l;

  insert into public.payments(order_id, method, amount, status, received_by)
  values (_order, _method, _total, case when _channel='pos' then 'paid' else 'pending' end, case when _channel='pos' then auth.uid() end);

  insert into public.audit_logs(actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'order.create', 'order', _order::text, jsonb_build_object('number', _num, 'total', _total, 'channel', _channel));

  return jsonb_build_object('order_id', _order, 'order_number', _num, 'total', _total);
end $$;
grant execute on function public.place_order(jsonb) to anon, authenticated;

-- Public tracking: requires order number AND matching phone
create or replace function public.track_order(_order_number text, _phone text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare o record;
begin
  select * into o from public.orders where order_number = upper(trim(_order_number))
    and customer_phone = public.normalize_pk_phone(_phone);
  if not found then return null; end if;
  return jsonb_build_object(
    'order_number', o.order_number, 'status', o.status, 'order_type', o.order_type,
    'customer_name', o.customer_name, 'created_at', o.created_at, 'updated_at', o.updated_at,
    'subtotal', o.subtotal, 'discount_amount', o.discount_amount, 'delivery_fee', o.delivery_fee, 'total', o.total,
    'payment_method', o.payment_method, 'rider_name', o.rider_name,
    'items', (select coalesce(jsonb_agg(jsonb_build_object('name', product_name, 'variation', variation_name,
      'addons', addons, 'quantity', quantity, 'line_total', line_total)), '[]') from public.order_items where order_id = o.id));
end $$;
grant execute on function public.track_order(text, text) to anon, authenticated;

-- ============ ORDER STATUS TRIGGER: customer stats, inventory deduction once, audit ============
create or replace function public.on_order_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if new.status = 'completed' and old.status <> 'completed' and not old.inventory_deducted then
    insert into public.stock_movements(ingredient_id, change, reason, order_id, created_by)
    select r.ingredient_id, -sum(r.quantity * oi.quantity), 'order', new.id, auth.uid()
    from public.order_items oi
    join public.recipes r on r.product_id = oi.product_id and (r.variation_id is null or r.variation_id = oi.variation_id)
    where oi.order_id = new.id
    group by r.ingredient_id
    on conflict do nothing;
    update public.ingredients i set current_stock = i.current_stock + m.change
      from public.stock_movements m where m.order_id = new.id and m.reason = 'order' and m.ingredient_id = i.id;
    new.inventory_deducted := true;
    if new.customer_id is not null then
      update public.customers set total_orders = total_orders + 1, total_spent = total_spent + new.total, last_order_at = new.created_at
        where id = new.customer_id;
    end if;
    update public.payments set status = 'paid' where order_id = new.id and status = 'pending';
  end if;
  if new.status is distinct from old.status or new.rider_name is distinct from old.rider_name then
    insert into public.audit_logs(actor_id, action, entity, entity_id, details)
    values (auth.uid(), 'order.update', 'order', new.id::text,
      jsonb_build_object('from', old.status, 'to', new.status, 'rider', new.rider_name));
  end if;
  return new;
end $$;
create trigger orders_on_update before update on public.orders for each row execute function public.on_order_update();

-- Prevent staff from editing money fields directly
create or replace function public.guard_order_fields()
returns trigger language plpgsql as $$
begin
  if new.subtotal <> old.subtotal or new.total <> old.total or new.discount_amount <> old.discount_amount
     or new.delivery_fee <> old.delivery_fee or new.order_number <> old.order_number
     or (old.inventory_deducted and not new.inventory_deducted) then
    raise exception 'Order totals cannot be modified';
  end if;
  if old.status in ('completed','cancelled') and new.status <> old.status then
    raise exception 'Order is already closed';
  end if;
  return new;
end $$;
create trigger orders_guard before update on public.orders for each row execute function public.guard_order_fields();

alter publication supabase_realtime add table public.orders;

-- ============ DEMO DATA (clearly marked) ============
insert into public.categories(name, slug, description, sort_order) values
 ('Pizza','pizza','Hand-stretched, loaded and baked hot',1),
 ('Chicken Burgers','chicken-burgers','Crispy, juicy, double-crunch fillets',2),
 ('Fries','fries','Golden, seasoned and loaded',3),
 ('Pasta','pasta','Creamy, cheesy, saucy',4),
 ('Wraps','wraps','Rolled tight with crunch inside',5),
 ('Cold Drinks','cold-drinks','Ice-cold refreshment',6);

with c as (select id, slug from public.categories)
insert into public.products(category_id, name, slug, description, image_key, base_price, is_featured, is_demo, sort_order)
select c.id, x.name, x.slug, x.descr, x.img, x.price, x.feat, true, x.ord from c join (values
 ('pizza','Krunch Special Pizza','krunch-special-pizza','Chicken tikka, fajita, onions, capsicum and loads of mozzarella.','pizza',0,true,1),
 ('pizza','Chicken Fajita Pizza','chicken-fajita-pizza','Fajita chicken, peppers, onions and mozzarella.','pizza',0,false,2),
 ('pizza','Cheese Lover Pizza','cheese-lover-pizza','Triple cheese blend on our signature sauce.','pizza',0,false,3),
 ('chicken-burgers','Krunch Zinger','krunch-zinger','Double-crunch spicy fillet, lettuce and house mayo.','burger',550,true,1),
 ('chicken-burgers','Mighty Krunch','mighty-krunch','Two crispy fillets, cheese slice and smoky sauce.','burger',850,true,2),
 ('chicken-burgers','Grilled Chicken Burger','grilled-chicken-burger','Flame-grilled thigh fillet with garlic sauce.','burger',650,false,3),
 ('fries','Classic Fries','classic-fries','Golden salted fries.','fries',0,false,1),
 ('fries','Loaded Krunch Fries','loaded-krunch-fries','Fries with cheese sauce, jalapeños and crispy chicken.','fries',650,true,2),
 ('pasta','Creamy Alfredo Pasta','creamy-alfredo-pasta','Fettuccine in creamy white sauce with grilled chicken.','pasta',850,false,1),
 ('pasta','Crunchy Baked Pasta','crunchy-baked-pasta','Oven-baked pasta with crispy chicken and cheese.','pasta',950,true,2),
 ('wraps','Zinger Wrap','zinger-wrap','Crispy zinger strips, veggies and spicy mayo.','wrap',600,false,1),
 ('wraps','Chicken Tikka Wrap','chicken-tikka-wrap','Smoky tikka chunks, onions and mint raita.','wrap',550,false,2),
 ('cold-drinks','Soft Drink','soft-drink','Chilled soft drink.','drink',0,false,1),
 ('cold-drinks','Mineral Water','mineral-water','500ml bottled water.','drink',80,false,2)
) as x(cat,name,slug,descr,img,price,feat,ord) on x.cat = c.slug;

insert into public.product_variations(product_id, name, price, sort_order)
select p.id, v.name, v.price, v.ord from public.products p join (values
 ('krunch-special-pizza','Small 7"',750,1),('krunch-special-pizza','Medium 10"',1350,2),('krunch-special-pizza','Large 13"',1950,3),
 ('chicken-fajita-pizza','Small 7"',700,1),('chicken-fajita-pizza','Medium 10"',1250,2),('chicken-fajita-pizza','Large 13"',1850,3),
 ('cheese-lover-pizza','Small 7"',650,1),('cheese-lover-pizza','Medium 10"',1150,2),('cheese-lover-pizza','Large 13"',1700,3),
 ('classic-fries','Regular',250,1),('classic-fries','Large',380,2),
 ('soft-drink','Regular 345ml',120,1),('soft-drink','1.5 Litre',280,2)
) as v(slug,name,price,ord) on v.slug = p.slug;

insert into public.addons(category_id, name, price)
select c.id, a.name, a.price from public.categories c join (values
 ('pizza','Extra Cheese',200),('pizza','Jalapeños',100),('pizza','Olives',100),('pizza','Stuffed Crust',300),
 ('chicken-burgers','Cheese Slice',80),('chicken-burgers','Extra Fillet',300),('chicken-burgers','Jalapeños',60),
 ('fries','Cheese Sauce',120),('fries','Garlic Mayo Dip',60),
 ('pasta','Extra Chicken',200),('pasta','Extra Cheese',150),
 ('wraps','Cheese Slice',80),('wraps','Extra Sauce',50)
) as a(cat,name,price) on a.cat = c.slug;

insert into public.coupons(code, description, discount_type, discount_value, min_order_amount, max_discount)
values ('KRUNCH10','DEMO: 10% off orders over Rs. 1,000','percent',10,1000,500);
