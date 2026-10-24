import { cache } from "react";
import { redirect } from "next/navigation";
import { auth0 } from "./auth0";
import { sql } from "./db";

export type User = {
  id: number;
  email: string | null;
  name: string | null;
  role: "customer" | "admin";
  picture: string | null; // foto de la cuenta de Google; no se guarda, viene de la sesión
};

// Usuario de nuestra base de datos para la sesión actual, o null si no hay sesión.
// La primera vez que alguien entra se crea su fila con rol "customer".
// cache() evita repetir la consulta dentro de una misma petición.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await auth0.getSession();
  if (!session) return null;

  const { sub, email, name } = session.user;
  // Solo la foto de Google: con correo y contraseña Auth0 manda un avatar genérico.
  const picture = sub.startsWith("google-oauth2|") ? (session.user.picture ?? null) : null;
  const existing = await sql`select id, email, name, role from users where auth0_sub = ${sub}`;
  if (existing[0]) return { ...existing[0], picture } as User;

  // Primera visita con sesión: se crea la fila.
  const rows = await sql`
    insert into users (auth0_sub, email, name)
    values (${sub}, ${email ?? null}, ${name ?? null})
    on conflict (auth0_sub) do update set email = excluded.email, name = excluded.name
    returning id, email, name, role`;
  return { ...rows[0], picture } as User;
});

// Para páginas y acciones que necesitan una persona con sesión (hacer un pedido, ver sus pedidos).
// `returnTo` es a dónde vuelve después de iniciar sesión.
export async function requireUser(returnTo: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?returnTo=${encodeURIComponent(returnTo)}`);
  return user;
}

// Toda página o acción del panel empieza llamando a esto. El rol se lee de la
// base de datos en el servidor: ocultar un botón en el navegador no protege nada.
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?returnTo=/admin");
  if (user.role !== "admin") redirect("/sin-acceso");
  return user;
}
