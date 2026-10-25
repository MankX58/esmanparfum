"use client";

import { ArrowUp } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

export const SHOW_AFTER = 600; // px bajados antes de que aparezca el botón

// Botón para volver arriba. Aparece al bajar, y su anillo se va llenando a medida que se recorre
// la página (animación ligada al scroll, en globals.css: .scroll-progress). Al señalarlo, la flecha
// sale por arriba y entra otra por abajo. Con "reducir movimiento" sube sin desplazamiento suave.
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > SHOW_AFTER);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  function goUp() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={goUp}
      aria-label="Volver arriba"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      // Entra en 250 ms (sube 8px y crece desde 0.96); sale más rápido, en 150 ms.
      // El borde claro (ring-paper) lo separa de las tarjetas verdes del catálogo.
      className={`group fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 grid size-14 cursor-pointer place-items-center rounded-full bg-brand text-on-brand ring-2 ring-paper shadow-[0_12px_30px_-10px_oklch(0.22_0.02_136/0.6)] transition ease-smooth-out hover:bg-brand-strong active:scale-95 sm:right-8 sm:bottom-8 ${
        visible
          ? "translate-y-0 scale-100 opacity-100 duration-(--duration-fast)"
          : "pointer-events-none translate-y-2 scale-(--scale-large) opacity-0 duration-(--duration-quick)"
      }`}
    >
      {/* Anillo de avance: la pista tenue y encima lo recorrido. pathLength="1" permite medir en fracciones. */}
      <svg aria-hidden viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
        <circle cx="28" cy="28" r="25" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-25" />
        <circle
          cx="28"
          cy="28"
          r="25"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1"
          className="scroll-progress"
        />
      </svg>
      {/* Dos flechas apiladas: al señalar, la de arriba sale y la de abajo ocupa su lugar. */}
      <span aria-hidden className="relative block size-5 overflow-hidden">
        <span className="flex flex-col transition-transform duration-(--duration-fast) ease-smooth-out group-hover:-translate-y-1/2">
          <ArrowUp size={20} weight="bold" />
          <ArrowUp size={20} weight="bold" />
        </span>
      </span>
    </button>
  );
}
