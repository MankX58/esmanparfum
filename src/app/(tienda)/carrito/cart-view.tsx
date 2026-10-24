"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonStyles, linkStyles } from "@/components/button";
import { QuantityStepper } from "@/components/store/add-to-cart";
import { ProductLabel, availability } from "@/components/store/product-tile";
import { useCart } from "@/lib/cart";
import type { StoreProduct } from "@/lib/catalog";
import { formatCOP } from "@/lib/format";
import { getCartProducts } from "./actions";

export function CartView() {
  const { cart, setQuantity } = useCart();
  // null = todavía cargando los datos de los productos.
  const [products, setProducts] = useState<StoreProduct[] | null>(null);
  // En el teléfono, mientras el resumen no se ve, una barra fija abajo lleva al pedido.
  const summaryRef = useRef<HTMLElement>(null);
  const [barVisible, setBarVisible] = useState(false);

  // Solo se vuelve a consultar cuando cambia QUÉ productos hay, no sus cantidades.
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

  const hasSummary = products !== null && products.length > 0;
  useEffect(() => {
    const node = summaryRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setBarVisible(!entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasSummary]);

  if (products === null) {
    return (
      <div aria-busy="true" aria-label="Cargando el carrito" className="motion-safe:animate-skeleton">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-5 border-t border-line py-6">
            <div className="aspect-[4/5] w-24 bg-mist" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-1/2 bg-mist" />
              <div className="h-4 w-1/4 bg-mist" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Un producto que ya no está activo desaparece de la lista aunque siga guardado.
  const lines = products.filter((product) => cart[product.id]);

  if (lines.length === 0) {
    return (
      <div className="border border-line bg-surface px-6 py-16 motion-safe:animate-settle">
        <h2 className="font-display text-2xl">Tu carrito está vacío</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">Cuando agregues un perfume, aparecerá aquí.</p>
        <Link href="/catalogo" className={`mt-8 ${buttonStyles.primary}`}>
          Ver catálogo
        </Link>
      </div>
    );
  }

  const subtotal = lines.reduce((total, product) => total + product.list_price * cart[product.id], 0);
  const units = lines.reduce((total, product) => total + cart[product.id], 0);

  return (
    <div className="grid items-start gap-12 motion-safe:animate-settle lg:grid-cols-[minmax(0,1fr)_22rem]">
      <ul className="border-b border-line">
        {lines.map((product) => (
          <li key={product.id} className="flex gap-4 border-t border-line py-6 sm:gap-6">
            <Link href={`/producto/${product.slug}`} tabIndex={-1} aria-hidden className="group w-20 shrink-0 sm:w-28">
              <ProductLabel product={product} className="text-[6px] sm:text-[9px]" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link href={`/producto/${product.slug}`} className="font-medium py-2 underline decoration-transparent transition-colors duration-(--duration-quick) ease-smooth-out hover:decoration-ink">
                    {product.name}
                  </Link>
                  <p className="mt-1 text-xs text-ink-faint">
                    {[product.brand, product.size_ml && `${product.size_ml} ml`, availability(product)].filter(Boolean).join(", ")}
                  </p>
                </div>
                {/* key: el total de la línea vuelve a entrar cuando cambia la cantidad. */}
                <p key={cart[product.id]} className="shrink-0 font-medium tabular-nums motion-safe:animate-swap">
                  {formatCOP(product.list_price * cart[product.id])}
                </p>
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                <QuantityStepper
                  value={cart[product.id]}
                  onChange={(quantity) => setQuantity(product.id, quantity)}
                  label={`Cantidad de ${product.name}`}
                />
                <button type="button" onClick={() => setQuantity(product.id, 0)} className={`-mr-2 inline-flex min-h-11 items-center px-2 text-sm text-ink-soft ${linkStyles.default}`}>
                  Quitar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside ref={summaryRef} className="border border-line bg-surface p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-xl">Resumen</h2>
        <dl className="mt-6 flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">
              {units} {units === 1 ? "unidad" : "unidades"}
            </dt>
            <dd key={subtotal} className="font-medium tabular-nums motion-safe:animate-swap">
              {formatCOP(subtotal)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Envío</dt>
            <dd className="text-ink-soft">Se define en el siguiente paso</dd>
          </div>
        </dl>
        <Link href="/checkout" className={`mt-8 w-full ${buttonStyles.primary}`}>
          Continuar con el pedido
        </Link>
        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          El total se confirma en el servidor con los precios vigentes antes de crear el pedido.
        </p>
      </aside>

      <div
        aria-hidden={!barVisible}
        inert={!barVisible}
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md transition duration-(--duration-fast) ease-smooth-out lg:hidden ${
          barVisible ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <div>
            <p className="text-xs text-ink-soft">
              {units} {units === 1 ? "unidad" : "unidades"}
            </p>
            <p className="text-lg leading-tight font-medium tabular-nums">{formatCOP(subtotal)}</p>
          </div>
          <Link href="/checkout" className={`ml-auto ${buttonStyles.primary}`}>
            Continuar con el pedido
          </Link>
        </div>
      </div>
    </div>
  );
}
