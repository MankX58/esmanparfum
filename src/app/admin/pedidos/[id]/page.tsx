import { buttonStyles } from "@/components/button";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/auth";
import { formatCOP, formatDate } from "@/lib/format";
import { OrderProgress, statusHints } from "@/components/order-progress";
import { ActionButton } from "@/components/action-button";
import { ConfirmButton } from "@/components/confirm-button";
import { getOrder, getOrderItems, isToShip } from "@/lib/orders";
import { cancelOrder, deleteOrder, deliverOrder, syncWompiPayment } from "../actions";
import { ConfirmPayment, DetailsForm, ShipForm } from "../order-actions";

export const metadata = { title: "Pedido" };

const wompiStatusLabels: Record<string, string> = {
  APPROVED: "Aprobado",
  DECLINED: "Rechazado",
  VOIDED: "Anulado",
  ERROR: "Error",
  PENDING: "En proceso",
};

const dateTime = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" });

export default async function AdminOrderPage({ params }: PageProps<"/admin/pedidos/[id]">) {
  await requireAdmin();

  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const order = await getOrder(id);
  if (!order) notFound();

  const items = await getOrderItems(id);
  const total = order.items_total + order.shipping_fee;
  const awaitingPayment = order.status === "pending" || order.status === "payment_reported";
  // Transferencia por confirmar: con aviso del cliente o sin él (si ya viste el dinero en el banco).
  const awaitingTransfer =
    order.status === "payment_reported" || (order.status === "pending" && order.payment_method === "Transferencia");
  const toShip = isToShip(order.status);
  const closed = order.status === "delivered" || order.status === "cancelled";

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader title={order.code} back={{ href: "/admin/pedidos", label: "Volver a pedidos" }}>
        <p className="mt-3 text-sm text-ink-soft">Pedido del {formatDate(order.ordered_on)}</p>
      </PageHeader>

      <div className="mb-8 border-y border-line py-8">
        <OrderProgress status={order.status} audience="admin" />
      </div>

      {/* Qué sigue: la única acción que mueve el pedido al paso siguiente. */}
      {!closed && (
        <section className="mb-12 border border-line bg-surface p-6 sm:p-8">
          <h2 className="font-display text-2xl">Qué sigue</h2>
          <p className="mt-2 mb-6 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
            {statusHints.admin[order.status]}
            {awaitingTransfer &&
              ` Paga por transferencia: deben llegar ${formatCOP(total)}. Confirma solo si ves el dinero en tu banco: una captura de pantalla no es prueba.`}
          </p>
          {order.payment_reference && awaitingPayment && (
            <p className="mb-6 text-sm">
              <span className="text-ink-soft">El cliente escribió al avisar: </span>
              {order.payment_reference}
            </p>
          )}
          {awaitingTransfer && <ConfirmPayment orderId={order.id} />}
          {/* Por si el aviso de Wompi no llegó: se le pregunta de nuevo a Wompi, nunca se confirma a mano. */}
          {order.status === "pending" && !awaitingTransfer && order.wompi_transaction_id && (
            <ActionButton
              action={syncWompiPayment.bind(null, order.id)}
              label="Consultar el pago en Wompi"
              successMessage="Pago aprobado: el pedido pasó a Preparando pedido"
              className={buttonStyles.secondary}
            />
          )}
          {toShip && <ShipForm orderId={order.id} tracking={order.tracking} />}
          {order.status === "shipped" && (
            <ActionButton action={deliverOrder.bind(null, order.id)} label="Marcar como entregado" successMessage="Pedido entregado" />
          )}
        </section>
      )}

      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="font-display text-xl">Productos</h2>
            <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
              {items.map((item) => (
                <li key={item.product_name} className="flex justify-between gap-4 py-3">
                  <span>
                    {item.quantity} × {item.product_name}
                    <span className="ml-2 text-ink-faint tabular-nums">{formatCOP(item.unit_price)} c/u</span>
                  </span>
                  <span className="shrink-0 tabular-nums">{formatCOP(item.quantity * item.unit_price)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 flex flex-col gap-2 text-sm">
              {order.promo_code && (
                <div className="flex justify-between gap-4 text-ok">
                  <dt>
                    Código promocional {order.promo_code} ({order.promo_percent}%)
                  </dt>
                  <dd className="tabular-nums">−{formatCOP(order.promo_discount)}</dd>
                </div>
              )}
              {order.transfer_percent && (
                <div className="flex justify-between gap-4 text-ok">
                  <dt>Descuento por transferencia ({order.transfer_percent}%)</dt>
                  <dd className="tabular-nums">−{formatCOP(order.transfer_discount)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Envío</dt>
                <dd className="tabular-nums">{formatCOP(order.shipping_fee)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-base font-medium">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatCOP(total)}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="font-display text-xl">Cliente y envío</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {order.shipping_name ?? order.customer ?? "Sin nombre"}
              {order.shipping_phone && `, ${order.shipping_phone}`}
              {order.shipping_address && (
                <>
                  <br />
                  {order.shipping_address}, {order.shipping_city}
                </>
              )}
              {order.shipping_notes && (
                <>
                  <br />
                  {order.shipping_notes}
                </>
              )}
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-display text-xl">{toShip || awaitingPayment ? "Notas" : "Guía y notas"}</h2>
            <DetailsForm
              orderId={order.id}
              tracking={order.tracking}
              notes={order.admin_notes}
              showTracking={!toShip && !awaitingPayment}
            />
          </section>

          {/* Cancelar deja el pedido a la vista como cancelado; borrar lo quita del todo. */}
          {(awaitingPayment || toShip || order.status === "cancelled") && (
            <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-6">
              {order.status !== "cancelled" && (
                <ConfirmButton
                  action={cancelOrder.bind(null, order.id)}
                  label="Cancelar el pedido"
                  question="¿Cancelar este pedido? No contará en ventas, stock ni caja."
                  confirmLabel="Sí, cancelar"
                  failureTitle="No se pudo cancelar"
                  successMessage="Pedido cancelado"
                />
              )}
              <ConfirmButton
                action={deleteOrder.bind(null, order.id)}
                label="Borrar el pedido"
                question={`¿Borrar ${order.code} para siempre? ${toShip ? "Ya está pagado: saldrá de ventas y de caja. " : ""}No se puede deshacer.`}
                confirmLabel="Sí, borrar"
                failureTitle="No se pudo borrar"
                successMessage="Pedido borrado"
                redirectTo="/admin/pedidos"
              />
            </div>
          )}
        </div>

        <aside className="border border-line bg-surface p-6 lg:sticky lg:top-8">
          <h2 className="font-display text-xl">Pago</h2>
          <dl className="mt-5 flex flex-col gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Debe llegar</dt>
              <dd className="font-medium tabular-nums">{formatCOP(total)}</dd>
            </div>
            {order.wompi_transaction_id && (
              <div>
                <dt className="text-ink-soft">Wompi</dt>
                <dd className="mt-1 break-all">{order.wompi_transaction_id}</dd>
                <dd className="text-xs text-ink-faint">Último estado: {wompiStatusLabels[order.wompi_status ?? ""] ?? order.wompi_status}</dd>
              </div>
            )}
            {order.payment_reported_at && (
              <div>
                <dt className="text-ink-soft">El cliente reportó</dt>
                <dd className="mt-1">{order.payment_reference}</dd>
                <dd className="text-xs text-ink-faint">{dateTime.format(new Date(order.payment_reported_at))}</dd>
              </div>
            )}
            {order.payment_confirmed_at && (
              <div>
                <dt className="text-ink-soft">Confirmado por</dt>
                <dd className="mt-1">{order.confirmed_by ?? "Wompi, automáticamente"}</dd>
                <dd className="text-xs text-ink-faint">{dateTime.format(new Date(order.payment_confirmed_at))}</dd>
              </div>
            )}
          </dl>
        </aside>
      </div>
    </div>
  );
}
