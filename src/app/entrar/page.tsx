import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { linkStyles } from "@/components/button";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth";
import { queryText } from "@/lib/form";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

// Solo rutas de esta tienda: "/pedidos", nunca "https://otro-sitio" ni "//otro-sitio".
const safePath = (value: string) => (value.startsWith("/") && !value.startsWith("//") ? value : "/");

// La puerta de entrada de la tienda. Google es el camino principal (un toque); el correo y la
// contraseña se piden en la pantalla de Auth0, y de ahí vuelve aquí. /auth/login lo atiende
// Auth0: por eso son <a> y no <Link>.
export default async function SignInPage({ searchParams }: PageProps<"/entrar">) {
  const returnTo = safePath(queryText((await searchParams).returnTo));
  if (await getCurrentUser()) redirect(returnTo);

  const next = `returnTo=${encodeURIComponent(returnTo)}`;
  const button =
    "flex h-14 w-full items-center justify-center gap-3 border text-base transition duration-(--duration-quick) ease-smooth-out";

  return (
    <main id="contenido" className="grid flex-1 lg:grid-cols-[1.05fr_1fr]">
      {/* La marca, solo en pantallas grandes: el verde de la tienda con su bruma. */}
      <aside className="relative hidden overflow-hidden bg-brand p-14 text-on-brand lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute inset-0">
          <span className="absolute -top-1/4 -right-1/4 size-4/5 bg-[radial-gradient(closest-side,var(--color-on-brand-soft),transparent)] opacity-30 motion-safe:animate-mist" />
          <span
            style={{ "--mist-from": "10% -8%", "--mist-to": "-14% 12%", animationDuration: "23s" } as React.CSSProperties}
            className="absolute -bottom-1/3 -left-1/4 size-[90%] bg-[radial-gradient(closest-side,var(--color-brand-strong),transparent)] motion-safe:animate-mist"
          />
        </div>
        <Link href="/" aria-label="Ésman Parfum, inicio" className="relative w-fit">
          <Logo tone="light" className="h-12" />
        </Link>
        <div className="relative max-w-[16ch] motion-safe:animate-unveil">
          <h2 className="font-display text-6xl leading-[1.02] font-light tracking-tight text-balance">Perfumes para ser recordado</h2>
          <p className="mt-6 max-w-[34ch] leading-relaxed text-on-brand-soft">
            Entra para seguir tus pedidos y comprar en segundos, con envío a toda Colombia.
          </p>
        </div>
        <p className="relative text-xs tracking-[0.18em] text-on-brand-soft uppercase">Perfumes originales · Colombia</p>
      </aside>

      <section className="flex flex-col items-center justify-center px-4 py-12 sm:px-8">
        <Link href="/" aria-label="Ésman Parfum, inicio" className="mb-10 lg:hidden">
          <Logo className="h-10" />
        </Link>
        <div className="w-full max-w-sm motion-safe:animate-unveil">
          <h1 className="font-display text-4xl font-light tracking-tight text-balance">Te damos la bienvenida</h1>
          <p className="mt-3 leading-relaxed text-ink-soft">Entra o crea tu cuenta para hacer tu pedido.</p>

          <a
            href={`/auth/login?connection=google-oauth2&${next}`}
            className={`${button} mt-8 border-ink bg-surface font-medium shadow-[0_10px_24px_-14px_rgb(28_33_27/0.45)] hover:-translate-y-px hover:shadow-[0_16px_30px_-14px_rgb(28_33_27/0.5)]`}
          >
            <GoogleMark />
            Continuar con Google
          </a>

          <div className="my-6 flex items-center gap-4 text-xs tracking-[0.18em] text-ink-soft uppercase" aria-hidden>
            <span className="h-px flex-1 bg-line" />o
            <span className="h-px flex-1 bg-line" />
          </div>

          <a href={`/auth/login?${next}`} className={`${button} border-line hover:border-ink`}>
            Entrar con correo y contraseña
          </a>

          <p className="mt-8 text-center text-sm text-ink-soft">
            ¿Primera vez?{" "}
            <a href={`/auth/login?screen_hint=signup&${next}`} className={`${linkStyles.default} font-medium text-ink`}>
              Crea tu cuenta
            </a>
          </p>

          <p className="mt-10 text-center text-xs leading-relaxed text-ink-faint">
            Al continuar aceptas los{" "}
            <Link href="/terminos" className={linkStyles.default}>
              términos
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" className={linkStyles.default}>
              política de privacidad
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}

// El logo de Google, con sus cuatro colores de marca.
function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-5">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.2 5.6c4.3-3.9 7.1-9.7 7.1-17.1z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.2-5.6c-2 1.4-4.6 2.2-8.7 2.2-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}
