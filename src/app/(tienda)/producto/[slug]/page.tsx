import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { linkStyles } from "@/components/button";
import { AddToCart } from "@/components/store/add-to-cart";
import { Gallery } from "@/components/store/gallery";
import { ProductCard, ProductLabel, transitionName } from "@/components/store/product-tile";
import { brandPath, getProduct, listProducts, listSizes } from "@/lib/catalog";
import { formatCOP } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";

// Título y descripción para buscadores y para la vista previa al compartir el enlace.
export async function generateMetadata({ params }: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};

  const title = [product.brand, product.name].filter(Boolean).join(" ");
  const description =
    product.description ??
    `${title}${product.size_ml ? `, ${product.size_ml} ml` : ""}. ${formatCOP(product.list_price)} en Velare.`;
  return {
    title,
    description,
    // canonical: la dirección oficial de esta página, para que los buscadores no la cuenten dos veces.
    alternates: { canonical: `/producto/${product.slug}` },
    // Sin foto propia no se declara imagen: así queda la de la tienda (opengraph-image.tsx).
    openGraph: { title, description, images: product.images.length > 0 ? product.images.slice(0, 1) : undefined },
  };
}

export default async function ProductPage({ params }: PageProps<"/producto/[slug]">) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();

  const title = [product.brand, product.name].filter(Boolean).join(" ");

  // Datos del producto en el formato que leen los buscadores (schema.org), para que puedan
  // mostrar el precio en los resultados. La disponibilidad solo se declara si hay stock.
  // El segundo bloque es el camino hasta el perfume (Velare › Catálogo › Marca › Perfume), que
  // los buscadores muestran en el resultado en lugar de la dirección.
  const trail = [
    { name: "Velare", path: "/" },
    { name: "Catálogo", path: "/catalogo" },
    ...(product.brand ? [{ name: product.brand, path: brandPath(product.brand) }] : []),
    { name: product.name, path: `/producto/${product.slug}` },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: title,
        description: product.description ?? undefined,
        brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
        image: product.images.length > 0 ? product.images.map(absoluteUrl) : undefined,
        offers: {
          "@type": "Offer",
          url: absoluteUrl(`/producto/${product.slug}`),
          priceCurrency: "COP",
          price: product.list_price,
          availability: product.in_stock ? "https://schema.org/InStock" : undefined,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: trail.map((step, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: step.name,
          item: absoluteUrl(step.path),
        })),
      },
    ],
  };

  const [sizes, brandProducts] = await Promise.all([
    listSizes(product.group_id),
    product.brand ? listProducts({ marca: product.brand, limit: 5 }) : [],
  ]);
  // group_id y no id: en la lista, este perfume puede estar representado por otro de sus tamaños.
  const sameBrand = brandProducts.filter((other) => other.group_id !== product.group_id).slice(0, 4);

  const details = [
    { label: "Marca", value: product.brand },
    { label: "Para", value: product.audience },
    { label: "Tamaño", value: product.size_ml ? `${product.size_ml} ml` : null },
    { label: "Categoría", value: product.category },
  ].filter((detail) => detail.value);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-8 pb-24 sm:px-8">
      {/* El reemplazo de "<" evita que un texto del producto pueda cerrar la etiqueta script. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/catalogo" className={`text-sm text-ink-soft ${linkStyles.default}`}>
        Volver al catálogo
      </Link>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
        {/* data-sheen: un destello cruza la caja una vez, cuando la página termina de entrar. */}
        <div
          data-sheen
          style={{ "--sheen-delay": "450ms" } as React.CSSProperties}
          className="group mx-auto w-full max-w-lg lg:sticky lg:top-24"
        >
          {/* Con fotos, la galería; sin fotos, la etiqueta con el nombre del perfume. */}
          {/* Mismo nombre que la tarjeta del catálogo: la caja llega hasta aquí creciendo desde donde estaba. */}
          <ViewTransition name={transitionName(product.id)} share="morph" default="none">
            {product.images.length > 0 ? (
              <Gallery images={product.images} alt={title} />
            ) : (
              <ProductLabel product={product} className="text-base sm:text-2xl" />
            )}
          </ViewTransition>
        </div>

        <div className="lg:py-6">
          {product.brand && (
            <p className="font-display text-sm tracking-[0.22em] text-ink-soft uppercase motion-safe:animate-unveil">
              <Link href={brandPath(product.brand)} className="py-2 transition-colors duration-(--duration-quick) ease-smooth-out hover:text-ink">
                {product.brand}
              </Link>
            </p>
          )}
          <h1 className="mt-3 font-display text-4xl leading-[1.05] font-light tracking-tight text-balance motion-safe:animate-unveil motion-safe:[animation-delay:var(--duration-micro)] sm:text-6xl">
            {product.name}
          </h1>
          <p className="mt-6 text-3xl font-medium motion-safe:animate-unveil motion-safe:[animation-delay:calc(var(--duration-micro)*2)]">
            {formatCOP(product.list_price)}
          </p>

          {/* Cada tamaño es un producto con su propia página: elegir uno es ir a ella.
              scroll={false} y replace: la página no salta arriba ni llena el botón Atrás. */}
          {sizes.length > 1 && (
            <nav aria-label="Tamaño" className="mt-6 flex flex-wrap gap-2">
              {sizes.map((size) => {
                const current = size.slug === product.slug;
                return (
                  <Link
                    key={size.slug}
                    href={`/producto/${size.slug}`}
                    scroll={false}
                    replace
                    aria-current={current ? "page" : undefined}
                    className={`flex min-h-11 flex-col justify-center border px-4 py-2 text-sm transition-colors duration-(--duration-quick) ease-smooth-out ${
                      current ? "border-brand bg-brand text-on-brand" : "border-line bg-surface hover:border-ink"
                    }`}
                  >
                    <span className="font-medium tabular-nums">{size.size_ml ? `${size.size_ml} ml` : "Sin tamaño"}</span>
                    <span className={`text-xs tabular-nums ${current ? "text-on-brand-soft" : "text-ink-soft"}`}>
                      {formatCOP(size.list_price)}
                    </span>
                  </Link>
                );
              })}
            </nav>
          )}

          <p className="mt-6 flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
            {product.in_stock && (
              <span className="mt-0.5 shrink-0 bg-ok-soft px-2 py-1 text-[11px] leading-none font-medium tracking-[0.08em] text-ok uppercase">
                En stock
              </span>
            )}
            Te lo enviamos después de confirmar tu pago.
          </p>

          <div className="mt-8">
            <AddToCart productId={product.id} productName={product.name} />
          </div>

          {product.description && <p className="mt-10 max-w-[60ch] leading-relaxed whitespace-pre-line">{product.description}</p>}

          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-line pt-8 text-sm">
            {details.map((detail) => (
              <div key={detail.label}>
                <dt className="text-ink-faint">{detail.label}</dt>
                <dd className="mt-1">{detail.value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 border-t border-line pt-6 text-sm leading-relaxed text-ink-soft">
            Pagos seguros con Wompi: tarjeta de crédito o débito, PSE, Nequi o Bancolombia.
          </p>
        </div>
      </div>

      {sameBrand.length > 0 && (
        <section className="mt-28">
          <h2 className="reveal mb-8 font-display text-3xl font-light tracking-tight">Más de {product.brand}</h2>
          <div className="group/grid grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {sameBrand.map((other) => (
              <div key={other.id} className="reveal">
                <ProductCard product={other} labelClassName="text-[11px] sm:text-sm" />
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
