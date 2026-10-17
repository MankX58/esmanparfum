"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { readForm, type FormState } from "@/lib/form";
import { markOrderPaid } from "@/lib/payments";

// Cada acción mueve el pedido un solo paso. El "where" de cada una comprueba el estado
// actual, así un pedido nunca salta pasos ni retrocede aunque se pulse dos veces.

// Paso 1, a mano. Normalmente Wompi confirma el pago solo; esto queda por si un aviso de Wompi
// se perdió o el pago llegó por otro medio. Queda registrado quién lo confirmó y cuándo.
export async function confirmPayment(orderId: number): Promise<FormState> {
  const admin = await requireAdmin();
  if (!Number.isInteger(orderId)) return { message: "Pedido no válido." };

  const confirmed = await markOrderPaid(orderId, admin.id);
  if (!confirmed) return { message: "Este pedido ya no está esperando confirmación de pago." };

  revalidatePath("/", "layout");
  return { ok: true };
}

// Paso 2. El pedido salió. La guía es opcional: una entrega en persona no tiene.
export async function shipOrder(orderId: number, formData: FormData): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(orderId)) return { message: "Pedido no válido." };

  const form = readForm(formData);
  const tracking = form.text("tracking", { max: 80 });
  if (form.hasErrors()) return { errors: form.errors };

  const updated = await sql`
    update orders set status = 'shipped', tracking = ${tracking}
    where id = ${orderId} and status in ('payment_confirmed', 'preparing')
    returning id`;
  if (updated.length === 0) return { message: "Este pedido no está listo para enviarse: primero confirma el pago." };

  revalidatePath("/", "layout");
  return { ok: true };
}

// Paso 3. El cliente lo recibió. (El cliente también puede marcarlo desde su pedido.)
export async function deliverOrder(orderId: number): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(orderId)) return { message: "Pedido no válido." };

  const updated = await sql`
    update orders set status = 'delivered' where id = ${orderId} and status = 'shipped' returning id`;
  if (updated.length === 0) return { message: "Este pedido no está en camino." };

  revalidatePath("/", "layout");
  return { ok: true };
}

// Cancela un pedido que todavía no ha salido. Deja de contar en ventas, stock y caja.
export async function cancelOrder(orderId: number): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(orderId)) return { message: "Pedido no válido." };

  const updated = await sql`
    update orders set status = 'cancelled'
    where id = ${orderId} and status in ('pending', 'payment_reported', 'payment_confirmed', 'preparing')
    returning id`;
  if (updated.length === 0) return { message: "Un pedido enviado o entregado ya no se puede cancelar." };

  revalidatePath("/", "layout");
  return { ok: true };
}

// Borra un pedido que no ha salido (enviado o entregado ya no se puede). Se van también sus
// productos, y si estaba pagado deja de contar en ventas, stock y caja.
// Después la numeración vuelve al último pedido que queda: si se borra el más reciente
// (VEL-0004), el siguiente pedido vuelve a ser VEL-0004. Un número de en medio no se reutiliza.
export async function deleteOrder(orderId: number): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(orderId)) return { message: "Pedido no válido." };

  const [deleted] = await sql.transaction([
    sql`delete from orders where id = ${orderId} and status not in ('shipped', 'delivered') returning id`,
    sql`select setval(pg_get_serial_sequence('orders', 'id'), coalesce((select max(id) from orders), 0) + 1, false)`,
  ]);
  if (deleted.length === 0) return { message: "Un pedido enviado o entregado ya no se puede borrar." };

  revalidatePath("/", "layout");
  return { ok: true };
}

// Guarda la guía y las notas internas sin cambiar el estado.
export async function saveOrderDetails(orderId: number, formData: FormData): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(orderId)) return { message: "Pedido no válido." };

  const form = readForm(formData);
  const tracking = form.text("tracking", { max: 80 });
  const notes = form.text("admin_notes", { max: 500 });
  if (form.hasErrors()) return { errors: form.errors };

  await sql`update orders set tracking = ${tracking}, admin_notes = ${notes} where id = ${orderId}`;

  revalidatePath("/", "layout");
  return { ok: true };
}
