import type { MetadataRoute } from "next";
import { audiencePath, audienceTitles, brandPath, listBrands } from "@/lib/catalog";
import { sql } from "@/lib/db";
import { siteUrl } from "@/lib/site";

// El mapa se arma cuando un buscador lo pide, no al compilar: así publicar la app no
// depende de que la base de datos esté disponible en ese momento.
// ponytail: consulta la base en cada petición. Solo lo piden los buscadores, de vez en
// cuando; si llegara a pesar, guardar en caché con `revalidate`.
export const dynamic = "force-dynamic";

// /sitemap.xml: la lista de páginas públicas para los buscadores.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = (await sql`
    select slug, updated_at from products where is_active order by slug`) as { slug: string; updated_at: Date }[];

  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/catalogo`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/cotizar`, changeFrequency: "monthly", priority: 0.5 },
    ...["/terminos", "/privacidad", "/cambios-y-devoluciones"].map((path) => ({
      url: `${siteUrl}${path}`,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
    // Una página por público: "Perfumes para hombre", "para mujer" y "unisex".
    ...Object.keys(audienceTitles).map((audience) => ({
      url: `${siteUrl}${audiencePath(audience)}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    // Una página por marca: el catálogo filtrado.
    ...(await listBrands()).map((brand) => ({
      url: `${siteUrl}${brandPath(brand)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${siteUrl}/producto/${product.slug}`,
      lastModified: product.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
