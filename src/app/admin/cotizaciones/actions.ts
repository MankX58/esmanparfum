"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { readForm, type FormState } from "@/lib/form";
import { notifyQuoteAnswered } from "@/lib/notifications";

// Responde una cotización. Con precio queda "cotizada"; sin precio y con nota, "no disponible".
// Se puede guardar otra vez para corregir la respuesta. Queda registrado quién respondió.
export async function answerQuote(quoteId: number, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  if (!Number.isInteger(quoteId)) return { message: "Cotización no válida." };

  const form = readForm(formData);
  const price = form.money("price");
  const answer = form.text("answer", { max: 500 });
  if (price === 0) form.errors.price = "El precio debe ser mayor que cero.";
  if (!form.hasErrors() && price === null && !answer) {
    form.errors.price = "Escribe el precio. Si no lo consigues, déjalo vacío y explícalo en la nota.";
  }
  if (form.hasErrors()) return { errors: form.errors };

  const [before] = await sql`select answered_at is not null as answered from quotes where id = ${quoteId}`;
  const updated = await sql`
    update quotes
    set price = ${price}, answer = ${answer}, answered_at = now(), answered_by = ${admin.id}
    where id = ${quoteId}
    returning id`;
  if (updated.length === 0) return { message: "Esta cotización ya no existe." };
  notifyQuoteAnswered(quoteId, Boolean(before?.answered)); // correo al cliente

  revalidatePath("/", "layout");
  return { ok: true };
}

// Oculta o vuelve a mostrar una cotización en el panel. No la borra: el cliente la sigue viendo.
export async function toggleQuoteHidden(quoteId: number): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(quoteId)) return { message: "Cotización no válida." };

  const updated = await sql`
    update quotes set hidden_at = case when hidden_at is null then now() end
    where id = ${quoteId}
    returning id`;
  if (updated.length === 0) return { message: "Esta cotización ya no existe." };

  revalidatePath("/admin/cotizaciones");
  return { ok: true };
}

// Oculta de una vez todas las que ya tienen respuesta. Las pendientes no se tocan.
export async function hideAnsweredQuotes(): Promise<FormState> {
  await requireAdmin();
  await sql`update quotes set hidden_at = now() where hidden_at is null and answered_at is not null`;

  revalidatePath("/admin/cotizaciones");
  return { ok: true };
}
