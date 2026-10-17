import { sql } from "./db";
import { todayInBogota } from "./format";

// Marca un pedido como pagado. Lo usan Wompi (al aprobar un pago) y el panel (confirmación
// a mano, por si un aviso de Wompi se perdió). Desde aquí la venta cuenta en stock, ventas
// y caja, con la fecha de hoy. `confirmedBy` es el administrador; null cuando lo confirma Wompi.
// Devuelve false si el pedido ya no estaba esperando el pago (así dos avisos no lo cobran dos veces).
export async function markOrderPaid(orderId: number, confirmedBy: number | null) {
  // Las dos sentencias van en una transacción: o se aplican ambas o ninguna.
  const [, confirmed] = await sql.transaction([
    // El costo de cada línea se actualiza al costo promedio de este momento.
    sql`
      update order_items oi set unit_cost = s.avg_cost
      from product_stats s, orders o
      where s.product_id = oi.product_id and o.id = oi.order_id
        and o.id = ${orderId} and o.status in ('pending', 'payment_reported')`,
    sql`
      update orders
      set status = 'payment_confirmed', payment_confirmed_at = now(),
          payment_confirmed_by = ${confirmedBy}, paid_on = ${todayInBogota()}
      where id = ${orderId} and status in ('pending', 'payment_reported')
      returning id`,
  ]);
  return confirmed.length > 0;
}
