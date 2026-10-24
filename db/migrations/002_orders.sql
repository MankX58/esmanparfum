-- Fase 4: pedidos de la tienda web con pago por transferencia verificado a mano.

alter table orders
  -- Código que ve el cliente y que pone en la transferencia: VEL-0001, VEL-0002... (desde la migración 012: ESM-0001)
  add column code text generated always as ('VEL-' || lpad(id::text, 4, '0')) stored,
  add column user_id integer references users (id),
  -- Datos de envío
  add column shipping_name text,
  add column shipping_phone text,
  add column shipping_address text,
  add column shipping_city text,
  add column shipping_notes text,
  add column shipping_fee integer not null default 0 check (shipping_fee >= 0),
  add column tracking text,
  -- Pago: el cliente lo reporta y un administrador lo confirma tras verlo en el banco.
  add column payment_reference text,
  add column payment_reported_at timestamptz,
  add column payment_confirmed_at timestamptz,
  add column payment_confirmed_by integer references users (id),
  add column admin_notes text;

create unique index on orders (code);
create index on orders (user_id);
create index on orders (status);
