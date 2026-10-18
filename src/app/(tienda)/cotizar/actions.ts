"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { readForm, type FormState } from "@/lib/form";

const MAX_PENDING_QUOTES = 5; // evita que una cuenta llene el panel de solicitudes

// Guarda una solicitud de cotización. Queda pendiente hasta que un administrador responda.
export async function requestQuote(formData: FormData): Promise<FormState> {
  const user = await requireUser("/cotizar");

  const form = readForm(formData);
  const perfume = form.text("perfume", { required: true, max: 120 });
  const details = form.text("details", { max: 500 });
  const phone = form.phone("phone", { required: true });
  if (!form.checkbox("accept_privacy")) form.errors.accept_privacy = "Para pedir la cotización debes autorizar el uso de tus datos.";
  if (form.hasErrors()) return { errors: form.errors };

  const [{ pending }] = await sql`
    select count(*)::int as pending from quotes where user_id = ${user.id} and answered_at is null`;
  if (pending >= MAX_PENDING_QUOTES) {
    return { message: "Ya tienes varias cotizaciones esperando respuesta. En cuanto respondamos podrás pedir más." };
  }

  await sql`
    insert into quotes (user_id, perfume, details, phone, privacy_accepted_at)
    values (${user.id}, ${perfume}, ${details}, ${phone}, now())`;

  revalidatePath("/", "layout");
  return { ok: true };
}
