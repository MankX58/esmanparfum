"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { FormState } from "@/lib/form";

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
