"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sileo } from "sileo";
import { buttonStyles } from "@/components/button";
import { MAX_PER_PRODUCT, useCart } from "@/lib/cart";

// Selector de cantidad: menos, número, más.
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  label: string;
}) {
  const step = "grid size-11 place-items-center text-lg transition-colors duration-(--duration-quick) ease-smooth-out hover:bg-mist disabled:opacity-30";

  return (
    <div role="group" aria-label={label} className="inline-flex items-center border border-line bg-surface">
      <button type="button" aria-label="Quitar una unidad" disabled={value <= min} onClick={() => onChange(value - 1)} className={step}>
        −
      </button>
      {/* key: al cambiar, el número vuelve a entrar con una transición corta. */}
      <span key={value} aria-live="polite" className="w-10 text-center text-sm font-medium tabular-nums motion-safe:animate-swap">
        {value}
      </span>
      <button
        type="button"
        aria-label="Agregar una unidad"
        disabled={value >= MAX_PER_PRODUCT}
        onClick={() => onChange(value + 1)}
        className={step}
      >
        +
      </button>
    </div>
  );
}

// Botón de agregar al carrito, con selector de cantidad. Avisa con un toast que lleva al carrito.
export function AddToCart({ productId }: { productId: number }) {
  const { add } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);

  function handleAdd() {
    add(productId, quantity);
    sileo.success({
      title: quantity === 1 ? "Agregado al carrito" : `${quantity} unidades agregadas`,
      duration: 2000,
      fill: "#596357",
      roundness: 6,
      button: { title: "Ver carrito", onClick: () => router.push("/carrito") },
    });
    setQuantity(1);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <QuantityStepper value={quantity} onChange={setQuantity} label="Cantidad" />
      <button type="button" onClick={handleAdd} className={`flex-1 ${buttonStyles.primary}`}>
        Agregar al carrito
      </button>
    </div>
  );
}
