"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sileo } from "sileo";
import { buttonStyles } from "@/components/button";
import { Field, fieldProps, inputStyles } from "@/components/field";
import { SearchSelect } from "@/components/search-select";
import { productOption } from "@/lib/product-option";
import { SummaryLine } from "@/components/summary-line";
import { parseMoney } from "@/lib/form";
import { formatCOP } from "@/lib/format";
import { purchaseEffect } from "@/lib/inventory";
import { useServerForm } from "@/lib/use-server-form";
import { createPurchase } from "./actions";

export type PurchaseProduct = {
  id: number;
  sku: string;
  brand: string | null;
  name: string;
  size_ml: number | null;
  stock: number;
  avg_cost: number;
  units_in: number; // stock inicial + unidades compradas
  cost_basis: number; // lo que han costado esas unidades
};

const input = `${inputStyles} h-11`;

export function PurchaseForm({
  products,
  suppliers,
  paymentMethods,
  today,
  defaultProductId,
}: {
  products: PurchaseProduct[];
  suppliers: string[];
  paymentMethods: string[];
  today: string;
  defaultProductId?: string;
}) {
  const router = useRouter();
  // Estos cuatro campos se guardan en estado para calcular el resumen mientras se escribe.
  const [productId, setProductId] = useState(defaultProductId ?? "");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [shipping, setShipping] = useState("");

  const product = products.find((p) => String(p.id) === productId);
  const quantityValue = Number(quantity);
  const unitCostValue = parseMoney(unitCost);
  const shippingValue = shipping.trim() === "" ? 0 : parseMoney(shipping);
  const effect =
    product && Number.isInteger(quantityValue) && quantityValue > 0 && unitCostValue !== null && shippingValue !== null
      ? purchaseEffect(
          { stock: product.stock, unitsIn: product.units_in, costBasis: product.cost_basis, avgCost: product.avg_cost },
          quantityValue,
          unitCostValue,
          shippingValue,
        )
      : null;

  const { state, pending, busy, handleSubmit } = useServerForm(createPurchase, () => {
    sileo.success({
      title: "Compra registrada",
      description: product && effect ? `${product.name}: stock ${effect.newStock}` : undefined,
    });
    router.push("/admin/compras");
  });
  const errors = state.errors ?? {};

  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-10">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Producto" name="product_id" error={errors.product_id} className="sm:col-span-2">
<SearchSelect
              id="product_id"
              name="product_id"
              options={products.map((p) => productOption(p, `stock ${p.stock}`))}
              value={productId}
              onChange={setProductId}
              placeholder="Busca por nombre, marca o SKU"
              invalid={Boolean(errors.product_id)}
              describedBy={errors.product_id ? "product_id-error" : undefined}
            />
          </Field>
          <Field label="Fecha" name="purchased_on" error={errors.purchased_on}>
            <input {...fieldProps("purchased_on", errors.purchased_on)} type="date" defaultValue={today} className={input} />
          </Field>
          <Field label="Cantidad" name="quantity" error={errors.quantity}>
            <input
              {...fieldProps("quantity", errors.quantity)}
              inputMode="numeric"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className={input}
            />
          </Field>
          <Field label="Costo unitario" name="unit_cost" error={errors.unit_cost} hint="Lo que cobra el proveedor por unidad.">
            <input
              {...fieldProps("unit_cost", errors.unit_cost)}
              inputMode="numeric"
              value={unitCost}
              onChange={(event) => setUnitCost(event.target.value)}
              className={input}
            />
          </Field>
          <Field
            label="Envío o flete"
            name="shipping_cost"
            error={errors.shipping_cost}
            hint="De toda la compra. Se reparte entre las unidades."
          >
            <input
              {...fieldProps("shipping_cost", errors.shipping_cost)}
              inputMode="numeric"
              value={shipping}
              onChange={(event) => setShipping(event.target.value)}
              className={input}
            />
          </Field>
        </div>

        <div className="grid gap-6 border-t border-line pt-10 sm:grid-cols-2">
          <Field label="Proveedor" name="supplier" error={errors.supplier}>
            <input {...fieldProps("supplier", errors.supplier)} list="suppliers" defaultValue={suppliers[0]} className={input} />
            <datalist id="suppliers">
              {suppliers.map((supplier) => (
                <option key={supplier} value={supplier} />
              ))}
            </datalist>
          </Field>
          <Field label="Método de pago" name="payment_method" error={errors.payment_method}>
            <select {...fieldProps("payment_method", errors.payment_method)} defaultValue="" className={input}>
              <option value="">Sin definir</option>
              {paymentMethods.map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
          </Field>
          <Field label="Notas o número de factura" name="notes" error={errors.notes} className="sm:col-span-2">
            <input {...fieldProps("notes", errors.notes)} className={input} />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-line pt-8">
          <button type="submit" disabled={busy} className={buttonStyles.primary}>
            {pending ? "Registrando…" : "Registrar compra"}
          </button>
          <Link href="/admin/compras" className={buttonStyles.secondary}>
            Cancelar
          </Link>
        </div>
      </div>

      {/* Resumen en vivo: lo que el Excel calculaba en las columnas grises de Compras y Productos. */}
      <aside aria-live="polite" className="border border-line bg-surface p-6 lg:sticky lg:top-8">
        <h2 className="font-display text-xl">Resumen</h2>
        {!effect || !product ? (
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Elige el producto y escribe la cantidad y el costo para ver cómo quedan el stock y el costo promedio.
          </p>
        ) : (
          <dl className="mt-6 flex flex-col gap-3 text-sm">
            <SummaryLine label="Costo total">{formatCOP(effect.totalCost)}</SummaryLine>
            <SummaryLine label="Costo real por unidad">{formatCOP(effect.realUnitCost)}</SummaryLine>
            <div className="my-2 border-t border-line" />
            <SummaryLine label="Stock" from={String(product.stock)}>
              {effect.newStock}
            </SummaryLine>
            <SummaryLine label="Costo promedio" from={formatCOP(product.avg_cost)}>
              {formatCOP(effect.newAvgCost)}
            </SummaryLine>
          </dl>
        )}
      </aside>
    </form>
  );
}
