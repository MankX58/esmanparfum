"use client";

import { useState, useTransition } from "react";
import { sileo } from "sileo";
import { buttonStyles, linkStyles } from "@/components/button";
import { Field, fieldProps, inputStyles } from "@/components/field";
import { useServerForm } from "@/lib/use-server-form";
import { confirmPayment, saveOrderDetails, shipOrder } from "./actions";

// Confirmar el pago a mano pide un segundo clic: es la decisión que mueve plata e inventario.
// Normalmente no se usa: Wompi confirma solo los pagos aprobados.
export function ConfirmPayment({ orderId }: { orderId: number }) {
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await confirmPayment(orderId);
      if (result.ok) sileo.success({ title: "Pago confirmado" });
      else sileo.error({ title: "No se pudo confirmar", description: result.message });
      setAsking(false);
    });
  }

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className={buttonStyles.primary}>
        Confirmar el pago a mano
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="font-medium">¿Ya viste el pago aprobado en Wompi o en tu banco?</p>
      <div className="flex items-center gap-4">
        <button type="button" onClick={confirm} disabled={pending} className={buttonStyles.primary}>
          {pending ? "Confirmando…" : "Sí, confirmar"}
        </button>
        <button type="button" onClick={() => setAsking(false)} disabled={pending} className={linkStyles.default}>
          Todavía no
        </button>
      </div>
    </div>
  );
}

// Despachar: la guía (opcional) y el botón que pasa el pedido a Enviado.
export function ShipForm({ orderId, tracking }: { orderId: number; tracking: string | null }) {
  const { state, pending, busy, handleSubmit } = useServerForm(shipOrder.bind(null, orderId), () => {
    sileo.success({ title: "Pedido marcado como enviado" });
  });
  const errors = state.errors ?? {};

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {state.message && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      <Field
        label="Guía de envío (opcional)"
        name="tracking"
        error={errors.tracking}
        hint="Transportadora y número. El cliente la ve en su pedido. Déjala vacía si lo entregas en persona."
      >
        <input {...fieldProps("tracking", errors.tracking)} defaultValue={tracking ?? ""} className={`${inputStyles} h-11`} />
      </Field>
      <button type="submit" disabled={busy} className={`self-start ${buttonStyles.primary}`}>
        {pending ? "Guardando…" : "Marcar como enviado"}
      </button>
    </form>
  );
}

// Guía y notas internas. No cambia el estado del pedido.
// `showTracking`: la guía solo se edita aquí cuando el pedido ya salió; antes va en ShipForm.
export function DetailsForm({
  orderId,
  tracking,
  notes,
  showTracking,
}: {
  orderId: number;
  tracking: string | null;
  notes: string | null;
  showTracking: boolean;
}) {
  const { state, pending, busy, handleSubmit } = useServerForm(saveOrderDetails.bind(null, orderId), () => {
    sileo.success({ title: "Guardado" });
  });
  const errors = state.errors ?? {};

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {state.message && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      {showTracking ? (
        <Field label="Guía de envío" name="tracking" error={errors.tracking} hint="Transportadora y número. El cliente la ve en su pedido.">
          <input {...fieldProps("tracking", errors.tracking)} defaultValue={tracking ?? ""} className={`${inputStyles} h-11`} />
        </Field>
      ) : (
        <input type="hidden" name="tracking" value={tracking ?? ""} />
      )}
      <Field label="Notas internas" name="admin_notes" error={errors.admin_notes} hint="Solo las ve el equipo.">
        <textarea
          {...fieldProps("admin_notes", errors.admin_notes)}
          rows={3}
          defaultValue={notes ?? ""}
          className={`${inputStyles} py-2.5 leading-relaxed`}
        />
      </Field>
      <button type="submit" disabled={busy} className={`self-start ${buttonStyles.secondary}`}>
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
