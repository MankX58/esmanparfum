import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getFinanceSettings } from "@/lib/finance";
import { PriceCalculator, type PricedProduct } from "./price-calculator";

export const metadata = { title: "Precios" };

export default async function PricingPage() {
  await requireAdmin();

  const [settings, products] = await Promise.all([
    getFinanceSettings(),
    sql`
      select p.id, p.sku, p.brand, p.name, p.size_ml, s.avg_cost, p.list_price
      from products p
      join product_stats s on s.product_id = p.id
      order by p.sku`,
  ]);

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader
        title="Calculadora de precios"
        description="Te dice a cuánto vender un perfume para ganar el margen que quieres. No cambia nada: el precio lo pones después en el producto."
      />
      <PriceCalculator
        products={products as PricedProduct[]}
        defaults={{ margin: settings.targetMargin, fee: settings.paymentFee, vat: settings.vat }}
      />
    </div>
  );
}
