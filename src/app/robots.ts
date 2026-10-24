import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// /robots.txt: les dice a los buscadores qué pueden recorrer. La tienda sí; el panel,
// el inicio de sesión y las páginas personales (carrito, pedidos) no.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/auth", "/carrito", "/checkout", "/pedidos", "/sin-acceso", "/entrar", "/*?*q="],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
