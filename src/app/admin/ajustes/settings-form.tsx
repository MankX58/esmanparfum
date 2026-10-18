"use client";

import { sileo } from "sileo";
import { buttonStyles } from "@/components/button";
import { Field, fieldProps, inputStyles } from "@/components/field";
import type { StoreSettings } from "@/lib/orders";
import { TRANSFER_DISCOUNT } from "@/lib/promo";
import { useServerForm } from "@/lib/use-server-form";
import { saveStoreSettings } from "./actions";

const input = `${inputStyles} h-11`;

export function SettingsForm({ settings, wompi }: { settings: StoreSettings; wompi: { configured: boolean; testMode: boolean } }) {
  const { state, pending, busy, handleSubmit } = useServerForm(saveStoreSettings, () => {
    sileo.success({ title: "Ajustes guardados" });
  });
  const errors = state.errors ?? {};

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-12">
      {/* Wompi no se configura aquí: sus llaves son secretas y van en las variables de entorno. */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl">Pagos con Wompi</h2>
        {wompi.configured ? (
          <p className="max-w-[60ch] text-sm leading-relaxed text-ink-soft">
            <span className={`mr-2 px-2 py-1 text-[11px] font-medium tracking-[0.08em] uppercase ${wompi.testMode ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok"}`}>
              {wompi.testMode ? "Modo de pruebas" : "Activo"}
            </span>
            {wompi.testMode
              ? "Los pagos son de prueba: no se mueve dinero real. Para cobrar de verdad, cambia las llaves por las de producción."
              : "Los clientes pagan con tarjeta, PSE, Nequi o Bancolombia, y el pedido se confirma solo cuando Wompi aprueba el pago."}
          </p>
        ) : (
          <p role="alert" className="border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            Falta conectar Wompi: los clientes no pueden pagar. Agrega las llaves WOMPI_* en las variables de entorno (los pasos
            están en el README).
          </p>
        )}
      </section>

      <section className="flex flex-col gap-6 border-t border-line pt-10">
        <h2 className="font-display text-xl">Pago por transferencia</h2>
        <p className="-mt-3 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
          Quien elige transferencia al hacer el pedido recibe un {TRANSFER_DISCOUNT}% de descuento y ve este QR con el valor
          exacto. Después pulsa Ya pagué y tú confirmas el pago en Pedidos cuando lo veas en el banco.
        </p>
        <Field
          label="Imagen del QR de pago"
          name="qrImage"
          error={errors.qrImage}
          hint="Nombre del archivo guardado en la carpeta public del proyecto. Ejemplo: /pago-qr.jpg. Vacío = el cliente ve que le enviarás los datos por WhatsApp."
        >
          <input {...fieldProps("qrImage", errors.qrImage)} defaultValue={settings.qrImage} className={input} />
        </Field>
      </section>

      <section className="flex flex-col gap-6 border-t border-line pt-10">
        <h2 className="font-display text-xl">Contacto y envío</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="WhatsApp de la tienda"
            name="whatsapp"
            error={errors.whatsapp}
            hint="Con indicativo del país. Ejemplo: 57 300 123 4567."
          >
            <input {...fieldProps("whatsapp", errors.whatsapp)} type="tel" defaultValue={settings.whatsapp} className={input} />
          </Field>
          <Field
            label="Costo de envío"
            name="shippingFee"
            error={errors.shippingFee}
            hint="Valor fijo que se suma a cada pedido. Con 0, el envío se coordina aparte con el cliente."
          >
            <input
              {...fieldProps("shippingFee", errors.shippingFee)}
              inputMode="numeric"
              defaultValue={settings.shippingFee}
              className={input}
            />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-6 border-t border-line pt-10">
        <h2 className="font-display text-xl">Datos legales de la tienda</h2>
        <p className="-mt-3 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
          La ley pide que la tienda diga quién la responde y cómo contactarla (Estatuto del Consumidor y Ley de protección de
          datos). Se muestran en Términos y condiciones, Política de privacidad y Cambios y devoluciones.
        </p>
        {!(settings.legalName && settings.legalId && settings.address && settings.email) && (
          <p role="alert" className="border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
            Faltan datos: mientras estén vacíos, las páginas legales dicen &quot;pendiente&quot; en su lugar. Llénalos antes de vender.
          </p>
        )}
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Nombre completo o razón social" name="legalName" error={errors.legalName} hint="De quien vende: tú o tu empresa.">
            <input {...fieldProps("legalName", errors.legalName)} defaultValue={settings.legalName} className={input} />
          </Field>
          <Field label="Cédula o NIT" name="legalId" error={errors.legalId}>
            <input {...fieldProps("legalId", errors.legalId)} defaultValue={settings.legalId} className={input} />
          </Field>
          <Field label="Domicilio" name="address" error={errors.address} hint="Dirección y ciudad. Ejemplo: Calle 10 # 40-20, Medellín.">
            <input {...fieldProps("address", errors.address)} defaultValue={settings.address} className={input} />
          </Field>
          <Field label="Correo de contacto" name="email" error={errors.email} hint="Para quejas, devoluciones y datos personales.">
            <input {...fieldProps("email", errors.email)} type="email" defaultValue={settings.email} className={input} />
          </Field>
        </div>
      </section>

      <div className="border-t border-line pt-8">
        <button type="submit" disabled={busy} className={buttonStyles.primary}>
          {pending ? "Guardando…" : "Guardar ajustes"}
        </button>
      </div>
    </form>
  );
}
