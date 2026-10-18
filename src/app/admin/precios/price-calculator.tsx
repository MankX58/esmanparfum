"use client";

import { useState } from "react";
import { productOption, SearchSelect } from "@/components/search-select";
import { Field, fieldProps, inputStyles } from "@/components/field";
import { cell, numberCell, th } from "@/components/products-table";
import { SummaryLine } from "@/components/summary-line";
import { parseMoney, parsePercent, percentText } from "@/lib/form";
import { formatCOP, formatPercent } from "@/lib/format";
import { suggestPrice } from "@/lib/pricing";

export type PricedProduct = { id: number; sku: string; brand: string | null; name: string; size_ml: number | null; avg_cost: number; list_price: number };

const input = `${inputStyles} h-11`;
const moneyError = "Escribe un valor en pesos, sin decimales.";
const percentError = "Escribe un porcentaje entre 0 y 99.";
// Márgenes de la tabla comparativa, los mismos de la hoja "Precios" del Excel.
const margins = [0.2, 0.25, 0.3, 0.35, 0.4, 0.5, 0.6];

// Calculadora de precios. No guarda nada: sirve para decidir un precio antes de ponerlo en el producto.
export function PriceCalculator({
  products,
  defaults,
}: {
  products: PricedProduct[];
  defaults: { margin: number; fee: number; vat: number }; // fracciones, vienen de Ajustes
}) {
  const [productId, setProductId] = useState("");
  // Los campos se guardan como texto, tal como se escriben, y se convierten a número más abajo.
  const [costText, setCostText] = useState("");
  const [otherText, setOtherText] = useState("");
  const [marginText, setMarginText] = useState(percentText(defaults.margin));
  const [feeText, setFeeText] = useState(percentText(defaults.fee));
  const [vatText, setVatText] = useState(percentText(defaults.vat));

  const product = products.find((p) => String(p.id) === productId);

  // Al elegir un producto, el costo se llena con su costo promedio; después se puede cambiar.
  function chooseProduct(id: string) {
    setProductId(id);
    const chosen = products.find((p) => String(p.id) === id);
    if (chosen) setCostText(String(chosen.avg_cost));
  }

  // null = lo escrito todavía no es un valor válido.
  const cost = parseMoney(costText);
  const otherCosts = otherText.trim() === "" ? 0 : parseMoney(otherText);
  const margin = parsePercent(marginText);
  const fee = parsePercent(feeText);
  const vat = parsePercent(vatText);

  const errors = {
    cost: costText !== "" && cost === null ? moneyError : undefined,
    other: otherCosts === null ? moneyError : undefined,
    margin: margin === null ? percentError : undefined,
    fee: fee === null ? percentError : undefined,
    vat: vat === null ? percentError : undefined,
  };

  // Con todos los campos válidos se puede calcular.
  const ready = cost !== null && cost > 0 && otherCosts !== null && margin !== null && fee !== null && vat !== null;
  const entry = ready ? { cost, otherCosts, margin, fee, vat } : null;
  const price = entry && suggestPrice(entry);

  return (
    <div className="flex flex-col gap-16">
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Producto" name="product" hint="Opcional. Trae su costo promedio." className="sm:col-span-2">
            <SearchSelect
              id="product"
              options={products.map((p) => productOption(p))}
              value={productId}
              onChange={chooseProduct}
              emptyLabel="Escribir el costo a mano"
            />
          </Field>
          <Field label="Costo por unidad" name="cost" error={errors.cost} hint="Lo que te cuesta el perfume, con flete.">
            <input
              {...fieldProps("cost", errors.cost)}
              inputMode="numeric"
              value={costText}
              onChange={(event) => setCostText(event.target.value)}
              className={input}
            />
          </Field>
          <Field label="Otros costos por venta" name="other" error={errors.other} hint="Empaque, domicilio que regalas. Opcional.">
            <input
              {...fieldProps("other", errors.other)}
              inputMode="numeric"
              value={otherText}
              onChange={(event) => setOtherText(event.target.value)}
              className={input}
            />
          </Field>
          <Field
            label="Margen deseado (%)"
            name="margin"
            error={errors.margin}
            hint="Qué parte del precio de venta quieres que sea ganancia."
          >
            <input
              {...fieldProps("margin", errors.margin)}
              inputMode="decimal"
              value={marginText}
              onChange={(event) => setMarginText(event.target.value)}
              className={input}
            />
          </Field>
          <Field
            label="Comisión de pago (%)"
            name="fee"
            error={errors.fee}
            hint="Lo que te cobra el datáfono o la app. 0 si cobras por transferencia."
          >
            <input
              {...fieldProps("fee", errors.fee)}
              inputMode="decimal"
              value={feeText}
              onChange={(event) => setFeeText(event.target.value)}
              className={input}
            />
          </Field>
          <Field label="IVA a cobrar (%)" name="vat" error={errors.vat} hint="0 si no eres responsable de IVA.">
            <input
              {...fieldProps("vat", errors.vat)}
              inputMode="decimal"
              value={vatText}
              onChange={(event) => setVatText(event.target.value)}
              className={input}
            />
          </Field>
        </div>

        <aside aria-live="polite" className="border border-line bg-surface p-6 lg:sticky lg:top-8">
          <h2 className="font-display text-xl">Precio sugerido</h2>
          {!price || !entry ? (
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {entry
                ? "El margen y la comisión juntos no pueden llegar al 100 %. Baja alguno de los dos."
                : "Elige un producto o escribe el costo, y revisa los porcentajes, para ver a cuánto venderlo."}
            </p>
          ) : (
            <>
              <p key={price.rounded} className="mt-4 text-4xl font-medium tracking-tight tabular-nums motion-safe:animate-swap">
                {formatCOP(price.rounded)}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ink-faint">
                Es el costo dividido entre la parte del precio que queda después del margen y la comisión. Da{" "}
                {formatCOP(price.suggested)} y se redondea hacia arriba a miles.
              </p>
              <dl className="mt-6 flex flex-col gap-4 text-sm">
                {entry.vat > 0 && (
                  <SummaryLine label="Precio al cliente, con IVA" hint="El precio más el IVA: lo que paga el cliente.">
                    {formatCOP(price.withVat)}
                  </SummaryLine>
                )}
                {entry.fee > 0 && (
                  <SummaryLine label="Comisión de pago" hint="Lo que se queda el datáfono o la app en cada venta.">
                    {formatCOP(price.feeAmount)}
                  </SummaryLine>
                )}
                <SummaryLine label="Ganancia por unidad" hint="Precio menos costo, otros costos y comisión." danger={price.profit < 0}>
                  {formatCOP(price.profit)}
                </SummaryLine>
                <SummaryLine label="Margen real" hint="Ganancia dividida entre el precio. Cambia un poco por el redondeo.">
                  {formatPercent(price.realMargin)}
                </SummaryLine>
                <SummaryLine label="Ganancia sobre el costo" hint="Ganancia dividida entre el costo.">
                  {formatPercent(price.markup)}
                </SummaryLine>
                {product && (
                  <>
                    <div className="border-t border-line" />
                    <SummaryLine label="Precio actual en la tienda" hint="El que tiene hoy este producto.">
                      {formatCOP(product.list_price)}
                    </SummaryLine>
                  </>
                )}
              </dl>
            </>
          )}
        </aside>
      </div>

      {entry && (
        <section>
          <h2 className="font-display text-xl">Según el margen que quieras</h2>
          <p className="mt-2 mb-6 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
            Con el mismo costo y la misma comisión. El margen se mide sobre el precio, no sobre el costo: si compras a
            $100 y vendes a $150, ganas 50 % sobre el costo, pero tu margen es 33 %.
          </p>
          <div className="overflow-x-auto border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line">
                <tr>
                  <th className={th}>Margen</th>
                  <th className={`${th} text-right`}>Precio</th>
                  <th className={`${th} text-right`}>Ganancia por unidad</th>
                  <th className={`${th} text-right`}>Ganancia sobre el costo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {margins.map((option) => {
                  const result = suggestPrice({ ...entry, margin: option });
                  return (
                    <tr key={option}>
                      <td className={`${cell} py-4 tabular-nums`}>{formatPercent(option)}</td>
                      <td className={`${numberCell} font-medium`}>{result ? formatCOP(result.rounded) : "No se puede"}</td>
                      <td className={numberCell}>{result ? formatCOP(result.profit) : ""}</td>
                      <td className={`${numberCell} text-ink-soft`}>{result ? formatPercent(result.markup) : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
