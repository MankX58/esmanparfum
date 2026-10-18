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
