import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonStyles, linkStyles } from "@/components/button";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Sin acceso" };

export default async function NoAccessPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?returnTo=/admin");
  if (user.role === "admin") redirect("/admin");

  return (
    <main id="contenido" className="flex flex-1 items-center px-6 py-16 sm:px-12">
      <div className="mx-auto w-full max-w-lg motion-safe:animate-unveil">
        <h1 className="font-display text-3xl leading-tight text-balance sm:text-4xl">
          Tu cuenta no tiene acceso al panel
        </h1>
        <p className="mt-4 leading-relaxed text-ink-soft">
          Iniciaste sesión como <span className="text-ink">{user.email ?? user.name}</span>, que no es una cuenta de
          administrador. Si deberías tener acceso, pídeselo a quien administra la tienda.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <Link href="/" className={buttonStyles.primary}>
            Volver al inicio
          </Link>
          <a href="/auth/logout" className={`text-sm ${linkStyles.default}`}>
            Cerrar sesión
          </a>
        </div>
      </div>
    </main>
  );
}
