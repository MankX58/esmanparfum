"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { readForm, type FormState } from "@/lib/form";
import type { StoreSettings } from "@/lib/orders";
import { shippingZones, type ShippingRates } from "@/lib/shipping";

// Guarda los parámetros de las cuentas (lo que en el Excel era la hoja Config).
// Cada uno es una fila de la tabla settings; los porcentajes se guardan como fracción (0.3 = 30 %).
export async function saveFinanceSettings(formData: FormData): Promise<FormState> {
  await requireAdmin();

  const form = readForm(formData);
  const values = {
    opening_cash: form.money("openingCash", { required: true }),
    monthly_sales_goal: form.money("monthlyGoal", { required: true }),
    target_margin: form.percent("targetMargin", { required: true }),
    payment_fee: form.percent("paymentFee", { required: true }),
    vat: form.percent("vat", { required: true }),
    reactivation_days: form.integer("reactivationDays", { required: true, min: 1, max: 3650 }),
  };
  if (form.hasErrors()) return { errors: form.errors };

  await sql`
    insert into settings (key, value)
    select key, value from jsonb_each(${JSON.stringify(values)}::jsonb)
    on conflict (key) do update set value = excluded.value`;

  revalidatePath("/admin", "layout");
  return { ok: true };
}

// Guarda el QR de transferencia y los datos de contacto y envío que ve quien hace un pedido.
export async function saveStoreSettings(formData: FormData): Promise<FormState> {
  await requireAdmin();

  const form = readForm(formData);
  const settings: StoreSettings = {
    // El número de WhatsApp se guarda solo con dígitos, como lo pide wa.me.
    whatsapp: (form.text("whatsapp", { max: 20 }) ?? "").replace(/\D/g, ""),
    // Vacío = el envío a esa zona se coordina con el cliente.
    shippingRates: Object.fromEntries(
      shippingZones.map((zone) => [zone.id, form.money(`rate_${zone.id}`)]),
    ) as ShippingRates,
    qrImage: form.text("qrImage", { max: 120 }) ?? "",
    legalName: form.text("legalName", { max: 120 }) ?? "",
    legalId: form.text("legalId", { max: 30 }) ?? "",
    address: form.text("address", { max: 160 }) ?? "",
    email: form.text("email", { max: 120 }) ?? "",
  };
  for (const zone of shippingZones) {
    if (settings.shippingRates[zone.id] === 0) form.errors[`rate_${zone.id}`] = "Escribe un valor mayor que 0, o déjalo vacío.";
  }
  if (settings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) form.errors.email = "Escribe un correo válido.";
  // Solo se acepta una imagen de la carpeta public: nunca una dirección de otro sitio.
  if (settings.qrImage && !/^\/[\w./-]+\.(png|jpe?g|webp)$/i.test(settings.qrImage)) {
    form.errors.qrImage = "Escribe el nombre del archivo empezando con /. Ejemplo: /pago-qr.jpg";
  }
  if (form.hasErrors()) return { errors: form.errors };

  await sql`
    insert into settings (key, value) values ('store', ${JSON.stringify(settings)}::jsonb)
    on conflict (key) do update set value = excluded.value`;

  revalidatePath("/", "layout");
  return { ok: true };
}
