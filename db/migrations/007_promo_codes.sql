-- Códigos promocionales: un porcentaje de descuento sobre el valor de los productos de un pedido.
--
-- El descuento se reparte entre las líneas del pedido en order_items.discount (columna que ya
-- existía): así ventas, ganancia, caja y stock lo descuentan solos, porque todos suman
-- order_items.total (= cantidad × precio − descuento).

create table promo_codes (
  id          integer generated always as identity primary key,
  code        text not null unique check (code ~ '^[A-Z0-9_-]{3,30}$'), -- siempre en mayúsculas
  percent     integer not null check (percent between 1 and 90),
  expires_at  timestamptz, -- vacío = sin vencimiento
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- El pedido guarda el código y el porcentaje que se usaron: si después el código se borra
-- o cambia, el registro de la venta sigue diciendo lo que pasó.
alter table orders
  add column promo_code text,
  add column promo_percent integer check (promo_percent between 1 and 90);

create index on orders (promo_code);
