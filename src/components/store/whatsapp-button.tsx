"use client";

import { WhatsappLogo } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";

// Botón flotante para escribir a la tienda. En el teléfono se oculta donde hay barra de compra
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
      className={`fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 size-13 items-center justify-center rounded-full bg-brand text-on-brand shadow-lg transition-transform duration-(--duration-fast) ease-smooth-out hover:scale-105 sm:right-6 sm:bottom-6 sm:flex ${hasBottomBar ? "hidden" : "flex"}`}
    >
      <WhatsappLogo size={28} weight="fill" aria-hidden />
    </a>
  );
}
