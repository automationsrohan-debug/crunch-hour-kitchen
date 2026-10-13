
create or replace function public.place_order(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s record; it jsonb; p record; a record;
  _vid uuid; _vname text; _vprice numeric;
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
  else
    if _type not in ('delivery','pickup') then raise exception 'Invalid order type'; end if;
    if not s.accepting_orders then raise exception 'Sorry, we are not accepting online orders right now'; end if;
    _manual_discount := 0;
  end if;

  if (_channel = 'online' or coalesce(trim(payload->>'customer_phone'),'') <> '') and _phone is null then
    raise exception 'Please enter a valid Pakistani mobile number (e.g. 03XX XXXXXXX)';
  end if;
  if _channel = 'online' and (length(_name) < 2 or length(_name) > 80) then raise exception 'Please enter your name'; end if;
  if _name = '' then _name := 'Walk-in'; end if;
  if _type = 'delivery' and (_addr is null or length(_addr) < 8) then raise exception 'Please enter a complete delivery address'; end if;
  if _type <> 'delivery' then _addr := null; end if;

  if jsonb_typeof(payload->'items') is distinct from 'array' or jsonb_array_length(payload->'items') = 0 then raise exception 'Your cart is empty'; end if;
  if jsonb_array_length(payload->'items') > 40 then raise exception 'Too many items'; end if;

  for it in select * from jsonb_array_elements(payload->'items') loop
    _qty := (it->>'quantity')::int;
    if _qty is null or _qty < 1 or _qty > 50 then raise exception 'Invalid quantity'; end if;
    select pr.id, pr.name, pr.base_price, pr.category_id, pr.is_available, c.is_active as cat_active into p
      from public.products pr join public.categories c on c.id = pr.category_id
      where pr.id = (it->>'product_id')::uuid;
    if not found or not p.is_available or not p.cat_active then raise exception 'An item in your cart is no longer available'; end if;
    _unit := p.base_price; _vid := null; _vname := null;
    if nullif(it->>'variation_id','') is not null then
      select id, name, price into _vid, _vname, _vprice from public.product_variations
        where id = (it->>'variation_id')::uuid and product_id = p.id and is_available;
      if _vid is null then raise exception 'Selected size for % is unavailable', p.name; end if;
      _unit := _vprice;
    elsif exists (select 1 from public.product_variations where product_id = p.id and is_available) then
      raise exception 'Please choose a size for %', p.name;
    end if;
    _addon_list := '[]';
    if jsonb_typeof(it->'addon_ids') = 'array' and jsonb_array_length(it->'addon_ids') > 0 then
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
    _lines := _lines || jsonb_build_object('product_id', p.id, 'variation_id', _vid, 'product_name', p.name,
      'variation_name', _vname, 'addons', _addon_list, 'unit_price', _unit, 'quantity', _qty,
      'line_total', _unit * _qty, 'notes', nullif(left(trim(coalesce(it->>'notes','')),200),''));
  end loop;

  if _channel = 'online' and _subtotal < s.min_order_amount then
    raise exception 'Minimum order amount is Rs. %', s.min_order_amount;
  end if;

  if _coupon is not null then
    _discount := public.compute_coupon_discount(_coupon, _subtotal);
    update public.coupons set used_count = used_count + 1 where code = _coupon;
  end if;
  if _manual_discount < 0 then raise exception 'Invalid discount'; end if;
  if _manual_discount > 0 then
    if not public.is_manager(auth.uid()) then raise exception 'Manual discounts need manager authorization'; end if;
    _discount := least(_subtotal, _discount + _manual_discount);
  end if;

  if _type = 'delivery' then
    _fee := s.delivery_fee;
    if s.free_delivery_over is not null and _subtotal - _discount >= s.free_delivery_over then _fee := 0; end if;
  end if;
  _total := _subtotal - _discount + _fee;
  _method := case when _channel = 'pos' then 'cash' when _type = 'delivery' then 'cash_on_delivery' else 'cash_on_pickup' end;

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
