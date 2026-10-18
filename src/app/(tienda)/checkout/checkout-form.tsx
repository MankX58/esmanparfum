"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { sileo } from "sileo";
import { buttonStyles, linkStyles } from "@/components/button";
import { Field, fieldProps, inputStyles } from "@/components/field";
import { useCart } from "@/lib/cart";
import type { StoreProduct } from "@/lib/catalog";
import { formatCOP } from "@/lib/format";
import { lineDiscount, type PromoCode } from "@/lib/promo";
import { deliveryEstimate } from "@/lib/site";
import { useServerForm } from "@/lib/use-server-form";
import { getCartProducts } from "../carrito/actions";
import { checkPromo, createOrder } from "./actions";

const input = `${inputStyles} h-11`;

export function CheckoutForm({ defaultName, shippingFee }: { defaultName: string; shippingFee: number }) {
  const router = useRouter();
  const { cart, clear } = useCart();
  const [products, setProducts] = useState<StoreProduct[] | null>(null);

  const ids = Object.keys(cart).sort().join(",");
  useEffect(() => {
    let cancelled = false;
    getCartProducts(ids ? ids.split(",").map(Number) : []).then((result) => {
      if (!cancelled) setProducts(result);
    });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  const lines = (products ?? []).filter((product) => cart[product.id]);
  const items = lines.map((product) => ({ id: product.id, quantity: cart[product.id] }));
  const subtotal = lines.reduce((total, product) => total + product.list_price * cart[product.id], 0);

  // Código promocional: se comprueba en el servidor al aplicarlo y otra vez al crear el pedido.
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState("");
  const [checkingPromo, startPromoCheck] = useTransition();
  // Mismo cálculo que el servidor: el descuento de cada línea, redondeado, y luego la suma.
  const discount = promo ? lines.reduce((total, product) => total + lineDiscount(product.list_price * cart[product.id], promo.percent), 0) : 0;

  function applyPromo() {
    if (!promoInput.trim()) return;
    startPromoCheck(async () => {
      const result = await checkPromo(promoInput);
      setPromo(result);
      setPromoError(result ? "" : "Este código no existe, venció o ya no está activo.");
      if (result) sileo.success({ title: "Código aplicado", description: `${result.percent}% de descuento` });
    });
  }

  const { state, pending, busy, handleSubmit } = useServerForm(
    (formData) => createOrder(items, formData),
    (result) => {
      clear();
      sileo.success({ title: "Pedido creado", description: "Ahora verás cómo pagarlo." });
      router.push(`/pedidos/${result.id}`);
    },
  );
  const errors = state.errors ?? {};
  const promoMessage = promoError || errors.promo;

  if (products !== null && lines.length === 0 && !pending && !state.ok) {
    return (
      <div className="border border-line bg-surface px-6 py-16">
        <h2 className="font-display text-2xl">Tu carrito está vacío</h2>
        <p className="mt-2 text-sm text-ink-soft">Agrega un perfume antes de hacer el pedido.</p>
        <Link href="/catalogo" className={`mt-8 ${buttonStyles.primary}`}>
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex flex-col gap-6">
        {state.message && (
          <p role="alert" className="border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {state.message}
          </p>
        )}
        <h2 className="font-display text-xl">Datos de envío</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Nombre de quien recibe" name="name" error={errors.name}>
            <input {...fieldProps("name", errors.name)} autoComplete="name" defaultValue={defaultName} className={input} />
          </Field>
          <Field label="Teléfono o WhatsApp" name="phone" error={errors.phone}>
            <input {...fieldProps("phone", errors.phone)} type="tel" autoComplete="tel" className={input} />
          </Field>
          <Field label="Dirección" name="address" error={errors.address} className="sm:col-span-2" hint="Incluye barrio, torre o apartamento si aplica.">
            <input {...fieldProps("address", errors.address)} autoComplete="street-address" className={input} />
          </Field>
          <Field label="Ciudad" name="city" error={errors.city}>
            <input {...fieldProps("city", errors.city)} autoComplete="address-level2" className={input} />
          </Field>
          <Field label="Notas para la entrega" name="notes" error={errors.notes} hint="Opcional.">
            <input {...fieldProps("notes", errors.notes)} className={input} />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-line pt-8">
          <button type="submit" disabled={busy || products === null} className={buttonStyles.primary}>
            {pending ? "Creando el pedido…" : "Hacer el pedido"}
          </button>
          <Link href="/carrito" className={buttonStyles.secondary}>
            Volver al carrito
          </Link>
        </div>
        <p className="text-xs leading-relaxed text-ink-faint">
          Después de hacer el pedido pagas en Wompi, de forma segura, con tarjeta, PSE, Nequi o Bancolombia. No se cobra nada en esta página.
        </p>
      </div>

      <aside className="border border-line bg-surface p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-xl">Tu pedido</h2>
        {products === null ? (
          <div className="mt-6 h-24 bg-mist motion-safe:animate-skeleton" />
        ) : (
          <>
            <ul className="mt-6 flex flex-col gap-3 text-sm">
              {lines.map((product) => (
                <li key={product.id} className="flex justify-between gap-4">
                  <span className="text-ink-soft">
                    {cart[product.id]} × {product.name}
                    {product.size_ml ? `, ${product.size_ml} ml` : ""}
                  </span>
                  <span className="shrink-0 tabular-nums">{formatCOP(product.list_price * cart[product.id])}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-6 flex flex-col gap-3 border-t border-line pt-6 text-sm">
              {promo && (
                <div key={promo.code} className="flex justify-between gap-4 text-ok motion-safe:animate-swap">
                  <dt>
                    Descuento {promo.code} ({promo.percent}%)
                  </dt>
                  <dd className="tabular-nums">−{formatCOP(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Envío</dt>
                <dd className="tabular-nums">{shippingFee > 0 ? formatCOP(shippingFee) : "Se coordina contigo"}</dd>
              </div>
              <div className="flex justify-between gap-4 text-base font-medium">
                <dt>Total a pagar</dt>
                <dd key={discount} className="tabular-nums motion-safe:animate-swap">
                  {formatCOP(subtotal - discount + shippingFee)}
                </dd>
              </div>
            </dl>
          </>
        )}

        {/* El código viaja con el pedido en el campo oculto "promo". Enter aplica el código
            en lugar de enviar todo el formulario. */}
        <div className="mt-6 border-t border-line pt-6">
          <input type="hidden" name="promo" value={promo?.code ?? ""} />
          <label htmlFor="promo-input" className="text-sm font-medium">
            Código promocional
          </label>
          {promo ? (
            <p className="mt-2 flex items-center justify-between gap-4 text-sm">
              <span className="font-medium tracking-wide">{promo.code}</span>
              <button
                type="button"
                onClick={() => {
                  setPromo(null);
                  setPromoInput("");
                }}
                className={linkStyles.default}
              >
                Quitar
              </button>
            </p>
          ) : (
            <div className="mt-2 flex gap-2">
              <input
                id="promo-input"
                value={promoInput}
                onChange={(event) => setPromoInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyPromo();
                  }
                }}
                autoComplete="off"
                aria-invalid={promoMessage ? true : undefined}
                aria-describedby={promoMessage ? "promo-error" : undefined}
                className={`${input} min-w-0 flex-1 uppercase placeholder:normal-case`}
                placeholder="Escríbelo aquí"
              />
              <button type="button" onClick={applyPromo} disabled={checkingPromo || !promoInput.trim()} className={buttonStyles.secondary}>
                {checkingPromo ? "…" : "Aplicar"}
              </button>
            </div>
          )}
          {promoMessage && (
            <p id="promo-error" className="mt-2 text-sm text-danger">
              {promoMessage}
            </p>
          )}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-ink-soft">
          La entrega tarda {deliveryEstimate} aproximadamente desde que se confirma tu pago.
        </p>
      </aside>
    </form>
  );
}
