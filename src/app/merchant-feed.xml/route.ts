import { sql } from "@/lib/db";
import { absoluteUrl, deliveryDays, siteUrl } from "@/lib/site";

// Se arma cuando Google lo pide, igual que el mapa del sitio: precios y stock siempre al día.
export const dynamic = "force-dynamic";

type Row = {
  slug: string;
  name: string;
  brand: string | null;
  audience: string | null;
  size_ml: number | null;
  description: string | null;
  list_price: number;
  images: string[];
  in_stock: boolean;
  group_id: number;
};

const gender: Record<string, string> = { Hombre: "male", Mujer: "female", Unisex: "unisex" };
const escape = (text: string) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const tag = (name: string, value: string | number | null | undefined) =>
  value === null || value === undefined || value === "" ? "" : `<g:${name}>${escape(String(value))}</g:${name}>`;

// /merchant-feed.xml: el catálogo para Google Merchant Center (RSS 2.0 con campos "g:").
// Cada tamaño es un producto; los tamaños del mismo perfume comparten item_group_id.
// Sin foto, Google no acepta el producto: esos perfumes se dejan fuera.
// ponytail: sin GTIN (perfumes de marcas árabes casi no lo traen), por eso identifier_exists = no.
// El envío y las devoluciones se configuran en Merchant Center, no aquí.
export async function GET() {
  const rows = (await sql`
    select p.slug, p.name, p.brand, p.audience, p.size_ml, p.description, p.list_price, p.images, s.stock > 0 as in_stock,
           coalesce(p.parent_id, p.id) as group_id
    from products p
    join product_stats s on s.product_id = p.id
    where p.is_active and cardinality(p.images) > 0
    order by p.id`) as Row[];

  // Los "bajo pedido" exigen fecha de disponibilidad: hoy + el plazo máximo de entrega (hora de Colombia, UTC-5).
  const backorderDate = `${new Date(Date.now() + (deliveryDays.max * 24 - 5) * 36e5).toISOString().slice(0, 10)}T00:00-05:00`;

  const items = rows
    .map((p) => {
      const title = `${p.name}${p.size_ml ? ` ${p.size_ml} ml` : ""}`;
      const description = p.description?.trim() || `Perfume original ${title}${p.brand ? ` de ${p.brand}` : ""}.`;
      return `<item>
${tag("id", p.slug)}
${tag("title", `Perfume ${title}`)}
${tag("description", description)}
${tag("link", absoluteUrl(`/producto/${p.slug}`))}
${tag("image_link", absoluteUrl(p.images[0]))}
${p.images.slice(1, 10).map((image) => tag("additional_image_link", absoluteUrl(image))).join("")}
${tag("availability", p.in_stock ? "in_stock" : "backorder")}
${p.in_stock ? "" : tag("availability_date", backorderDate)}
${tag("price",`${p.list_price} COP`)}
${tag("brand", p.brand ?? "Ésman Parfum")}
${tag("condition", "new")}
${tag("identifier_exists", "no")}
${tag("google_product_category", "Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne")}
${tag("product_type", "Perfumes")}
${tag("gender", p.audience ? gender[p.audience] : null)}
${tag("age_group", "adult")}
${tag("item_group_id", p.group_id)}
</item>`.replace(/\n+/g, "\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>Ésman Parfum</title>
<link>${siteUrl}</link>
<description>Perfumes originales para hombre, mujer y unisex con envío a toda Colombia.</description>
${items}
</channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" } });
}
