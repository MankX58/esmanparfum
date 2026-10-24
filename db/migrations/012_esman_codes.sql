-- Ésman Parfum: el código del pedido que ve el cliente pasa de VEL-0001 a ESM-0001.
-- Es una columna generada: se cambia su fórmula y se recalcula (vale también para los pedidos viejos).
alter table orders alter column code set expression as ('ESM-' || lpad(id::text, 4, '0'));
