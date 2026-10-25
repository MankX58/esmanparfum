import Link from "next/link";
import { AdminNav } from "./admin-nav";
import { linkStyles } from "./button";
import { Logo } from "./logo";

// Marco del panel. La zona verde lleva la marca, las secciones y la sesión:
// - En pantallas anchas (xl) es una barra lateral fija, con las secciones agrupadas.
// - En las demás es una cabecera, con las secciones en una fila que se desliza de lado.
// Son los mismos tres bloques; solo cambia cómo se acomodan.
export function AdminShell({ userLabel, children }: { userLabel: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col xl:flex-row">
      <header className="flex flex-wrap items-center gap-x-10 bg-brand px-4 text-on-brand sm:px-8 xl:sticky xl:top-0 xl:h-screen xl:w-60 xl:shrink-0 xl:flex-col xl:flex-nowrap xl:items-stretch xl:overflow-y-auto xl:px-0">
        <Link href="/admin" aria-label="Panel de Ésman Parfum" className="flex h-16 shrink-0 items-center xl:px-6">
          <Logo tone="light" className="h-9" />
        </Link>
        <div className="order-last w-full xl:order-none xl:flex-1">
          <AdminNav />
        </div>
        <div className="ml-auto flex items-center gap-5 text-sm xl:ml-0 xl:flex-col xl:items-start xl:gap-0 xl:border-t xl:border-on-brand/15 xl:px-6 xl:py-4">
          <span className="hidden text-on-brand-soft md:inline xl:mb-1 xl:block xl:max-w-full xl:truncate xl:text-xs">{userLabel}</span>
          <Link href="/" className={linkStyles.onBrand}>
            Ver tienda
          </Link>
          <a href="/auth/logout" className={linkStyles.onBrand}>
            Salir
          </a>
        </div>
      </header>
      {/* min-w-0: junto a la barra lateral, una tabla ancha se desliza dentro de su marco en vez de ensanchar la página. */}
      <main id="contenido" className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 pt-12 pb-20 sm:px-8">{children}</main>
    </div>
  );
}
