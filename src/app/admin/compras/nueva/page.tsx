import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { todayInBogota } from "@/lib/format";
import { PurchaseForm, type PurchaseProduct } from "../purchase-form";

export const metadata = { title: "Registrar compra" };

export default async function NewPurchasePage({ searchParams }: PageProps<"/admin/compras/nueva">) {
  await requireAdmin();
  const { producto } = await searchParams;

  // Además del stock y el costo promedio, el formulario necesita cuántas unidades han
  // entrado y cuánto costaron, para mostrar el nuevo promedio antes de guardar.
  const [products, suppliers, [setting]] = await Promise.all([
    sql`
      select p.id, p.sku, p.brand, p.name, p.size_ml, s.stock, s.avg_cost,
             p.initial_stock + s.units_purchased as units_in,
             (p.initial_stock * p.initial_unit_cost
               + coalesce((select sum(total_cost) from purchases where product_id = p.id), 0))::int as cost_basis
      from products p
      join product_stats s on s.product_id = p.id
      order by p.sku`,
    sql`select supplier from purchases where supplier is not null group by supplier order by max(purchased_on) desc`,
    sql`select value from settings where key = 'payment_methods'`,
  ]);

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader title="Registrar compra" back={{ href: "/admin/compras", label: "Volver a compras" }} />
      <PurchaseForm
        products={products as PurchaseProduct[]}
        suppliers={suppliers.map((row) => row.supplier as string)}
        paymentMethods={(setting?.value ?? []) as string[]}
        today={todayInBogota()}
        defaultProductId={typeof producto === "string" ? producto : undefined}
      />
    </div>
  );
}
