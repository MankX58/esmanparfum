"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { readForm, type FormState } from "@/lib/form";
import { todayInBogota } from "@/lib/format";

export type SaleLine = { id: number; quantity: number; unitPrice: number };

const MAX_PRICE = 2_000_000_000; // tope de una columna integer

// Registra una venta hecha en persona (canal "Presencial"). Queda como pedido entregado:
// cuenta en ventas, stock y ganancia, y entra a caja ese día si ya se cobró (si no, queda
// "por cobrar" y se marca después en Caja). Precio y costo de cada línea quedan guardados.
export async function createInStoreSale(lines: SaleLine[], formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();

  const form = readForm(formData);
  const soldOn = form.date("sold_on", { required: true });
  const customerName = form.text("customer", { max: 80 });
  const phone = form.phone("phone");
  const [setting] = await sql`select value from settings where key = 'payment_methods'`;
  const paymentMethod = form.oneOf("payment_method", (setting?.value ?? []) as string[], { required: true });
  const notes = form.text("notes", { max: 300 });
  const paid = form.checkbox("paid");
  if (soldOn && soldOn > todayInBogota()) form.errors.sold_on = "La fecha no puede ser futura.";

  const validLines =
    Array.isArray(lines) &&
    lines.length > 0 &&
    lines.length <= 30 &&
    lines.every(
      (line) =>
        Number.isInteger(line.id) && line.id > 0 &&
        Number.isInteger(line.quantity) && line.quantity >= 1 && line.quantity <= 1000 &&
        Number.isInteger(line.unitPrice) && line.unitPrice >= 0 && line.unitPrice <= MAX_PRICE,
    );
  if (!validLines) form.errors.lines = "Agrega al menos un producto, con cantidad y precio válidos.";
  if (form.hasErrors()) return { errors: form.errors };

  const ids = [...new Set(lines.map((line) => line.id))];
  const [{ found }] = await sql`select count(*)::int as found from products where id = any(${ids})`;
  if (found !== ids.length) return { message: "Uno de los productos ya no existe. Recarga la página." };

  // Cliente opcional: si ya existe uno con ese nombre se usa; si no, se crea.
  let customerId: number | null = null;
  if (customerName) {
    const [existing] = await sql`select id from customers where lower(name) = lower(${customerName}) order by id limit 1`;
    customerId = existing
      ? existing.id
      : (await sql`insert into customers (name, phone, source) values (${customerName}, ${phone}, 'Presencial') returning id`)[0].id;
    if (existing && phone) await sql`update customers set phone = ${phone} where id = ${customerId} and phone is null`;
  }

  // Una sola sentencia crea la venta y sus líneas: o se guarda todo o nada.
  const rows = await sql`
    with new_order as (
      insert into orders
        (customer_id, ordered_on, status, channel, payment_method, paid_on, notes,
         payment_confirmed_at, payment_confirmed_by)
      values
        (${customerId}, ${soldOn}, 'delivered', 'Presencial', ${paymentMethod}, ${paid ? soldOn : null}, ${notes},
         now(), ${admin.id})
      returning id
    )
    insert into order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost)
    select new_order.id, p.id, p.name || coalesce(', ' || p.size_ml || ' ml', ''), line.quantity, line."unitPrice", s.avg_cost
    from new_order,
         jsonb_to_recordset(${JSON.stringify(lines)}::jsonb) as line(id int, quantity int, "unitPrice" int)
    join products p on p.id = line.id
    join product_stats s on s.product_id = p.id
    returning order_id`;

  revalidatePath("/admin", "layout");
  return { ok: true, id: rows[0].order_id as number };
}
