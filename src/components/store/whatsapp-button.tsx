"use client";

import { WhatsappLogo } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";

// Botón flotante para escribir a la tienda. Va justo encima del de "Volver arriba" (mismo tamaño y
// borde derecho) para que nunca se superpongan. En el teléfono se oculta donde hay barra de compra
// fija abajo (producto, carrito, checkout y pedido) para no taparla.
export function WhatsappButton({ href }: { href: string }) {
  const pathname = usePathname();
  const hasBottomBar = /^\/(producto|carrito|checkout|pedidos)/.test(pathname);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribir a Ésman Parfum por WhatsApp"
      className={`fixed right-4 bottom-[max(5.25rem,calc(env(safe-area-inset-bottom)+4.25rem))] z-30 size-14 items-center justify-center rounded-full bg-brand text-on-brand shadow-lg ring-2 ring-paper transition-transform duration-(--duration-fast) ease-smooth-out hover:scale-105 sm:right-8 sm:bottom-[6.25rem] sm:flex ${hasBottomBar ? "hidden" : "flex"}`}
    >
      <WhatsappLogo size={28} weight="fill" aria-hidden />
    </a>
  );
}
