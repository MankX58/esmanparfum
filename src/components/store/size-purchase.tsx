"use client";

import { useState } from "react";
import type { ProductSize } from "@/lib/catalog";
import { formatCOP } from "@/lib/format";
import { AddToCart } from "./add-to-cart";

// Precio, tamaños, stock y botón de compra de un perfume. Elegir otro tamaño NO cambia de página:
// solo cambian el precio (con una transición corta), el tamaño marcado y el producto que se agrega
// al carrito. El título, la foto y la descripción se quedan quietos. La dirección se actualiza
// (history.replaceState) para que al compartirla o recargarla se abra el tamaño elegido.
export function SizePurchase({ sizes, initialId, productName }: { sizes: ProductSize[]; initialId: number; productName: string }) {
  const [selectedId, setSelectedId] = useState(initialId);
  // Hasta el primer cambio, el precio entra con la animación de la página; después, con "swap".
  const [changed, setChanged] = useState(false);
  const size = sizes.find((option) => option.id === selectedId) ?? sizes[0];
  const sizeText = (option: ProductSize) => (option.size_ml ? `${option.size_ml} ml` : "Sin tamaño");

  function choose(option: ProductSize) {
    if (option.id === selectedId) return;
    setSelectedId(option.id);
    setChanged(true);
    window.history.replaceState(null, "", `/producto/${option.slug}`);
  }

  return (
    <>
      {/* key: el precio vuelve a entrar solo cuando cambia de tamaño (sube 4px y se enfoca, 150 ms). */}
      <p
        key={changed ? size.id : "inicio"}
        aria-live="polite"
        className={`mt-6 text-3xl font-medium tabular-nums ${
          changed ? "motion-safe:animate-swap" : "motion-safe:animate-unveil motion-safe:[animation-delay:calc(var(--duration-micro)*2)]"
        }`}
      >
        {formatCOP(size.list_price)}
      </p>

      {sizes.length > 1 && (
        <div
          role="group"
          aria-label="Tamaño"
          className="mt-6 flex flex-wrap gap-2 motion-safe:animate-unveil motion-safe:[animation-delay:calc(var(--duration-micro)*3)]"
        >
          {sizes.map((option) => {
            const current = option.id === size.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={current}
                onClick={() => choose(option)}
                // Solo cambian el borde y los colores, con un fundido corto: nada se mueve de su sitio.
                className={`flex min-h-11 cursor-pointer flex-col justify-center border px-4 py-2 text-left text-sm transition-colors duration-(--duration-fast) ease-smooth-out ${
                  current ? "border-brand bg-brand text-on-brand" : "border-line bg-surface hover:border-ink"
                }`}
              >
                <span className="font-medium tabular-nums">{sizeText(option)}</span>
                <span
                  className={`text-xs tabular-nums transition-colors duration-(--duration-fast) ease-smooth-out ${current ? "text-on-brand-soft" : "text-ink-soft"}`}
                >
                  {formatCOP(option.list_price)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-6 flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
        {size.in_stock && (
          <span
            key={size.id}
            className="mt-0.5 shrink-0 bg-ok-soft px-2 py-1 text-[11px] leading-none font-medium tracking-[0.08em] text-ok uppercase motion-safe:animate-swap"
          >
            En stock
          </span>
        )}
        Te lo enviamos después de confirmar tu pago.
      </p>

      <div className="mt-8">
        <AddToCart productId={size.id} productName={sizes.length > 1 ? `${productName}, ${sizeText(size)}` : productName} />
      </div>
    </>
  );
}
