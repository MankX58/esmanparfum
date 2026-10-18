"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { readForm, type FormState } from "@/lib/form";
import { todayInBogota } from "@/lib/format";
import { normalizeCode, validCode } from "@/lib/promo";

// Vigencias que se pueden elegir. "fecha" usa el día que escriba el administrador.
const DURATIONS = ["ilimitado", "30", "15", "fecha"];

// Crea un código promocional.
export async function createPromoCode(formData: FormData): Promise<FormState> {
  await requireAdmin();

  const form = readForm(formData);
  const code = normalizeCode(form.text("code", { required: true, max: 30 }) ?? "");
  const percent = form.integer("percent", { required: true, min: 1, max: 90 });
  const duration = form.oneOf("duration", DURATIONS, { required: true });
  const until = duration === "fecha" ? form.date("until", { required: true }) : null;
  if (code && !validCode(code)) form.errors.code = "Usa de 3 a 30 letras sin tildes, números, guion o guion bajo. Ejemplo: VERANO10";
  if (until && until < todayInBogota()) form.errors.until = "La fecha ya pasó. Elige hoy o un día futuro.";
  if (form.hasErrors()) return { errors: form.errors };

  // Vence al terminar el día elegido (hora de Colombia), o N días después de crearlo.
  const days = duration === "30" || duration === "15" ? Number(duration) : null;
  try {
    await sql`
      insert into promo_codes (code, percent, expires_at)
      values (
        ${code}, ${percent},
        case
          when ${until}::date is not null then (${until}::date + 1)::timestamp at time zone 'America/Bogota'
          when ${days}::int is not null then now() + make_interval(days => ${days}::int)
        end
      )`;
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return { errors: { code: "Ya existe un código con ese nombre." } };
    throw error;
  }

  revalidatePath("/admin/codigos");
  return { ok: true };
}

// Activa o pausa un código sin borrarlo. Un código pausado no se puede usar en la tienda.
export async function togglePromoCode(id: number): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(id)) return { message: "Código no válido." };

  const updated = await sql`update promo_codes set is_active = not is_active where id = ${id} returning id`;
  if (updated.length === 0) return { message: "El código ya no existe." };

  revalidatePath("/admin/codigos");
  return { ok: true };
}

// Borra un código. Los pedidos que lo usaron no cambian: guardan su propia copia del código y el porcentaje.
export async function deletePromoCode(id: number): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(id)) return { message: "Código no válido." };

  await sql`delete from promo_codes where id = ${id}`;

  revalidatePath("/admin/codigos");
  return { ok: true };
}
