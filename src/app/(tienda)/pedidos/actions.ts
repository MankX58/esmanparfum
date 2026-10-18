"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { readForm, type FormState } from "@/lib/form";

// Con transferencia, el cliente avisa que ya pagó. Esto NO marca el pedido como pagado:
// lo pasa a "Pago en revisión" para que un administrador lo verifique en el banco.
export async function reportPayment(orderId: number, formData: FormData): Promise<FormState> {
  const user = await requireUser("/pedidos");

  const form = readForm(formData);
  const reference = form.text("reference", { required: true, max: 200 });
  if (form.hasErrors()) return { errors: form.errors };

  // El "where" garantiza que el pedido es de esta persona, se paga por transferencia y sigue pendiente.
  const updated = await sql`
    update orders
    set status = 'payment_reported', payment_reference = ${reference}, payment_reported_at = now()
    where id = ${orderId} and user_id = ${user.id} and status = 'pending' and payment_method = 'Transferencia'
    returning id`;
  if (updated.length === 0) return { message: "Este pedido ya no está pendiente de pago." };

  revalidatePath("/", "layout");
  return { ok: true };
}

// El cliente puede cancelar su pedido mientras no lo haya pagado. Si Wompi aún está
// procesando un pago (PSE o Nequi), no: el cobro podría aprobarse después.
export async function cancelOrder(orderId: number): Promise<FormState> {
  const user = await requireUser("/pedidos");

  const updated = await sql`
    update orders set status = 'cancelled'
    where id = ${orderId} and user_id = ${user.id} and status = 'pending'
      and wompi_status is distinct from 'PENDING'
    returning id`;
  if (updated.length === 0) return { message: "Este pedido ya no se puede cancelar desde aquí. Escríbenos." };

  revalidatePath("/", "layout");
  return { ok: true };
}

// El cliente avisa que ya recibió su pedido: pasa de Enviado a Entregado.
export async function confirmDelivery(orderId: number): Promise<FormState> {
  const user = await requireUser("/pedidos");

  const updated = await sql`
    update orders set status = 'delivered'
    where id = ${orderId} and user_id = ${user.id} and status = 'shipped'
    returning id`;
  if (updated.length === 0) return { message: "Este pedido no está en camino." };

  revalidatePath("/", "layout");
  return { ok: true };
}
