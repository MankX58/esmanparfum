import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { todayInBogota } from "@/lib/format";
import { SaleForm, type SaleProduct } from "../sale-form";

export const metadata = { title: "Registrar venta presencial" };

export default async function NewSalePage() {
  await requireAdmin();

  const [products, customers, [setting]] = await Promise.all([
    sql`
      select p.id, p.sku, p.brand, p.name, p.size_ml, p.list_price, s.stock
      from products p
      join product_stats s on s.product_id = p.id
      order by p.is_active desc, p.sku`,
    sql`select name from customers order by name`,
    sql`select value from settings where key = 'payment_methods'`,
  ]);

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader
        title="Registrar venta presencial"
        description="Una venta hecha en persona. Queda como entregada, con canal Presencial: cuenta en ventas, stock y ganancia, y entra a caja si ya la cobraste."
        back={{ href: "/admin/ventas", label: "Volver a ventas" }}
      />
      <SaleForm
        products={products as SaleProduct[]}
        customers={customers.map((row) => row.name as string)}
        paymentMethods={(setting?.value ?? []) as string[]}
        today={todayInBogota()}
      />
    </div>
  );
}
