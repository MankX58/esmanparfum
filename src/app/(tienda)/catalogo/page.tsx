import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles } from "@/components/button";
import { FilterBar } from "@/components/filter-bar";
import { BackToTop } from "@/components/store/back-to-top";
import { ProductCard } from "@/components/store/product-tile";
import { brandPath, listBrands, listProducts, sortOptions } from "@/lib/catalog";
import { queryText } from "@/lib/form";

type CatalogParams = Awaited<PageProps<"/catalogo">["searchParams"]>;

// El catálogo filtrado solo por una marca que existe es, para los buscadores, la página de
// esa marca ("Perfumes Lattafa"). Devuelve la marca en ese caso; con búsqueda u otro filtro, nada.
function brandPage(params: CatalogParams, brands: string[]) {
  const marca = queryText(params.marca);
  return !queryText(params.q) && !queryText(params.publico) && brands.includes(marca) ? marca : "";
}

export async function generateMetadata({ searchParams }: PageProps<"/catalogo">): Promise<Metadata> {
  // ponytail: la lista de marcas se consulta aquí y otra vez en la página. Es una consulta
  // corta; si llegara a pesar, envolver listBrands con cache() de React.
  const brand = brandPage(await searchParams, await listBrands());
  if (brand) {
    return {
      title: `Perfumes ${brand}`,
      description: `Perfumes ${brand} originales en Velare, con precio y envío en Colombia. Elige el tuyo y paga seguro con Wompi.`,
      alternates: { canonical: brandPath(brand) },
    };
  }
  return {
    title: "Catálogo de perfumes",
    description: "Todos los perfumes de Velare, para hombre, mujer y unisex. Busca por nombre o marca y pide el tuyo con envío en Colombia.",
    // Con búsqueda u otros filtros la página sigue siendo el catálogo para los buscadores.
    alternates: { canonical: "/catalogo" },
  };
}

const audiences = ["Hombre", "Mujer", "Unisex"];

export default async function CatalogPage({ searchParams }: PageProps<"/catalogo">) {
  // Búsqueda, filtros y orden llegan en la dirección: ?q=hawas&marca=Rasasi&orden=precio-asc
  const params = await searchParams;
  const q = queryText(params.q);
  const marca = queryText(params.marca);
  const publico = queryText(params.publico);
  const orden = queryText(params.orden);

  const [products, brands] = await Promise.all([listProducts({ q, marca, publico, orden }), listBrands()]);
  const filtering = Boolean(q || marca || publico);
  const brand = brandPage(params, brands);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-12 pb-24 sm:px-8">
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4 motion-safe:animate-unveil">
        <h1 className="font-display text-5xl font-light tracking-tight text-balance sm:text-6xl">
          {brand ? `Perfumes ${brand}` : "Catálogo"}
        </h1>
        <p className="text-sm text-ink-soft tabular-nums">
          {products.length} {products.length === 1 ? "perfume" : "perfumes"}
        </p>
      </div>

      <FilterBar
        placeholder="Buscar por nombre o marca"
        values={{ q, marca, publico, orden }}
        filters={[
          { name: "marca", label: "Todas las marcas", options: brands.map((brand) => ({ value: brand, label: brand })) },
          { name: "publico", label: "Para todos", options: audiences.map((audience) => ({ value: audience, label: audience })) },
          { name: "orden", label: "Más vendidos primero", options: sortOptions },
        ]}
      />

      {products.length === 0 ? (
        <div className="border border-line bg-surface px-6 py-16">
          <h2 className="font-display text-2xl">{filtering ? "Ningún perfume coincide" : "Pronto habrá perfumes aquí"}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {filtering
              ? "Prueba con otra palabra o quita algún filtro con el botón Limpiar."
              : "Estamos preparando el catálogo. Vuelve en unos días."}
          </p>
        </div>
      ) : (
        // key: al cambiar los filtros la rejilla vuelve a entrar.
        <div
          key={`${q}|${marca}|${publico}|${orden}`}
          className="group/grid grid grid-cols-2 gap-x-5 gap-y-10 motion-safe:animate-settle md:grid-cols-3 xl:grid-cols-4"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} labelClassName="text-[11px] sm:text-sm" />
          ))}
        </div>
      )}

      {/* Si lo que busca no está, puede pedir el precio. La búsqueda viaja para no escribirla dos veces. */}
      <aside className="mt-20 flex flex-wrap items-center justify-between gap-6 border-t border-line pt-10">
        <div>
          <h2 className="font-display text-3xl font-light tracking-tight">¿No encuentras tu perfume?</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">Dinos cuál buscas y te respondemos con el precio.</p>
        </div>
        <Link href={q ? `/cotizar?perfume=${encodeURIComponent(q)}` : "/cotizar"} className={buttonStyles.secondary}>
          Cotizar un perfume
        </Link>
      </aside>
      <BackToTop />
    </main>
  );
}
