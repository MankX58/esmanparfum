"use client";

import { useState } from "react";
import { sileo } from "sileo";
import Link from "next/link";
import { buttonStyles, linkStyles } from "@/components/button";
import { Field, fieldProps, inputStyles } from "@/components/field";
import { useServerForm } from "@/lib/use-server-form";
import { requestQuote } from "./actions";

const input = `${inputStyles} h-11`;

// Formulario para pedir el precio de un perfume que no está en el catálogo.
export function QuoteForm({ defaultPerfume, defaultPhone }: { defaultPerfume: string; defaultPhone: string }) {
  // Cuántas solicitudes se han enviado desde que se abrió la página. Es la `key` de los
  // campos del perfume: tras cada envío vuelven a montarse vacíos. El WhatsApp se conserva.
  const [sent, setSent] = useState(0);
  const { state, pending, busy, handleSubmit } = useServerForm(requestQuote, () => {
    sileo.success({ title: "Cotización enviada", description: "Verás la respuesta aquí y te llegará por correo (revisa también Spam)." });
    setSent((count) => count + 1);
  });
  const errors = state.errors ?? {};

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {state.message && (
        <p role="alert" className="border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      )}
      <Field label="¿Qué perfume buscas?" name="perfume" error={errors.perfume} hint="Nombre y marca, como aparecen en la caja.">
        <input
          key={sent}
          {...fieldProps("perfume", errors.perfume)}
          maxLength={120}
          defaultValue={sent === 0 ? defaultPerfume : ""}
          className={input}
        />
      </Field>
      <Field label="Detalles" name="details" error={errors.details} hint="Opcional. Tamaño, versión o cualquier pista que nos ayude a encontrarlo.">
        <textarea
          key={sent}
          {...fieldProps("details", errors.details)}
          rows={3}
          maxLength={500}
          className={`${inputStyles} py-2.5 leading-relaxed`}
        />
      </Field>
      <Field label="Tu WhatsApp" name="phone" error={errors.phone} hint="Por si necesitamos escribirte sobre tu cotización.">
        <input {...fieldProps("phone", errors.phone)} type="tel" autoComplete="tel" defaultValue={defaultPhone} className={input} />
      </Field>
      <div className="flex flex-col gap-2">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            name="accept_privacy"
            aria-invalid={errors.accept_privacy ? true : undefined}
            aria-describedby={errors.accept_privacy ? "accept_privacy-error" : undefined}
            className="mt-0.5 size-5 shrink-0 accent-brand"
          />
          <span>
            Autorizo el uso de mis datos para responder esta cotización, según la{" "}
            <Link href="/privacidad" target="_blank" className={linkStyles.default}>
              Política de privacidad
            </Link>
            .
          </span>
        </label>
        {errors.accept_privacy && (
          <p id="accept_privacy-error" className="text-sm text-danger">
            {errors.accept_privacy}
          </p>
        )}
      </div>
      <button type="submit" disabled={busy} className={`self-start ${buttonStyles.primary}`}>
        {pending ? "Enviando…" : "Pedir cotización"}
      </button>
    </form>
  );
}
