-- Pago por transferencia (con el QR de la tienda) como alternativa a Wompi.
-- Quien elige transferencia recibe un descuento (5 %) sobre el valor de los productos. Como el
-- del código promocional, se reparte en order_items.discount, así ventas, ganancia y caja lo
-- descuentan solos. El pedido guarda el porcentaje que se le aplicó.
-- payment_method dice cómo paga: 'Wompi' o 'Transferencia'. Con transferencia el cliente
-- avisa "Ya pagué" (payment_reported) y el administrador confirma al ver el dinero en el banco.
alter table orders
  add column transfer_percent integer check (transfer_percent between 1 and 50);
