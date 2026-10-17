-- Pagos con Wompi. El cliente paga en la página de Wompi y Wompi le avisa a la tienda
-- (evento transaction.updated). Con el pago aprobado, el pedido pasa solo de
-- 'pending' a 'payment_confirmed': ya no hay transferencia ni "Ya pagué".
-- El estado 'payment_reported' queda solo para los pedidos antiguos.

alter table orders
  -- Último intento de pago en Wompi: su id (para buscarlo en el panel de Wompi) y su estado
  -- (APPROVED, DECLINED, VOIDED, ERROR o PENDING), para contarle al cliente qué pasó.
  add column wompi_transaction_id text,
  add column wompi_status text;

create index on orders (wompi_transaction_id);
