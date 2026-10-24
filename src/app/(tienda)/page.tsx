import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, ViewTransition } from "react";
import { buttonStyles } from "@/components/button";
import { ProductCard, ProductLabel, transitionName } from "@/components/store/product-tile";
import { brandPath, countByAudience, listBrands, listProducts } from "@/lib/catalog";
import { absoluteUrl, siteUrl } from "@/lib/site";

// El título y la descripción son los del sitio (layout raíz); aquí solo se fija la dirección oficial.
export const metadata: Metadata = { alternates: { canonical: "/" } };

const audienceNames: Record<string, string> = { Hombre: "Para él", Mujer: "Para ella", Unisex: "Unisex" };

const steps = [
  { title: "Elige", text: "Explora el catálogo y agrega al carrito lo que te guste." },
  { title: "Paga como prefieras", text: "En línea con Wompi (tarjeta, PSE, Nequi o Bancolombia) o por transferencia con el QR de la tienda." },
  { title: "Preparamos tu pedido", text: "Apenas se confirma el pago, lo alistamos. Con Wompi es inmediato." },
  { title: "Recíbelo", text: "Te lo enviamos a la dirección que indiques al hacer el pedido." },
];

const headline = "Cada aroma, en su versión original.";

// Datos de la tienda en el formato que leen los buscadores (schema.org): el nombre del
// sitio, cómo más lo buscan ("Ésman Parfum") y el logo.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "Ésman Parfum",
      alternateName: ["Ésman", "Esman Parfum", "Esman", "Ésman Parfum Colombia"],
      url: siteUrl,
      inLanguage: "es-CO",
      // Permite que Google muestre un buscador de la tienda dentro de su resultado.
      potentialAction: { "@type": "SearchAction", target: `${siteUrl}/catalogo?q={search_term_string}`, "query-input": "required name=search_term_string" },
    },
    {
      "@type": "OnlineStore",
      name: "Ésman Parfum",
      alternateName: ["Ésman", "Esman Parfum"],
      url: siteUrl,
      logo: absoluteUrl("/icon"),
      description: "Ésman Parfum es una tienda en línea de perfumes originales para hombre, mujer y unisex, con envío a toda Colombia.",
      areaServed: "CO",
    },
  ],
};

// Giro final y tono de cada caja de la portada (tonos que contrastan con el fondo verde:
// porcelana, casi negro y niebla).
const tilts = ["-7deg", "3deg", "-2deg"];
const heroTones = [3, 2, 1];

export default async function HomePage() {
  const [featured, brands, audiences] = await Promise.all([
    listProducts({ limit: 8 }), // sin orden: primero los más vendidos y los que tienen stock
    listBrands(),
    countByAudience(),
  ]);
  const heroProducts = featured.slice(0, 3);
  const gridProducts = featured.slice(3, 8);

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Portada: mensaje a la izquierda y tres cajas reales del catálogo a la derecha. */}
      {/* overflow-x-clip: el abanico de las cajas nunca ensancha la página en pantallas angostas. */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 overflow-x-clip px-4 pt-14 pb-20 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-20 lg:pb-28">
        <div>
          <p className="mb-5 text-xs tracking-[0.2em] text-ink-soft uppercase">Ésman Parfum · Perfumes originales en Colombia</p>
          <h1 className="font-display text-5xl leading-[1.02] font-light tracking-tight text-balance sm:text-6xl xl:text-7xl">
            {/* Cada palabra sube desde detrás de su propia máscara, una tras otra. El relleno de la
                máscara deja sitio a las tildes y a las letras que bajan de la línea (p, í). */}
            {headline.split(" ").map((word, index) => (
              <Fragment key={index}>
                <span className="-my-[0.14em] inline-block overflow-hidden py-[0.14em] align-bottom">
                  <span className="inline-block motion-safe:animate-rise" style={{ animationDelay: `${index * 55}ms` }}>
                    {word}
                  </span>
                </span>{" "}
              </Fragment>
            ))}
          </h1>
          <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-ink-soft motion-safe:animate-unveil motion-safe:[animation-delay:var(--duration-fast)]">
            Perfumes originales con envío en Colombia. Elige tu fragancia, paga seguro con Wompi y recíbela en casa.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 motion-safe:animate-unveil motion-safe:[animation-delay:var(--duration-medium)]">
            <Link href="/catalogo" className={buttonStyles.primary}>
              Ver catálogo
            </Link>
            <Link href="/cotizar" className={buttonStyles.secondary}>
              Cotizar un perfume
            </Link>
          </div>
          <p className="mt-8 flex items-center gap-2 text-sm text-ink-soft motion-safe:animate-unveil motion-safe:[animation-delay:var(--duration-slow)]">
            <ShieldCheck size={20} weight="light" aria-hidden className="shrink-0 text-brand" />
            Pagos seguros con Wompi
          </p>
        </div>

        {heroProducts.length > 0 && (
          <div className="relative mx-auto flex w-full max-w-md justify-center bg-brand px-6 py-14 sm:py-20 lg:max-w-none">
            {/* Bruma: dos manchas de luz que se mueven muy despacio detrás de las cajas. Solo adorno. */}
            <div aria-hidden className="absolute inset-0 overflow-hidden">
              <span className="absolute -top-1/4 -left-1/4 size-4/5 bg-[radial-gradient(closest-side,var(--color-surface),transparent)] opacity-60 motion-safe:animate-mist" />
              <span
                style={{ "--mist-from": "10% -8%", "--mist-to": "-14% 12%", animationDuration: "23s" } as React.CSSProperties}
                className="absolute -right-1/4 -bottom-1/3 size-[90%] bg-[radial-gradient(closest-side,var(--color-brand-strong),transparent)] motion-safe:animate-mist"
              />
            </div>
            {heroProducts.map((product, index) => (
              // El contenedor se mueve con el scroll (abanico); el enlace, con la entrada y el cursor.
              <div
                key={product.id}
                style={{ "--fan": index - 1 } as React.CSSProperties}
                className="fan relative -mx-5 w-2/5 max-w-56 hover:z-10 sm:-mx-4"
              >
                <Link
                  href={`/producto/${product.slug}`}
                  prefetch
                  data-sheen
                  style={
                    {
                      "--tilt": tilts[index],
                      "--sheen-delay": `${1000 + index * 160}ms`, // el destello pasa cuando las cajas ya llegaron
                      animationDelay: `${index * 120}ms`,
                    } as React.CSSProperties
                  }
                  className="group block rotate-(--tilt) shadow-[0_18px_40px_-18px_oklch(0.22_0.02_136/0.7)] transition duration-(--duration-fast) ease-smooth-out hover:-translate-y-3 hover:rotate-0 motion-safe:animate-deal"
                >
                  <ViewTransition name={transitionName(product.id)} share="morph" default="none">
                    <ProductLabel product={product} tone={heroTones[index]} className="text-[10px] sm:text-sm" />
                  </ViewTransition>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cinta de marcas. La lista va dos veces para que el deslizamiento no tenga corte. */}
      {brands.length > 0 && (
        <section aria-label="Marcas" className="overflow-hidden border-y border-line py-5">
          <div className="flex w-max motion-safe:animate-marquee motion-safe:hover:[animation-play-state:paused] motion-safe:focus-within:[animation-play-state:paused] motion-reduce:w-auto motion-reduce:flex-wrap">
            {[0, 1].map((copy) => (
              <ul key={copy} aria-hidden={copy === 1} className={`flex shrink-0 ${copy === 1 ? "motion-reduce:hidden" : "motion-reduce:flex-wrap"}`}>
                {brands.map((brand) => (
                  <li key={brand} className="px-8 font-display text-xl tracking-[0.18em] whitespace-nowrap text-ink-soft uppercase">
                    <Link
                      href={brandPath(brand)}
                      tabIndex={copy === 1 ? -1 : undefined}
                      className="transition-colors duration-(--duration-quick) ease-smooth-out hover:text-ink"
                    >
                      {brand}
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </section>
      )}

      {/* Destacados: una caja grande y cuatro pequeñas. */}
      {gridProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
          <div className="reveal mb-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-4xl font-light tracking-tight sm:text-5xl">Destacados</h2>
            <Link href="/catalogo" className="py-2 text-sm underline decoration-line transition-colors duration-(--duration-quick) ease-smooth-out hover:decoration-ink">
              Ver todo el catálogo
            </Link>
          </div>
          <div className="group/grid grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {gridProducts.map((product, index) => (
              <div key={product.id} className={`reveal ${index === 0 ? "col-span-2 lg:row-span-2" : ""}`}>
                <ProductCard product={product} labelClassName={index === 0 ? "text-lg sm:text-2xl" : "text-xs sm:text-sm"} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Para quién: banda verde con enlaces grandes. Al señalar uno, los otros se atenúan. */}
      {audiences.length > 0 && (
        <section className="bg-brand text-on-brand">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
            <h2 className="reveal text-sm text-on-brand-soft">¿Para quién es el perfume?</h2>
            <ul className="group/list mt-8 flex flex-col">
              {audiences.map(({ audience }) => (
                <li key={audience} className="reveal border-t border-on-brand/20 last:border-b">
                  <Link
                    href={`/catalogo?publico=${encodeURIComponent(audience)}`}
                    className="group flex items-baseline justify-between gap-6 py-6 transition duration-(--duration-medium) ease-smooth-out group-has-[a:hover]/list:duration-(--duration-quick) [@media(hover:hover)]:group-has-[a:hover]/list:not-hover:opacity-35"
                  >
                    <span className="font-display text-5xl font-light tracking-tight transition-transform duration-(--duration-fast) ease-smooth-out group-hover:translate-x-4 sm:text-7xl">
                      {audienceNames[audience] ?? audience}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Cómo se compra: cuatro pasos en orden. */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
        <h2 className="reveal max-w-[18ch] font-display text-4xl font-light tracking-tight text-balance sm:text-5xl">
          Comprar es sencillo
        </h2>
        <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="reveal relative pt-5">
              {/* La línea de cada paso se dibuja al asomar, una detrás de otra. */}
              <span aria-hidden style={{ "--i": index } as React.CSSProperties} className="draw absolute inset-x-0 top-0 h-px bg-ink" />
              <span className="font-display text-3xl font-light text-ink-faint tabular-nums">{index + 1}</span>
              <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
