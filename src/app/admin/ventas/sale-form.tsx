"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sileo } from "sileo";
import { buttonStyles, linkStyles } from "@/components/button";
import { Field, fieldProps, inputStyles } from "@/components/field";
import { SearchSelect } from "@/components/search-select";
import { productOption } from "@/lib/product-option";
import { parseMoney } from "@/lib/form";
import { formatCOP } from "@/lib/format";
import { useServerForm } from "@/lib/use-server-form";
import { createInStoreSale } from "./actions";

export type SaleProduct = { id: number; sku: string; brand: string | null; name: string; size_ml: number | null; list_price: number; stock: number };

// Una línea mientras se escribe: los números se guardan como texto hasta enviar.
type Line = { key: number; productId: string; quantity: string; price: string };

const input = `${inputStyles} h-11`;
let nextKey = 1;
const emptyLine = (): Line => ({ key: nextKey++, productId: "", quantity: "1", price: "" });

// Venta en persona: uno o varios perfumes, el cliente (opcional), cómo pagó y si ya se cobró.
export function SaleForm({
  products,
  customers,
  paymentMethods,
  today,
}: {
  products: SaleProduct[];
  customers: string[];
  paymentMethods: string[];
  today: string;
}) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>(() => [emptyLine()]);

  const options = products.map((p) => productOption(p, `stock ${p.stock}`));

  const update = (key: number, change: Partial<Line>) =>
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...change } : line)));

  // Lo que se envía al servidor: solo las líneas completas y bien escritas.
  const ready = lines.flatMap((line) => {
    const quantity = Number(line.quantity);
    const unitPrice = parseMoney(line.price);
    return line.productId && Number.isInteger(quantity) && quantity > 0 && unitPrice !== null
      ? [{ id: Number(line.productId), quantity, unitPrice }]
      : [];
  });
  const total = ready.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

  const { state, pending, busy, handleSubmit } = useServerForm(
    (formData) => createInStoreSale(ready, formData),
    () => {
      sileo.success({ title: "Venta registrada", description: formatCOP(total) });
      router.push("/admin/ventas");
    },
  );
  const errors = state.errors ?? {};
  const incomplete = ready.length !== lines.length;

  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-10">
        {state.message && (
          <p role="alert" className="border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {state.message}
          </p>
        )}

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-xl">Productos</h2>
          <ul className="flex flex-col gap-4">
            {lines.map((line, index) => {
              const product = products.find((p) => String(p.id) === line.productId);
              return (
                <li
                  key={line.key}
                  className="grid gap-3 border-b border-line pb-4 motion-safe:animate-disclose sm:grid-cols-[minmax(0,1fr)_5.5rem_9rem_auto] sm:items-end"
                >
                  <div className="flex flex-col gap-2 text-sm font-medium">
                    <label htmlFor={`product-${line.key}`}>Producto {lines.length > 1 && index + 1}</label>
                    <div className="font-normal">
                      <SearchSelect
                        id={`product-${line.key}`}
                        options={options}
                        value={line.productId}
                        // Al elegir el perfume se propone su precio de lista; se puede cambiar (descuento, regateo).
                        onChange={(productId) => {
                          const chosen = products.find((p) => String(p.id) === productId);
                          update(line.key, { productId, price: chosen ? String(chosen.list_price) : "" });
                        }}
                        placeholder="Busca por nombre, marca o SKU"
                      />
                    </div>
                  </div>
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    Cantidad
                    <input
                      inputMode="numeric"
                      value={line.quantity}
                      onChange={(event) => update(line.key, { quantity: event.target.value })}
                      className={`${input} font-normal`}
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    Precio por unidad
                    <input
                      inputMode="numeric"
                      value={line.price}
                      onChange={(event) => update(line.key, { price: event.target.value })}
                      className={`${input} font-normal`}
                    />
                  </label>
                  {lines.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setLines((current) => current.filter((other) => other.key !== line.key))}
                      className={`text-sm sm:mb-1 ${linkStyles.danger}`}
                    >
                      Quitar
                    </button>
                  ) : (
                    <span className="hidden sm:block" />
                  )}
                  {product && (
                    <p className={`text-xs sm:col-span-4 ${product.stock > 0 ? "text-ink-faint" : "text-warn"}`}>
                      Stock en el sistema: {product.stock}.
                      {product.stock <= 0 && " Si lo tenías y no lo registraste como compra, el stock quedará negativo."}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <button type="button" onClick={() => setLines((current) => [...current, emptyLine()])} className={`self-start ${buttonStyles.secondary}`}>
            Agregar otro producto
          </button>
          {errors.lines && <p className="text-sm text-danger">{errors.lines}</p>}
        </section>

        <section className="grid gap-6 border-t border-line pt-10 sm:grid-cols-2">
          <Field label="Fecha de la venta" name="sold_on" error={errors.sold_on}>
            <input {...fieldProps("sold_on", errors.sold_on)} type="date" defaultValue={today} max={today} className={input} />
          </Field>
          <Field label="Método de pago" name="payment_method" error={errors.payment_method}>
            <select {...fieldProps("payment_method", errors.payment_method)} defaultValue={paymentMethods[0] ?? ""} className={input}>
              {paymentMethods.map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
          </Field>
          <Field label="Cliente" name="customer" error={errors.customer} hint="Opcional. Si ya existe, se usa su ficha; si no, se crea.">
            <input {...fieldProps("customer", errors.customer)} list="customers" autoComplete="off" className={input} />
            <datalist id="customers">
              {customers.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </Field>
          <Field label="Teléfono del cliente" name="phone" error={errors.phone} hint="Opcional.">
            <input {...fieldProps("phone", errors.phone)} type="tel" className={input} />
          </Field>
          <Field label="Notas" name="notes" error={errors.notes} className="sm:col-span-2" hint="Opcional. Solo las ve el equipo.">
            <input {...fieldProps("notes", errors.notes)} className={input} />
          </Field>
          <label className="flex min-h-11 items-center gap-3 text-sm sm:col-span-2">
            <input type="checkbox" name="paid" defaultChecked className="size-5 accent-brand" />
            Ya la cobré: entra a caja con la fecha de la venta. Si la dejas sin marcar, queda por cobrar.
          </label>
        </section>

        <div className="flex flex-wrap items-center gap-4 border-t border-line pt-8">
          <button type="submit" disabled={busy || ready.length === 0} className={buttonStyles.primary}>
            {pending ? "Registrando…" : "Registrar venta"}
          </button>
          <Link href="/admin/ventas" className={buttonStyles.secondary}>
            Cancelar
          </Link>
        </div>
      </div>

      <aside aria-live="polite" className="border border-line bg-surface p-6 lg:sticky lg:top-8">
        <h2 className="font-display text-xl">Resumen</h2>
        <dl className="mt-6 flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Canal</dt>
            <dd>Presencial</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Unidades</dt>
            <dd className="tabular-nums">{ready.reduce((sum, line) => sum + line.quantity, 0)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line pt-3 text-base font-medium">
            <dt>Total</dt>
            <dd key={total} className="tabular-nums motion-safe:animate-swap">
              {formatCOP(total)}
            </dd>
          </div>
        </dl>
        {incomplete && <p className="mt-4 text-xs leading-relaxed text-ink-faint">Las líneas sin producto, cantidad o precio no se cuentan.</p>}
      </aside>
    </form>
  );
}
