import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles } from "@/components/button";
import { Wordmark } from "@/components/wordmark";

export const metadata: Metadata = { title: "Página no encontrada", robots: { index: false } };

// Se muestra cuando la dirección no existe o el producto ya no está en el catálogo.
export default function NotFound() {
  return (
    <main id="contenido" className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-24 sm:px-8">
      <Link href="/" aria-label="Ésman Parfum, inicio">
        <Wordmark className="text-sm" />
      </Link>
      <h1 className="mt-10 font-display text-5xl font-light tracking-tight text-balance motion-safe:animate-unveil sm:text-6xl">
        Esta página no existe
      </h1>
      <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-ink-soft">
        Puede que el enlace esté mal escrito o que el perfume ya no esté en el catálogo.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/catalogo" className={buttonStyles.primary}>
          Ver catálogo
        </Link>
        <Link href="/" className={buttonStyles.secondary}>
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
