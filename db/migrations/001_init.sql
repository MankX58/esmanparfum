-- Ésman Parfum · esquema inicial
--
-- Lo que se GUARDA son hechos: productos, compras, pedidos, gastos, movimientos.
-- Lo que se CALCULA (stock, costo promedio, margen, alerta...) sale de la vista
-- product_stats, con las mismas fórmulas de la hoja "Productos" del Excel.
-- Todo el dinero se guarda en pesos colombianos enteros.

-- Personas que inician sesión con Auth0. El rol vive aquí, no en Auth0.
create table users (
  id          integer generated always as identity primary key,
  auth0_sub   text not null unique,
  email       text,
  name        text,
  role        text not null default 'customer' check (role in ('customer', 'admin')),
  created_at  timestamptz not null default now()
);

create table products (
  id                 integer generated always as identity primary key,
  sku                text not null unique,
  slug               text not null unique,
  name               text not null,
  brand              text,
  audience           text check (audience in ('Hombre', 'Mujer', 'Unisex')),
  size_ml            integer check (size_ml > 0),
  category           text,
  description        text,
  images             text[] not null default '{}',
  list_price         integer not null default 0 check (list_price >= 0),
  initial_stock      integer not null default 0 check (initial_stock >= 0),
  initial_unit_cost  integer not null default 0 check (initial_unit_cost >= 0),
  reorder_point      integer not null default 0 check (reorder_point >= 0),
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Compras de mercancía al proveedor. Cada fila sube el stock del producto.
create table purchases (
  id              integer generated always as identity primary key,
  purchased_on    date not null,
  supplier        text,
  product_id      integer not null references products (id),
  quantity        integer not null check (quantity > 0),
  unit_cost       integer not null check (unit_cost >= 0),
  shipping_cost   integer not null default 0 check (shipping_cost >= 0),
  total_cost      integer generated always as (quantity * unit_cost + shipping_cost) stored,
  payment_method  text,
  notes           text,
  created_at      timestamptz not null default now()
);

create table customers (
  id          integer generated always as identity primary key,
  user_id     integer unique references users (id),
  name        text not null,
  phone       text,
  email       text,
  source      text,
  birthday    date,
  notes       text,
  created_at  timestamptz not null default now()
);

-- Un pedido es una venta. "paid_on" es el día en que el dinero entró a caja:
-- si está vacío, la venta existe pero aún no se ha cobrado (fiado o pendiente).
create table orders (
  id              integer generated always as identity primary key,
  customer_id     integer references customers (id),
  ordered_on      date not null default ((now() at time zone 'America/Bogota')::date),
  status          text not null default 'pending' check (status in (
                    'pending', 'payment_reported', 'payment_confirmed',
                    'preparing', 'shipped', 'delivered', 'cancelled')),
  channel         text,
  payment_method  text,
  paid_on         date,
  notes           text,
  created_at      timestamptz not null default now()
);

-- Cada línea guarda una foto (snapshot) del nombre, precio y costo del momento
-- de la venta. Cambiar el producto después no altera los pedidos anteriores.
create table order_items (
  id            integer generated always as identity primary key,
  order_id      integer not null references orders (id) on delete cascade,
  product_id    integer not null references products (id),
  product_name  text not null,
  quantity      integer not null check (quantity > 0),
  unit_price    integer not null check (unit_price >= 0),
  discount      integer not null default 0 check (discount >= 0),
  unit_cost     integer not null check (unit_cost >= 0),
  total         integer generated always as (quantity * unit_price - discount) stored
);

create table expenses (
  id              integer generated always as identity primary key,
  spent_on        date not null,
  category        text,
  description     text,
  amount          integer not null check (amount >= 0),
  kind            text check (kind in ('Fijo', 'Variable')),
  payment_method  text,
  created_at      timestamptz not null default now()
);

-- Aportes y retiros del dueño.
create table owner_movements (
  id          integer generated always as identity primary key,
  moved_on    date not null,
  kind        text not null check (kind in ('Aporte', 'Retiro')),
  concept     text,
  amount      integer not null check (amount > 0),
  method      text,
  created_at  timestamptz not null default now()
);

-- Parámetros y listas de la hoja "Config" (meta mensual, métodos de pago, canales...).
create table settings (
  key    text primary key,
  value  jsonb not null
);

create index on purchases (product_id);
create index on order_items (order_id);
create index on order_items (product_id);
create index on orders (customer_id);

-- Datos calculados por producto. Equivale a las columnas grises de la hoja "Productos".
-- Un pedido cuenta como venta (y descuenta stock) desde que su pago está confirmado.
-- ponytail: las sumas se convierten a integer (tope ~2.100 millones de pesos por
-- producto); pasar a bigint si algún día un solo producto supera esa cifra.
create view product_stats as
with purchased as (
  select product_id, sum(quantity)::int as units, sum(total_cost)::int as cost
  from purchases
  group by product_id
),
sold as (
  select oi.product_id,
         sum(oi.quantity)::int as units,
         sum(oi.total)::int as revenue,
         sum(oi.total - oi.quantity * oi.unit_cost)::int as profit
  from order_items oi
  join orders o on o.id = oi.order_id
  where o.status not in ('pending', 'payment_reported', 'cancelled')
  group by oi.product_id
),
base as (
  select p.id as product_id,
         p.list_price,
         p.reorder_point,
         coalesce(pu.units, 0) as units_purchased,
         coalesce(s.units, 0) as units_sold,
         p.initial_stock + coalesce(pu.units, 0) - coalesce(s.units, 0) as stock,
         -- Costo promedio (CPP): todo lo que costó la mercancía (stock inicial +
         -- compras con su flete) dividido entre las unidades que entraron.
         case
           when p.initial_stock + coalesce(pu.units, 0) > 0 then
             round((p.initial_stock::numeric * p.initial_unit_cost + coalesce(pu.cost, 0))
                   / (p.initial_stock + coalesce(pu.units, 0)))::int
           else p.initial_unit_cost
         end as avg_cost,
         coalesce(s.revenue, 0) as total_sales,
         coalesce(s.profit, 0) as gross_profit
  from products p
  left join purchased pu on pu.product_id = p.id
  left join sold s on s.product_id = p.id
)
select product_id,
       units_purchased,
       units_sold,
       stock,
       avg_cost,
       list_price - avg_cost as unit_profit,
       case when list_price > 0 then round((list_price - avg_cost)::numeric / list_price, 4)::float8 else 0 end as margin,
       case when avg_cost > 0 then round((list_price - avg_cost)::numeric / avg_cost, 4)::float8 else 0 end as markup,
       stock * avg_cost as inventory_value,
       case when stock <= 0 then 'AGOTADO' when stock <= reorder_point then 'PEDIR' else 'OK' end as alert,
       total_sales,
       gross_profit
from base;
