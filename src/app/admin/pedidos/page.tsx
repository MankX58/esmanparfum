import Link from "next/link";
import { FilterBar } from "@/components/filter-bar";
import { Glossary } from "@/components/glossary";
import { Fact, NoMatches, PageHeader } from "@/components/page-header";
import { cell, fromMd, numberCell, row, th } from "@/components/products-table";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { queryText } from "@/lib/form";
import { formatCOP, formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-progress";
import { isToShip, type OrderStatus } from "@/lib/orders";

export const metadata = { title: "Pedidos" };

type OrderRow = {
  id: number;
  code: string;
  ordered_on: string;
  status: OrderStatus;
  customer: string | null;
  channel: string | null;
  total: number;
};

// Filtro de estado. "Por pagar" no está: esos pedidos no aparecen en el panel.
const statusOptions = [
  { value: "payment_reported", label: "Pago en revisión" },
  { value: "payment_confirmed", label: "Preparando pedido" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
];

// Lo que le toca hacer al dueño en cada estado; vacío si no hay nada que hacer.
function todo(status: OrderStatus) {
  if (status === "payment_reported") return "Te toca: confirmar el pago";
  if (isToShip(status)) return "Te toca: enviarlo";
  if (status === "shipped") return "Falta: marcarlo como entregado";
  return "";
}

export default async function OrdersPage({ searchParams }: PageProps<"/admin/pedidos">) {
  await requireAdmin();

  const params = await searchParams;
  const q = queryText(params.q);
  const estado = queryText(params.estado);
  const like = `%${q}%`;

  const orders = (await sql`
    select o.id, o.code, o.ordered_on::text as ordered_on, o.status, o.channel,
           coalesce(o.shipping_name, c.name) as customer,
           ((select coalesce(sum(total), 0) from order_items where order_id = o.id) + o.shipping_fee)::int as total
    from orders o
    left join customers c on c.id = o.customer_id
    where (${q} = '' or o.code ilike ${like} or c.name ilike ${like} or o.shipping_name ilike ${like})
      and (${estado} = '' or o.status = ${estado} or (${estado} = 'payment_confirmed' and o.status = 'preparing'))
      -- Un pedido de la tienda no aparece hasta que el cliente avisa que pagó (ni si lo
      -- canceló antes de avisar). Buscándolo por código o nombre sí sale, por si hace falta.
      and (${q} <> '' or o.user_id is null or o.payment_reported_at is not null
           or o.status not in ('pending', 'cancelled'))
    order by o.id desc`) as OrderRow[];

  // Lo que pide atención: pagos reportados que hay que revisar en el banco.
  const [{ to_verify, to_ship }] = await sql`
    select count(*) filter (where status = 'payment_reported')::int as to_verify,
           count(*) filter (where status in ('payment_confirmed', 'preparing'))::int as to_ship
    from orders`;

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader
        title="Pedidos"
        description="Los pedidos de la tienda aparecen aquí solos cuando Wompi aprueba el pago, ya en Preparando pedido: no tienes que confirmar nada. Abre uno y pulsa el botón de Qué sigue para marcarlo como enviado o como entregado."
      >
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
          <Fact label="Pedidos">{orders.length}</Fact>
          <Fact label="Pagos por confirmar">{to_verify}</Fact>
          <Fact label="Por enviar">{to_ship}</Fact>
        </dl>
      </PageHeader>

      <FilterBar
        placeholder="Buscar por código o cliente"
        values={{ q, estado }}
        filters={[
          {
            name: "estado",
            label: "Todos los estados",
            options: statusOptions,
          },
        ]}
      />

      <Glossary
        title="¿Qué significa cada estado?"
        terms={[
          ["Preparando pedido", "Wompi aprobó el pago y el pedido llegó aquí solo, sin que tengas que confirmar nada. Ya cuenta como venta, descuenta stock y entra a caja. Te toca alistarlo y enviarlo."],
          ["Pago en revisión", "Solo pedidos de antes de Wompi: el cliente avisó una transferencia. Te toca revisar el banco y confirmar el pago."],
          ["Enviado", "Ya lo despachaste. Si registraste la guía, el cliente la ve. Tú o el cliente lo marcan como entregado."],
          ["Entregado", "El cliente lo recibió. Pedido cerrado."],
          ["Cancelado", "No se hizo. No cuenta en ventas, stock ni caja."],
          ["¿Y los que no han pagado?", "Un pedido que aún no se paga en Wompi no aparece en esta lista. Si necesitas verlo, búscalo por su código o por el nombre del cliente."],
        ]}
      />

      {orders.length === 0 && (q || estado) ? (
        <NoMatches what="pedido" />
      ) : orders.length === 0 ? (
        <div className="border border-line bg-surface px-6 py-14">
          <h2 className="font-medium">Todavía no hay pedidos</h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
            Cuando alguien haga un pedido en la tienda y avise que pagó, aparecerá aquí para que confirmes su pago.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className={th}>Pedido</th>
                <th className={`${th} ${fromMd}`}>Fecha</th>
                <th className={th}>Cliente</th>
                <th className={`${th} text-right`}>Total</th>
                <th className={th}>Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((order) => (
                <tr key={order.id} className={row}>
                  <td className={`${cell} py-4`}>
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="font-medium tabular-nums py-2 underline decoration-transparent transition-colors duration-(--duration-quick) ease-smooth-out hover:decoration-ink"
                    >
                      {order.code}
                    </Link>
                    <p className="mt-1 text-xs text-ink-faint">{order.channel ?? "Sin canal"}</p>
                  </td>
                  <td className={`${cell} ${fromMd} py-4 whitespace-nowrap text-ink-soft tabular-nums`}>
                    {formatDate(order.ordered_on)}
                  </td>
                  <td className={`${cell} py-4`}>{order.customer ?? "Sin cliente"}</td>
                  <td className={numberCell}>{formatCOP(order.total)}</td>
                  <td className={`${cell} py-4`}>
                    <OrderStatusBadge status={order.status} audience="admin" />
                    {todo(order.status) && <p className="mt-1.5 text-xs text-ink-soft">{todo(order.status)}</p>}
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
