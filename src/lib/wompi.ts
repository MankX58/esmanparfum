import { sql } from "./db";
import { markOrderPaid } from "./payments";
import { absoluteUrl } from "./site";
import { integritySignature, orderIdFromReference, paymentReference, verifyEventSignature, type WompiEvent } from "./wompi-signature";

// Pasarela de pagos Wompi (Web Checkout). Cómo funciona:
// 1. La página del pedido arma un formulario hacia checkout.wompi.co con el valor, una
//    referencia única y una firma de integridad (calculada aquí, en el servidor).
// 2. El cliente paga en Wompi y vuelve a la página de su pedido con ?id=<transacción>.
// 3. Wompi avisa el resultado a /api/wompi/eventos. Ese aviso (o la consulta que se hace
//    al volver) es lo que marca el pedido como pagado; nunca lo que diga el navegador.
// Docs: https://docs.wompi.co/docs/colombia/widget-checkout-web/

const publicKey = process.env.WOMPI_PUBLIC_KEY ?? "";
const privateKey = process.env.WOMPI_PRIVATE_KEY ?? "";
const integritySecret = process.env.WOMPI_INTEGRITY_SECRET ?? "";
const eventsSecret = process.env.WOMPI_EVENTS_SECRET ?? "";

export const wompiConfigured = () => Boolean(publicKey && integritySecret);
// Las llaves de pruebas empiezan por pub_test_: con ellas no se mueve dinero real.
export const wompiTestMode = () => publicKey.startsWith("pub_test_");
const apiBase = () => (wompiTestMode() ? "https://sandbox.wompi.co/v1" : "https://production.wompi.co/v1");

export type WompiStatus = "APPROVED" | "DECLINED" | "VOIDED" | "ERROR" | "PENDING";

type WompiTransaction = {
  id: string;
  status: WompiStatus;
  reference: string;
  amount_in_cents: number;
  currency: string;
};

// Campos del formulario que lleva al cliente a pagar en Wompi.
export function checkoutFields({ orderId, total, email, name }: { orderId: number; total: number; email: string | null; name: string | null }) {
  const reference = paymentReference(orderId);
  const amountInCents = String(total * 100);
  const fields: Record<string, string> = {
    "public-key": publicKey,
    currency: "COP",
    "amount-in-cents": amountInCents,
    reference,
    "signature:integrity": integritySignature(reference, amountInCents, integritySecret),
    "redirect-url": absoluteUrl(`/pedidos/${orderId}`),
  };
  if (email) fields["customer-data:email"] = email;
  if (name) fields["customer-data:full-name"] = name;
  return fields;
}

// Consulta una transacción directamente a Wompi. Sirve al volver del pago: lo que llega en la
// dirección (?id=...) es solo un número; el estado se le pregunta siempre a Wompi.
export async function fetchTransaction(transactionId: string): Promise<WompiTransaction | null> {
  if (!/^[\w-]{1,64}$/.test(transactionId)) return null;
  const response = await fetch(`${apiBase()}/transactions/${transactionId}`, {
    headers: privateKey ? { Authorization: `Bearer ${privateKey}` } : {},
    cache: "no-store",
  });
  if (!response.ok) return null;
  const { data } = (await response.json()) as { data?: WompiTransaction };
  return data ?? null;
}

// Aplica a su pedido lo que dice una transacción de Wompi. Comprueba que la referencia sea de
// un pedido que espera pago y que el valor y la moneda coincidan con lo que se debe. Si el pago
// está aprobado, el pedido queda pagado. Se puede llamar varias veces con la misma transacción.
export async function applyTransaction(transaction: WompiTransaction) {
  const orderId = orderIdFromReference(transaction.reference);
  if (orderId === null) return;

  const [order] = await sql`
    select o.status, (coalesce(sum(oi.total), 0) + o.shipping_fee)::int as total
    from orders o left join order_items oi on oi.order_id = o.id
    where o.id = ${orderId}
    group by o.id`;
  if (!order) return;
  if (order.status !== "pending") {
    // Un pago aprobado para un pedido cancelado hay que devolverlo desde el panel de Wompi.
    if (order.status === "cancelled" && transaction.status === "APPROVED") {
      console.error(`Wompi: pago aprobado (${transaction.id}) para el pedido cancelado ${orderId}. Revísalo y haz la devolución.`);
    }
    return;
  }
  if (transaction.currency !== "COP" || transaction.amount_in_cents !== order.total * 100) {
    console.error(`Wompi: la transacción ${transaction.id} no coincide con el valor del pedido ${orderId}.`);
    return;
  }

  await sql`
    update orders set wompi_transaction_id = ${transaction.id}, wompi_status = ${transaction.status}
    where id = ${orderId} and status = 'pending'`;
  if (transaction.status === "APPROVED") await markOrderPaid(orderId, null);
}

// Un aviso de Wompi solo se cree si su firma es correcta (ver wompi-signature.ts).
export const verifyEvent = (event: WompiEvent) => verifyEventSignature(event, eventsSecret);
