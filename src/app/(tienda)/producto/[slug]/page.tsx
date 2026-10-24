import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { linkStyles } from "@/components/button";
import { SizePurchase } from "@/components/store/size-purchase";
import { Gallery } from "@/components/store/gallery";
import { ProductCard, ProductLabel, transitionName } from "@/components/store/product-tile";
import { brandPath, getProduct, listProducts, listSizes } from "@/lib/catalog";
import { formatCOP } from "@/lib/format";
import { hasNotes } from "@/lib/notes";
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

  // Si el perfume no tiene otros tamaños activos, el selector recibe solo este.
  const purchaseSizes =
    sizes.length > 0
      ? sizes
      : [{ id: product.id, slug: product.slug, size_ml: product.size_ml, list_price: product.list_price, in_stock: product.in_stock }];

  const details = [
    { label: "Marca", value: product.brand },
    { label: "Para", value: product.audience },
    // Con varios tamaños se listan todos: este dato no cambia al elegir uno.
    {
      label: sizes.length > 1 ? "Tamaños" : "Tamaño",
      value:
        sizes.length > 1
          ? sizes.map((size) => (size.size_ml ? `${size.size_ml} ml` : "sin tamaño")).join(", ")
          : product.size_ml
            ? `${product.size_ml} ml`
            : null,
    },
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
            {/* Sin fotos ni notas, solo la etiqueta. Con alguna de las dos, la galería (la etiqueta
                va de primera si no hay fotos, y las notas al final). */}
            {product.images.length > 0 || hasNotes(product.notes) ? (
              <Gallery
                images={product.images}
                alt={title}
                notes={product.notes}
                fallback={<ProductLabel product={product} className="text-base sm:text-2xl" />}
              />
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
          {/* Precio, tamaños, stock y compra: al elegir otro tamaño solo cambia esto (ver size-purchase.tsx). */}
          <SizePurchase sizes={purchaseSizes} initialId={product.id} productName={product.name} />

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
            Pagos seguros con Wompi (tarjeta, PSE, Nequi o Bancolombia) o por transferencia.
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
