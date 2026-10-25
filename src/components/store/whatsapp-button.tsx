"use client";

import { WhatsappLogo } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SHOW_AFTER } from "./back-to-top";

// Botón flotante para escribir a la tienda. En el catálogo, cuando aparece "Volver arriba" (mismo
// punto de scroll), sube para dejarle su sitio; sin él, vuelve a la esquina. En el teléfono se
// oculta donde hay barra de compra fija abajo (producto, carrito, checkout y pedido) para no taparla.
export function WhatsappButton({ href }: { href: string }) {
  const pathname = usePathname();
  const hasBottomBar = /^\/(producto|carrito|checkout|pedidos)/.test(pathname);
  const hasBackToTop = pathname.startsWith("/catalogo");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > SHOW_AFTER);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const raised = hasBackToTop && scrolled;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribir a Ésman Parfum por WhatsApp"
      className={`fixed right-4 z-30 size-14 items-center justify-center rounded-full bg-brand text-on-brand shadow-lg ring-2 ring-paper transition-[bottom,transform] duration-(--duration-fast) ease-smooth-out hover:scale-105 sm:right-8 sm:flex ${
        raised
          ? "bottom-[max(5.25rem,calc(env(safe-area-inset-bottom)+4.25rem))] sm:bottom-[6.25rem]"
          : "bottom-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-8"
      } ${hasBottomBar ? "hidden" : "flex"}`}
    >
      <WhatsappLogo size={28} weight="fill" aria-hidden />
    </a>
  );
}
