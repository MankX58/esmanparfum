"use client";

import { sileo } from "sileo";
import { buttonStyles } from "@/components/button";
import { Field, fieldProps, inputStyles } from "@/components/field";
import { useServerForm } from "@/lib/use-server-form";
import { reportPayment } from "./actions";

// "Ya pagué": el cliente cuenta desde dónde transfirió para que sea fácil encontrar el pago en el banco.
export function ReportPaymentForm({ orderId }: { orderId: number }) {
  const { state, pending, busy, handleSubmit } = useServerForm(reportPayment.bind(null, orderId), () => {
    sileo.success({ title: "Aviso recibido", description: "Verificaremos tu pago." });
  });
  const error = state.errors?.reference ?? state.message;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field
        label="¿Desde dónde pagaste?"
        name="reference"
        error={error}
        hint="Nombre del titular y banco o billetera desde la que transferiste. Ejemplo: Laura Pérez, Nequi."
      >
        <input {...fieldProps("reference", error)} className={`${inputStyles} h-11`} />
      </Field>
      <button type="submit" disabled={busy} className={`self-start ${buttonStyles.primary}`}>
        {pending ? "Enviando…" : "Ya pagué"}
      </button>
    </form>
  );
}
