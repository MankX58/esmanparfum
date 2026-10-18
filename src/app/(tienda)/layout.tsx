import Link from "next/link";
import { linkStyles } from "@/components/button";
import { AccountMenu } from "@/components/store/account-menu";
import { CartLink } from "@/components/store/header-links";
import { navLink, navText, navUnderline } from "@/components/store/nav-styles";
import { Wordmark } from "@/components/wordmark";
import { getCurrentUser } from "@/lib/auth";

// ponytail: las páginas de la tienda consultan la base de datos en cada visita, así
// un cambio de precio en el panel se ve al instante. Si el tráfico crece, pasar a
// páginas en caché que se refrescan al guardar (revalidatePath).
export const dynamic = "force-dynamic";

// Marco de la tienda pública: cabecera fija, contenido y pie.
export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-8">
          <Link href="/" aria-label="Velare, inicio">
            <Wordmark className="text-sm" />
          </Link>
          <nav aria-label="Principal" className="group/nav flex items-center gap-3 text-sm sm:gap-8">
            <Link href="/catalogo" className={`${navText} ${navLink}`}>
              Catálogo
            </Link>
            {/* En el teléfono no cabe: se llega a Cotizar desde la portada, el catálogo y el pie. */}
            <Link href="/cotizar" className={`${navLink} ${navUnderline} hidden min-h-11 items-center sm:inline-flex`}>
              Cotizar
            </Link>
            {user ? (
              // Auth0 pone el correo como nombre cuando la persona no dio uno: no se repite.
              <AccountMenu name={user.name === user.email ? null : user.name} email={user.email} picture={user.picture} isAdmin={isAdmin} />
            ) : (
              // /auth/login lo atiende Auth0: por eso es <a> y no <Link>.
              <a href="/auth/login" className={`${navText} ${navLink}`}>
                Entrar
              </a>
            )}
            <CartLink />
          </nav>
        </div>
      </header>

      <div id="contenido" className="flex flex-1 flex-col">
        {children}
      </div>

      {/* Pie de una sola franja: marca, una frase y los enlaces. */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-2 px-4 py-5 text-sm text-ink-soft sm:px-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <Wordmark className="text-xs text-ink" />
            <p>Fragancias que dejan huella. Perfumes con envío en Colombia.</p>
          </div>
          <nav aria-label="Pie de página" className="flex flex-wrap gap-x-6">
            <Link href="/catalogo" className={linkStyles.default}>
              Catálogo
            </Link>
            <Link href="/cotizar" className={linkStyles.default}>
              Cotizar
            </Link>
            <Link href="/carrito" className={linkStyles.default}>
              Carrito
            </Link>
            {isAdmin && (
              <Link href="/admin" className={linkStyles.default}>
                Panel
              </Link>
            )}
          </nav>
        </div>
        {/* Lo legal: segunda franja, más discreta. */}
        <div className="border-t border-line">
          <nav
            aria-label="Información legal"
            className="mx-auto flex max-w-7xl flex-wrap gap-x-6 gap-y-1 px-4 py-4 text-xs text-ink-faint sm:px-8"
          >
            <Link href="/terminos" className={linkStyles.default}>
              Términos y condiciones
            </Link>
            <Link href="/privacidad" className={linkStyles.default}>
              Política de privacidad
            </Link>
            <Link href="/cambios-y-devoluciones" className={linkStyles.default}>
              Cambios, devoluciones y garantía
            </Link>
            <a href="https://www.sic.gov.co" target="_blank" rel="noreferrer" className={linkStyles.default}>
              Superintendencia de Industria y Comercio
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
