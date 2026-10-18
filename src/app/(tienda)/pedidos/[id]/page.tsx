import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonStyles, linkStyles } from "@/components/button";
import { ConfirmButton } from "@/components/confirm-button";
import { requireUser } from "@/lib/auth";
import { formatCOP, formatDate, whatsappLink } from "@/lib/format";
import { OrderProgress, OrderStatusBadge } from "@/components/order-progress";
import { getOrder, getOrderItems, getStoreSettings, isToShip, showsCode } from "@/lib/orders";
import { ActionButton } from "@/components/action-button";
import { deliveryEstimate } from "@/lib/site";
import { applyTransaction, checkoutFields, fetchTransaction, wompiConfigured, wompiTestMode } from "@/lib/wompi";
import { cancelOrder, confirmDelivery } from "../actions";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false } };

// Lo que se le dice al cliente según el último intento de pago en Wompi.
const failedStatuses = ["DECLINED", "VOIDED", "ERROR"];

export default async function OrderPage({ params, searchParams }: PageProps<"/pedidos/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const user = await requireUser(`/pedidos/${id}`);
  let order = await getOrder(id);
  // Solo el dueño del pedido (o un administrador) puede verlo.
  if (!order || (order.user_id !== user.id && user.role !== "admin")) notFound();

  // Al volver de Wompi llega ?id=<transacción>. Se le pregunta el resultado a Wompi y se aplica
  // aquí mismo, para que el cliente vea su pago confirmado sin esperar el aviso de Wompi.
  const transactionId = (await searchParams).id;
  if (order.status === "pending" && typeof transactionId === "string" && wompiConfigured()) {
    const transaction = await fetchTransaction(transactionId);
    if (transaction) {
      await applyTransaction(transaction);
      order = (await getOrder(id)) ?? order;
    }
  }
  const paymentProcessing = order.status === "pending" && order.wompi_status === "PENDING";
  const paymentFailed = order.status === "pending" && failedStatuses.includes(order.wompi_status ?? "");

  const [items, store] = await Promise.all([getOrderItems(id), getStoreSettings()]);
  const total = order.items_total + order.shipping_fee;
  // Sin pago confirmado no se muestra el código: el pedido se identifica por nombre y fecha.
  const code = showsCode(order.status) ? order.code : null;
  const whatsappText = code
    ? `Hola, hice el pedido ${code} por ${formatCOP(total)}.`
    : `Hola, soy ${order.shipping_name}. Hice un pedido el ${formatDate(order.ordered_on)} por ${formatCOP(total)}.`;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-8 pb-24 sm:px-8">
      <Link href="/pedidos" className={`text-sm text-ink-soft ${linkStyles.default}`}>
        Mis pedidos
      </Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 motion-safe:animate-unveil">
        <div>
          <h1 className="font-display text-5xl font-light tracking-tight tabular-nums sm:text-6xl">{code ?? "Tu pedido"}</h1>
          <p className="mt-2 text-sm text-ink-soft">Pedido del {formatDate(order.ordered_on)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-10 border-y border-line py-8">
        <OrderProgress status={order.status} audience="customer" />
      </div>

      <div className="mt-12 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-10">
          {order.status === "pending" && (
            <section className="bg-brand p-6 text-on-brand sm:p-8">
              <h2 className="font-display text-2xl">{paymentProcessing ? "Estamos esperando tu pago" : "Paga tu pedido"}</h2>
              {paymentFailed && (
                <p role="alert" className="mt-4 border border-on-brand/30 px-4 py-3 text-sm leading-relaxed">
                  Tu último intento de pago no se aprobó y no se te cobró nada. Puedes intentarlo otra vez, con el mismo
                  medio o con otro.
                </p>
              )}
              {paymentProcessing ? (
                <>
                  <p className="mt-4 leading-relaxed text-on-brand-soft">
                    Wompi todavía está procesando tu pago. Con PSE o Nequi puede tardar unos minutos. Cuando se apruebe,
                    tu pedido se confirma solo. No hace falta que pagues otra vez.
                  </p>
                  <Link href={`/pedidos/${order.id}?id=${order.wompi_transaction_id}`} className={`mt-6 ${buttonStyles.onBrand}`}>
                    Ver si ya se aprobó
                  </Link>
                </>
              ) : wompiConfigured() ? (
                <>
                  <p className="mt-4 leading-relaxed text-on-brand-soft">
                    Vas a pagar {formatCOP(total)} en Wompi, la pasarela de pagos de Bancolombia. Puedes usar tarjeta de
                    crédito o débito, PSE, Nequi o tu cuenta Bancolombia. Al terminar vuelves aquí y tu pedido queda
                    confirmado.
                  </p>
                  {/* Formulario de Wompi Web Checkout. Los datos y la firma se arman en el servidor
                      (ver lib/wompi.ts): cambiar el valor en el navegador invalida la firma. */}
                  <form action="https://checkout.wompi.co/p/" method="GET" className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                    {Object.entries(
                      checkoutFields({ orderId: order.id, total, email: user.email, name: order.shipping_name }),
                    ).map(([name, value]) => (
                      <input key={name} type="hidden" name={name} value={value} />
                    ))}
                    <button type="submit" className={buttonStyles.onBrand}>
                      Pagar {formatCOP(total)} con Wompi
                    </button>
                    <span className="text-sm text-on-brand-soft">Pago seguro. Velare no ve ni guarda los datos de tu tarjeta.</span>
                  </form>
                  {wompiTestMode() && (
                    <p className="mt-6 text-xs text-on-brand-soft">
                      Modo de pruebas: el pago es simulado y no se cobra dinero real.
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-4 leading-relaxed text-on-brand-soft">
                  Los pagos en línea no están disponibles en este momento. Escríbenos por WhatsApp y te ayudamos a
                  completar tu pedido de {formatCOP(total)}.
                </p>
              )}
            </section>
          )}

          {order.status === "payment_reported" && (
            <section className="border border-line bg-surface p-6">
              {/* Pedido de antes de Wompi: el cliente avisó una transferencia y falta que la confirmemos. */}
              <h2 className="font-display text-2xl">Estamos verificando tu pago</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Recibimos tu aviso de transferencia ({order.payment_reference}). No tienes que hacer nada más: en cuanto
                la confirmemos, alistamos tu pedido.
              </p>
            </section>
          )}

          {isToShip(order.status) && (
            <section className="border border-line bg-surface p-6">
              <h2 className="font-display text-2xl">Pago confirmado</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Recibimos tu pago. Estamos alistando tu pedido; cuando salga, aquí verás la guía de envío. La entrega tarda {deliveryEstimate} aproximadamente.
              </p>
            </section>
          )}

          {order.status === "shipped" && (
            <section className="bg-brand p-6 text-on-brand sm:p-8">
              <h2 className="font-display text-2xl">Tu pedido va en camino</h2>
              {order.tracking && (
                <p className="mt-4">
                  <span className="block text-sm text-on-brand-soft">Guía de envío</span>
                  <span className="mt-1 block text-xl font-medium tabular-nums select-all">{order.tracking}</span>
                </p>
              )}
              <p className="mt-4 mb-6 leading-relaxed text-on-brand-soft">Cuando lo tengas en tus manos, avísanos.</p>
              {order.user_id === user.id && (
                <ActionButton
                  action={confirmDelivery.bind(null, order.id)}
                  label="Ya lo recibí"
                  successMessage="Gracias por avisar"
                  className={buttonStyles.onBrand}
                />
              )}
            </section>
          )}

          {order.status === "delivered" && (
            <section className="border border-line bg-surface p-6">
              <h2 className="font-display text-2xl">Pedido entregado</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Gracias por tu compra.{order.tracking && ` Guía de envío: ${order.tracking}.`}
              </p>
            </section>
          )}

          <section>
            <h2 className="font-display text-xl">Envío</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {order.shipping_name}, {order.shipping_phone}
              <br />
              {order.shipping_address}, {order.shipping_city}
              {order.shipping_notes && (
                <>
                  <br />
                  {order.shipping_notes}
                </>
              )}
            </p>
            {order.status !== "delivered" && order.status !== "cancelled" && (
              <p className="mt-3 text-sm leading-relaxed">
                <span className="font-medium">Tiempo de entrega:</span> {deliveryEstimate} aproximadamente, contados desde que se
                confirma tu pago.
              </p>
            )}
          </section>

          <div className="flex flex-wrap items-center gap-6">
            {store.whatsapp && (
              <a
                href={whatsappLink(store.whatsapp, whatsappText)}
                target="_blank"
                rel="noreferrer"
                className={buttonStyles.secondary}
              >
                Escribir por WhatsApp
              </a>
            )}
            {order.status === "pending" && !paymentProcessing && order.user_id === user.id && (
              <ConfirmButton
                action={cancelOrder.bind(null, order.id)}
                label="Cancelar el pedido"
                question="¿Cancelar este pedido?"
                confirmLabel="Sí, cancelar"
                failureTitle="No se pudo cancelar"
                successMessage="Pedido cancelado"
              />
            )}
          </div>
        </div>

        <aside className="border border-line bg-surface p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-xl">Resumen</h2>
          <ul className="mt-6 flex flex-col gap-3 text-sm">
            {items.map((item) => (
              <li key={item.product_name} className="flex justify-between gap-4">
                <span className="text-ink-soft">
                  {item.quantity} × {item.product_name}
                </span>
                {/* Precio de lista de la línea; el descuento del código va aparte, abajo. */}
                <span className="shrink-0 tabular-nums">{formatCOP(item.quantity * item.unit_price)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 flex flex-col gap-3 border-t border-line pt-6 text-sm">
            {order.promo_code && (
              <div className="flex justify-between gap-4 text-ok">
                <dt>
                  Descuento {order.promo_code} ({order.promo_percent}%)
                </dt>
                <dd className="tabular-nums">−{formatCOP(order.items_discount)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Envío</dt>
              <dd className="tabular-nums">{order.shipping_fee > 0 ? formatCOP(order.shipping_fee) : "Se coordina contigo"}</dd>
            </div>
            <div className="flex justify-between gap-4 text-base font-medium">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatCOP(total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  );
}
