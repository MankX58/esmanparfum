import { auth0 } from "./lib/auth0";

// Auth0 atiende aquí /auth/login, /auth/logout y /auth/callback, y mantiene la sesión.
// Esto NO decide permisos: cada página del panel comprueba el rol con requireAdmin().
export async function proxy(request: Request) {
  return await auth0.middleware(request);
}

export const config = {
  // api/wompi: los avisos de Wompi no traen sesión y no deben pasar por Auth0.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/wompi).*)"],
};
