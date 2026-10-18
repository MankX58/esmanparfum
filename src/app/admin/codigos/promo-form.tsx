"use client";

import { useState } from "react";
import { sileo } from "sileo";
import { buttonStyles } from "@/components/button";
import { Field, fieldProps, inputStyles } from "@/components/field";
import { useServerForm } from "@/lib/use-server-form";
import { createPromoCode } from "./actions";

const input = `${inputStyles} h-11`;

// Formulario para crear un código: nombre, porcentaje y vigencia. Con "Hasta una fecha" aparece el calendario.
export function PromoForm() {
  const [duration, setDuration] = useState("ilimitado");
  // formKey: al crear un código el formulario se vuelve a montar y queda limpio.
  const [formKey, setFormKey] = useState(0);
  const { state, pending, busy, handleSubmit } = useServerForm(createPromoCode, () => {
    sileo.success({ title: "Código creado" });
    setDuration("ilimitado");
    setFormKey((key) => key + 1);
  });
  const errors = state.errors ?? {};

  return (
    <form key={formKey} onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 border border-line bg-surface p-6">
      <h2 className="font-display text-xl">Nuevo código</h2>
      {state.message && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Código" name="code" error={errors.code} hint="Lo que escribe el cliente. Ejemplo: VERANO10">
          <input {...fieldProps("code", errors.code)} autoComplete="off" className={`${input} uppercase`} />
        </Field>
        <Field label="Descuento (%)" name="percent" error={errors.percent} hint="Entre 1 y 90, sobre el valor de los productos.">
          <input {...fieldProps("percent", errors.percent)} inputMode="numeric" className={input} />
        </Field>
        <Field label="Vigencia" name="duration" error={errors.duration}>
          <select
            {...fieldProps("duration", errors.duration)}
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            className={input}
          >
            <option value="ilimitado">Ilimitado</option>
            <option value="30">30 días</option>
            <option value="15">15 días</option>
            <option value="fecha">Hasta una fecha</option>
          </select>
        </Field>
        {duration === "fecha" && (
          <div className="motion-safe:animate-disclose">
            <Field label="Vigente hasta" name="until" error={errors.until} hint="Incluye todo ese día.">
              <input {...fieldProps("until", errors.until)} type="date" className={input} />
            </Field>
          </div>
        )}
      </div>
      <button type="submit" disabled={busy} className={`self-start ${buttonStyles.primary}`}>
        {pending ? "Creando…" : "Crear código"}
      </button>
    </form>
  );
}
