import Link from "next/link";
import { buttonStyles } from "@/components/button";
import { FilterBar } from "@/components/filter-bar";
import { Glossary } from "@/components/glossary";
import { Fact, NoMatches, PageHeader } from "@/components/page-header";
import { cell, fromLg, fromMd, numberCell, row, th } from "@/components/products-table";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { queryText } from "@/lib/form";
import { formatCOP, formatDate, formatPercent } from "@/lib/format";

export const metadata = { title: "Ventas" };

type SaleRow = {
  id: number;
  ordered_on: string;
  paid: boolean;
  channel: string | null;
  payment_method: string | null;
  customer: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number; // descuento del código promocional en esta línea
  promo_code: string | null;
  promo_percent: number | null;
  transfer_percent: number | null;
  total: number; // ya con el descuento
  cost: number;
  profit: number;
};

export default async function SalesPage({ searchParams }: PageProps<"/admin/ventas">) {
  await requireAdmin();

  const params = await searchParams;
  const q = queryText(params.q);
  const cobro = queryText(params.cobro); // "cobrado" | "por-cobrar" | ""
  // ?cliente=9 llega desde la lista de clientes: muestra solo lo que ha comprado esa persona.
  const clienteId = Number(queryText(params.cliente));
  const cliente = Number.isInteger(clienteId) && clienteId > 0 && clienteId < 2_000_000_000 ? clienteId : 0;
  const like = `%${q}%`;

  // Precio y costo salen de la línea del pedido: son los del día de la venta,
  // no los actuales del producto.
  const sales = (await sql`
    select oi.id, o.ordered_on::text as ordered_on, o.paid_on is not null as paid, o.channel, o.payment_method,
           c.name as customer, oi.product_name, oi.quantity, oi.unit_price, oi.discount, o.promo_code, o.promo_percent, o.transfer_percent, oi.total,
           oi.quantity * oi.unit_cost as cost,
           oi.total - oi.quantity * oi.unit_cost as profit
    from order_items oi
    join orders o on o.id = oi.order_id
    left join customers c on c.id = o.customer_id
    where o.status not in ('pending', 'payment_reported', 'cancelled')
      and (${q} = '' or oi.product_name ilike ${like} or c.name ilike ${like} or o.promo_code ilike ${like})
      and (${cobro} = '' or (o.paid_on is not null) = (${cobro} = 'cobrado'))
      and (${cliente} = 0 or o.customer_id = ${cliente})
    order by o.ordered_on desc, oi.id desc`) as SaleRow[];

  const sold = sales.reduce((sum, sale) => sum + sale.total, 0);
  const profit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  const receivable = sales.filter((sale) => !sale.paid).reduce((sum, sale) => sum + sale.total, 0);

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader
        title={cliente && sales[0]?.customer ? `Compras de ${sales[0].customer}` : "Ventas"}
        description="Cada perfume vendido, con lo que cobraste, lo que te costó y lo que ganaste. Los pedidos de la tienda aparecen aquí cuando se confirma su pago; las ventas en persona se registran con el botón."
        back={cliente ? { href: "/admin/clientes", label: "Volver a clientes" } : undefined}
        action={
          <Link href="/admin/ventas/nueva" className={buttonStyles.primary}>
            Registrar venta presencial
          </Link>
        }
      >
        {sales.length > 0 && (
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
            <Fact label="Ventas">{sales.length}</Fact>
            <Fact label="Vendido">{formatCOP(sold)}</Fact>
            <Fact label="Ganancia">{formatCOP(profit)}</Fact>
            <Fact label="Por cobrar">{formatCOP(receivable)}</Fact>
          </dl>
        )}
      </PageHeader>

      <FilterBar
        placeholder="Buscar por producto, cliente o código"
        values={{ q, cobro, cliente: cliente ? String(cliente) : "" }}
        filters={[
          {
            name: "cobro",
            label: "Cobradas y por cobrar",
            options: [
              { value: "cobrado", label: "Cobradas" },
              { value: "por-cobrar", label: "Por cobrar" },
            ],
          },
        ]}
      />

      {sales.length > 0 && (
        <Glossary
          title="¿Qué significa cada columna?"
          terms={[
            ["Total", "Lo que cobraste por esa línea: cantidad por precio, menos los descuentos (código promocional o pago por transferencia)."],
            ["Costo", "Lo que te costaron esas unidades: cantidad por el costo promedio del día en que confirmaste el pago."],
            ["Ganancia", "Total menos costo."],
            ["Margen", "Ganancia dividida entre el total: qué parte de lo cobrado te quedó."],
            ["Cobro", "Cobrado: el dinero ya entró a caja. Por cobrar: vendiste fiado y aún no te pagan; se marca como cobrado en Caja."],
          ]}
        />
      )}

      {sales.length === 0 && (q || cobro || cliente) ? (
        <NoMatches what="venta" />
      ) : sales.length === 0 ? (
        <div className="border border-line bg-surface px-6 py-14">
          <h2 className="font-medium">Todavía no hay ventas</h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
            Aquí aparecerá cada venta con su precio, lo que te costó el producto y lo que ganaste.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className={th}>Fecha</th>
                <th className={th}>Producto</th>
                <th className={`${th} ${fromLg}`}>Canal y pago</th>
                <th className={`${th} ${fromMd} text-right`}>Cant.</th>
                <th className={`${th} text-right`}>Total</th>
                <th className={`${th} ${fromMd} text-right`}>Costo</th>
                <th className={`${th} text-right`}>Ganancia</th>
                <th className={`${th} ${fromLg} text-right`}>Margen</th>
                <th className={`${th} ${fromMd}`}>Cobro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sales.map((sale) => (
                <tr key={sale.id} className={row}>
                  <td className={`${cell} py-4 whitespace-nowrap text-ink-soft tabular-nums`}>
                    {formatDate(sale.ordered_on)}
                  </td>
                  <td className={`${cell} py-4`}>
                    <p className="font-medium">{sale.product_name}</p>
                    <p className="mt-1 text-xs text-ink-faint">{sale.customer ?? "Sin cliente"}</p>
                    {sale.discount > 0 && (
                      <p className="mt-1 text-xs text-ok">
                        Descuento −{formatCOP(sale.discount)}:{" "}
                        {[
                          sale.promo_code && `código ${sale.promo_code} (${sale.promo_percent}%)`,
                          sale.transfer_percent && `transferencia (${sale.transfer_percent}%)`,
                        ]
                          .filter(Boolean)
                          .join(" + ")}
                      </p>
                    )}
                  </td>
                  <td className={`${cell} ${fromLg} py-4 text-ink-soft`}>
                    {[sale.channel, sale.payment_method].filter(Boolean).join(", ") || "Sin datos"}
                  </td>
                  <td className={`${numberCell} ${fromMd}`}>{sale.quantity}</td>
                  <td className={numberCell}>{formatCOP(sale.total)}</td>
                  <td className={`${numberCell} ${fromMd} text-ink-soft`}>{formatCOP(sale.cost)}</td>
                  <td className={`${numberCell} font-medium ${sale.profit < 0 ? "text-danger" : ""}`}>
                    {formatCOP(sale.profit)}
                  </td>
                  <td className={`${numberCell} ${fromLg} text-ink-soft`}>
                    {formatPercent(sale.total > 0 ? sale.profit / sale.total : 0)}
                  </td>
                  <td className={`${cell} ${fromMd} py-4`}>
                    <span
                      className={`inline-block px-2 py-1 text-[11px] leading-none font-medium tracking-[0.08em] whitespace-nowrap uppercase ${
                        sale.paid ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"
                      }`}
                    >
                      {sale.paid ? "Cobrado" : "Por cobrar"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
