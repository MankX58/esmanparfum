import Link from "next/link";
import { linkStyles } from "@/components/button";
import { FilterBar } from "@/components/filter-bar";
import { Glossary } from "@/components/glossary";
import { Fact, NoMatches, PageHeader } from "@/components/page-header";
import { cell, fromLg, fromMd, numberCell, row, th } from "@/components/products-table";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getFinanceSettings } from "@/lib/finance";
import { queryText } from "@/lib/form";
import { formatCOP, formatDate, todayInBogota, whatsappLink } from "@/lib/format";

export const metadata = { title: "Clientes" };

type CustomerRow = {
  id: number;
  name: string;
  phone: string | null;
  source: string | null;
  notes: string | null;
  purchases: number;
  total: number;
  last_purchase: string | null;
  days_since: number | null;
};

// Mismos estados de la hoja "Clientes" del Excel.
const states = {
  Activo: "bg-ok-soft text-ok",
  Reactivar: "bg-warn-soft text-warn",
  "Sin compras": "bg-mist text-ink-soft",
};

export default async function CustomersPage({ searchParams }: PageProps<"/admin/clientes">) {
  await requireAdmin();

  const params = await searchParams;
  const q = queryText(params.q);
  const estado = queryText(params.estado);
  const like = `%${q}%`;

  // El historial se calcula con las ventas: nadie lo escribe a mano.
  const [{ reactivationDays }, rows] = await Promise.all([
    getFinanceSettings(),
    sql`
      select c.id, c.name, c.phone, c.source, c.notes,
             count(distinct o.id)::int as purchases,
             coalesce(sum(oi.total), 0)::int as total,
             max(o.ordered_on)::text as last_purchase,
             (${todayInBogota()}::date - max(o.ordered_on))::int as days_since
      from customers c
      left join orders o on o.customer_id = c.id and o.status not in ('pending', 'payment_reported', 'cancelled')
      left join order_items oi on oi.order_id = o.id
      where ${q} = '' or c.name ilike ${like} or c.phone ilike ${like}
      group by c.id
      order by max(o.ordered_on) desc nulls last, c.name`,
  ]);

  // "Reactivar": compró alguna vez, pero hace más días de los configurados en Ajustes.
  const stateOf = (customer: CustomerRow): keyof typeof states =>
    customer.days_since === null ? "Sin compras" : customer.days_since > reactivationDays ? "Reactivar" : "Activo";

  const all = rows as CustomerRow[];
  const customers = estado ? all.filter((customer) => stateOf(customer) === estado) : all;
  const buyers = all.filter((customer) => customer.purchases > 0).length;

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader
        title="Clientes"
        description="Quién te ha comprado, cuánto y cuándo fue la última vez. Toca un nombre para ver sus compras."
      >
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
          <Fact label="Clientes">{all.length}</Fact>
          <Fact label="Han comprado">{buyers}</Fact>
          <Fact label="Por reactivar">{all.filter((customer) => stateOf(customer) === "Reactivar").length}</Fact>
        </dl>
      </PageHeader>

      <FilterBar
        placeholder="Buscar por nombre o teléfono"
        values={{ q, estado }}
        filters={[
          {
            name: "estado",
            label: "Todos los estados",
            options: Object.keys(states).map((state) => ({ value: state, label: state })),
          },
        ]}
      />

      <Glossary
        terms={[
          ["Compras", "Número de pedidos pagados de ese cliente."],
          ["Total comprado", "Suma de lo que ha pagado en esos pedidos."],
          ["Última compra", "Fecha de su pedido más reciente y cuántos días han pasado."],
          ["Activo", `Compró hace ${reactivationDays} días o menos.`],
          ["Reactivar", `Lleva más de ${reactivationDays} días sin comprar: buen momento para escribirle. Los días se cambian en Ajustes.`],
          ["Sin compras", "Está registrado, pero no tiene pedidos pagados."],
        ]}
      />

      {customers.length === 0 && (q || estado) ? (
        <NoMatches what="cliente" />
      ) : customers.length === 0 ? (
        <div className="border border-line bg-surface px-6 py-14">
          <h2 className="font-medium">Todavía no hay clientes</h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
            Cada persona que haga un pedido en la tienda quedará aquí, con lo que ha comprado y cuándo fue la última vez.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className={th}>Cliente</th>
                <th className={`${th} ${fromLg}`}>Contacto</th>
                <th className={`${th} text-right`}>Compras</th>
                <th className={`${th} text-right`}>Total comprado</th>
                <th className={`${th} ${fromMd}`}>Última compra</th>
                <th className={th}>Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {customers.map((customer) => {
                const state = stateOf(customer);
                return (
                  <tr key={customer.id} className={row}>
                    <td className={`${cell} py-4`}>
                      {customer.purchases > 0 ? (
                        <Link
                          href={`/admin/ventas?cliente=${customer.id}`}
                          className="font-medium py-2 underline decoration-transparent transition-colors duration-(--duration-quick) ease-smooth-out hover:decoration-ink"
                        >
                          {customer.name}
                        </Link>
                      ) : (
                        <p className="font-medium">{customer.name}</p>
                      )}
                      <p className="mt-1 text-xs text-ink-faint">
                        {[customer.source, customer.notes].filter(Boolean).join(", ") || "Sin datos"}
                      </p>
                    </td>
                    <td className={`${cell} ${fromLg} py-4`}>
                      {customer.phone ? (
                        <a
                          href={whatsappLink(customer.phone, `Hola ${customer.name}, te escribimos de Ésman Parfum.`)}
                          target="_blank"
                          rel="noreferrer"
                          className={`whitespace-nowrap tabular-nums ${linkStyles.default}`}
                        >
                          {customer.phone}
                        </a>
                      ) : (
                        <span className="text-ink-faint">Sin teléfono</span>
                      )}
                    </td>
                    <td className={numberCell}>{customer.purchases}</td>
                    <td className={numberCell}>{formatCOP(customer.total)}</td>
                    <td className={`${cell} ${fromMd} py-4 whitespace-nowrap text-ink-soft tabular-nums`}>
                      {customer.last_purchase ? (
                        <>
                          {formatDate(customer.last_purchase)}
                          <span className="mt-1 block text-xs text-ink-faint">
                            {customer.days_since === 0 ? "hoy" : `hace ${customer.days_since} ${customer.days_since === 1 ? "día" : "días"}`}
                          </span>
                        </>
                      ) : (
                        "Nunca"
                      )}
                    </td>
                    <td className={`${cell} py-4`}>
                      <span className={`inline-block px-2 py-1 text-[11px] leading-none font-medium tracking-[0.08em] whitespace-nowrap uppercase ${states[state]}`}>
                        {state}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
