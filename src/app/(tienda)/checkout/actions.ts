"use server";

import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { readForm, type FormState } from "@/lib/form";
import { getStoreSettings } from "@/lib/orders";

export type CartItem = { id: number; quantity: number };

const MAX_PENDING_ORDERS = 3; // evita que una cuenta llene el panel de pedidos sin pagar

// Crea el pedido. Del navegador solo se aceptan ids, cantidades y datos de envío:
// nombres, precios, costos y totales se toman de la base de datos.
export async function createOrder(items: CartItem[], formData: FormData): Promise<FormState> {
  const user = await requireUser("/checkout");

  const valid =
    Array.isArray(items) &&
    items.length > 0 &&
    items.length <= 30 &&
    items.every((item) => Number.isInteger(item.id) && item.id > 0 && Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 10);
  if (!valid) return { message: "Tu carrito está vacío o tiene datos que no son válidos." };

  const form = readForm(formData);
  const name = form.text("name", { required: true, max: 80 });
  const phone = form.phone("phone", { required: true });
  const address = form.text("address", { required: true, max: 160 });
  const city = form.text("city", { required: true, max: 60 });
  const notes = form.text("notes", { max: 300 });
  if (form.hasErrors()) return { errors: form.errors };

  const [{ pending }] = await sql`
    select count(*)::int as pending from orders where user_id = ${user.id} and status = 'pending'`;
  if (pending >= MAX_PENDING_ORDERS) {
    return { message: "Tienes varios pedidos pendientes de pago. Paga o cancela alguno antes de crear otro." };
  }

  const ids = [...new Set(items.map((item) => item.id))];
  const [{ available }] = await sql`
    select count(*)::int as available from products where is_active and id = any(${ids})`;
  if (available !== ids.length || ids.length !== items.length) {
    return { message: "Un producto de tu carrito ya no está disponible. Revisa el carrito e inténtalo de nuevo." };
  }

  const { shippingFee } = await getStoreSettings();

  // La persona queda como cliente (una sola ficha por cuenta).
  const [customer] = await sql`
    insert into customers (user_id, name, phone, email, source)
    values (${user.id}, ${name}, ${phone}, ${user.email}, 'Tienda web')
    on conflict (user_id) do update set name = excluded.name, phone = excluded.phone
    returning id`;

  // Una sola sentencia crea el pedido y sus líneas: o se guarda todo o nada.
  // Cada línea copia el nombre, el precio y el costo de este momento. El nombre lleva
  // el tamaño ("Asad, 100 ml") para saber cuál presentación hay que despachar.
  const rows = await sql`
    with new_order as (
      insert into orders
        (customer_id, user_id, status, channel, payment_method,
         shipping_name, shipping_phone, shipping_address, shipping_city, shipping_notes, shipping_fee)
      values
        (${customer.id}, ${user.id}, 'pending', 'Tienda web', 'Wompi',
         ${name}, ${phone}, ${address}, ${city}, ${notes}, ${shippingFee})
      returning id
    )
    insert into order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost)
    select new_order.id, p.id, p.name || coalesce(', ' || p.size_ml || ' ml', ''), item.quantity, p.list_price, s.avg_cost
    from new_order,
         jsonb_to_recordset(${JSON.stringify(items)}::jsonb) as item(id int, quantity int)
    join products p on p.id = item.id and p.is_active
    join product_stats s on s.product_id = p.id
    returning order_id`;

  return { ok: true, id: rows[0].order_id as number };
}
