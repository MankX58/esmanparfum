import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonStyles } from "@/components/button";
import { ConfirmButton } from "@/components/confirm-button";
import { PageHeader } from "@/components/page-header";
import { StockBadge, type StockAlert } from "@/components/products-table";
import { SummaryLine } from "@/components/summary-line";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatCOP, formatPercent } from "@/lib/format";
import { deleteProduct, suggestSku } from "../actions";
import { ProductForm, type Product } from "../product-form";
import { ProductImages } from "../product-images";
import { productOption } from "@/lib/product-option";
import { ProductSizes, type SizeRow } from "../product-sizes";

export const metadata = { title: "Editar producto" };

type Stats = {
  units_purchased: number;
  units_sold: number;
  stock: number;
  avg_cost: number;
  unit_profit: number;
  margin: number;
  markup: number;
  inventory_value: number;
  alert: StockAlert;
  total_sales: number;
  gross_profit: number;
};

export default async function EditProductPage({ params }: PageProps<"/admin/productos/[id]">) {
  await requireAdmin();

  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const [product] = (await sql`
    select p.id, p.sku, p.name, p.brand, p.audience, p.size_ml, p.category, p.description, p.notes,
           p.list_price, p.initial_stock, p.initial_unit_cost, p.reorder_point, p.is_active, p.images,
           s.units_purchased, s.units_sold, s.stock, s.avg_cost, s.unit_profit, s.margin, s.markup,
           s.inventory_value, s.alert, s.total_sales, s.gross_profit
    from products p
    join product_stats s on s.product_id = p.id
    where p.id = ${id}`) as (Product & Stats & { images: string[] })[];
  if (!product) notFound();

  // Todos los tamaños del mismo perfume, incluido este.
  const sizes = (await sql`
    select p.id, p.sku, p.size_ml, p.list_price, p.is_active, s.stock
    from products p
    join product_stats s on s.product_id = p.id
    where coalesce(p.parent_id, p.id) = (select coalesce(parent_id, id) from products where id = ${id})
    order by p.size_ml asc nulls last, p.id asc`) as SizeRow[];
  const suggestedSku = await suggestSku();
  // Los demás productos (fuera de este perfume), para unirlos como un tamaño más.
  const others = (await sql`
    select id, sku, brand, name, size_ml from products
    where coalesce(parent_id, id) <> (select coalesce(parent_id, id) from products where id = ${id})
    order by brand nulls last, name, size_ml`) as { id: number; sku: string; brand: string | null; name: string; size_ml: number | null }[];
  const candidates = others.map((other) => productOption(other));

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader title={product.name} back={{ href: "/admin/productos", label: "Volver a productos" }} />

      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <ProductForm product={product} avgCost={product.avg_cost} />

        {/* Lo que el Excel tenía en las columnas grises: nadie lo escribe, sale de compras y ventas. */}
        <aside className="border border-line bg-surface p-6 lg:sticky lg:top-8">
          <h2 className="font-display text-xl">Calculado por el sistema</h2>
          <p className="mt-2 text-xs leading-relaxed text-ink-faint">
            Nadie escribe estos números: salen de las compras y ventas registradas y se actualizan solos.
          </p>

          <dl className="mt-6 flex flex-col gap-4 text-sm">
            <SummaryLine label="Stock actual" hint="Stock inicial, más lo comprado, menos lo vendido.">
              <span className="mr-3">{product.stock}</span>
              <StockBadge alert={product.alert} />
            </SummaryLine>
            <SummaryLine label="Unidades compradas" hint="Suma de las compras registradas.">
              {product.units_purchased}
            </SummaryLine>
            <SummaryLine label="Unidades vendidas" hint="En pedidos con el pago confirmado.">
              {product.units_sold}
            </SummaryLine>
            <div className="border-t border-line" />
            <SummaryLine label="Costo promedio" hint="Lo que te ha costado cada unidad, con flete.">
              {formatCOP(product.avg_cost)}
            </SummaryLine>
            <SummaryLine label="Ganancia por unidad" hint="Precio de venta menos costo promedio.">
              {formatCOP(product.unit_profit)}
            </SummaryLine>
            <SummaryLine label="Margen" hint="Ganancia por unidad dividida entre el precio.">
              {formatPercent(product.margin)}
            </SummaryLine>
            <SummaryLine label="Ganancia sobre el costo" hint="Ganancia por unidad dividida entre el costo.">
              {formatPercent(product.markup)}
            </SummaryLine>
            <div className="border-t border-line" />
            <SummaryLine label="Inventario a costo" hint="Stock por costo promedio.">
              {formatCOP(product.inventory_value)}
            </SummaryLine>
            <SummaryLine label="Vendido hasta hoy" hint="Lo cobrado por todas sus ventas.">
              {formatCOP(product.total_sales)}
            </SummaryLine>
            <SummaryLine label="Ganancia hasta hoy" hint="Vendido menos el costo de las unidades vendidas.">
              {formatCOP(product.gross_profit)}
            </SummaryLine>
          </dl>

          <Link href={`/admin/compras/nueva?producto=${product.id}`} className={`mt-8 w-full ${buttonStyles.secondary}`}>
            Registrar una compra
          </Link>
        </aside>
      </div>

      <div className="mt-16 border-t border-line pt-10">
        <ProductSizes productId={product.id} sizes={sizes} suggestedSku={suggestedSku} candidates={candidates} />
      </div>

      <div className="mt-16 border-t border-line pt-10">
        <ProductImages productId={product.id} images={product.images} />
      </div>

      <div className="mt-16 border-t border-line pt-6">
        <ConfirmButton
          action={deleteProduct.bind(null, product.id)}
          label="Eliminar este producto"
          question="¿Eliminar el producto? No se puede deshacer."
          successMessage="Producto eliminado"
          redirectTo="/admin/productos"
        />
      </div>
    </div>
  );
}
