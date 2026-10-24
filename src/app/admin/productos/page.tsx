import Link from "next/link";
import { buttonStyles } from "@/components/button";
import { FilterBar } from "@/components/filter-bar";
import { Glossary } from "@/components/glossary";
import { Fact, NoMatches, PageHeader } from "@/components/page-header";
import { ProductsTable, type ProductRow } from "@/components/products-table";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { queryText } from "@/lib/form";
import { formatCOP } from "@/lib/format";

export const metadata = { title: "Productos" };

export default async function ProductsPage({ searchParams }: PageProps<"/admin/productos">) {
  // El layout ya lo comprueba, pero cada página que lee datos se protege a sí misma.
  await requireAdmin();

  // Búsqueda y filtros llegan en la dirección: ?q=hawas&stock=AGOTADO&marca=Rasasi
  const params = await searchParams;
  const q = queryText(params.q);
  const stock = queryText(params.stock);
  const marca = queryText(params.marca);
  const like = `%${q}%`;
  const filtering = Boolean(q || stock || marca);

  // Stock, costo promedio, ganancia, margen e inventario los calcula la vista product_stats.
  const products = (await sql`
    select p.id, p.sku, p.name, p.brand, p.audience, p.size_ml, p.list_price, p.is_active,
           s.stock, s.avg_cost, s.unit_profit, s.margin, s.inventory_value, s.alert,
           (select count(*) from products g where coalesce(g.parent_id, g.id) = coalesce(p.parent_id, p.id))::int as sizes
    from products p
    join product_stats s on s.product_id = p.id
    where (${q} = '' or p.name ilike ${like} or p.brand ilike ${like} or p.sku ilike ${like})
      and (${stock} = '' or s.alert = ${stock})
      and (${marca} = '' or p.brand = ${marca})
    order by p.sku`) as ProductRow[];
  const brands = await sql`select distinct brand from products where brand is not null order by brand`;

  const inventoryValue = products.reduce((total, p) => total + p.inventory_value, 0);
  const inStock = products.filter((p) => p.stock > 0).length;

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader
        title="Productos"
        description="Tu catálogo. El precio lo pones tú; el stock, el costo y la ganancia los calcula el sistema con las compras y las ventas."
        action={
          <Link href="/admin/productos/nuevo" className={buttonStyles.primary}>
            Nuevo producto
          </Link>
        }
      >
        {(products.length > 0 || filtering) && (
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
            <Fact label="Productos">{products.length}</Fact>
            <Fact label="Con stock">{inStock}</Fact>
            <Fact label="Inventario a costo">{formatCOP(inventoryValue)}</Fact>
          </dl>
        )}
      </PageHeader>

      <FilterBar
        placeholder="Buscar por nombre, marca o SKU"
        values={{ q, stock, marca }}
        filters={[
          {
            name: "stock",
            label: "Todo el stock",
            options: [
              { value: "OK", label: "Con stock (OK)" },
              { value: "PEDIR", label: "Por pedir" },
              { value: "AGOTADO", label: "Agotado" },
            ],
          },
          {
            name: "marca",
            label: "Todas las marcas",
            options: brands.map((row) => ({ value: row.brand as string, label: row.brand as string })),
          },
        ]}
      />

      {products.length === 0 && filtering ? (
        <NoMatches what="producto" />
      ) : products.length === 0 ? (
        <div className="border border-line bg-surface px-6 py-14">
          <h2 className="font-medium">Todavía no hay productos</h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
            Crea el primero con el botón Nuevo producto. Si ya los tienes en el Excel, copia el archivo a la carpeta{" "}
            <code className="text-ink">data/</code> y ejecuta <code className="text-ink">npm run db:import</code>.
          </p>
        </div>
      ) : (
        <>
          <Glossary
            title="¿Qué significa cada columna?"
            terms={[
              ["Precio", "Lo que paga el cliente por una unidad. Lo defines tú al crear o editar el producto."],
              ["Costo promedio", "Lo que te ha costado cada unidad: todas las compras, con su flete, divididas entre las unidades compradas."],
              ["Ganancia por unidad", "Precio menos costo promedio: lo que te deja cada unidad que vendes."],
              ["Margen", "Qué parte del precio es ganancia. Con 30 %, de cada $100 que cobras te quedan $30."],
              ["Stock", "Unidades que tienes: las compradas menos las vendidas. En negativo, vendiste sin tener y debes comprarlas."],
              ["OK, Pedir, Agotado", "OK: hay unidades. Pedir: quedan tan pocas como el mínimo que pusiste en el producto. Agotado: no hay; se vende por encargo."],
              ["Inventario a costo", "Lo que pagaste por las unidades que tienes: stock por costo promedio."],
            ]}
          />
          <ProductsTable products={products} />
        </>
      )}
    </div>
  );
}
