import { after } from "next/server";
import { sql } from "./db";
import { sendEmail } from "./email";
import { formatCOP } from "./format";
import { deliveryEstimate } from "./site";

// Avisos por correo. Se envían con after(): primero responde la página o la acción y luego,
// sin hacer esperar a nadie, sale el correo. Cada aviso lee de la base lo que necesita.

// ---------- Pedidos ----------

// Los estados que se avisan al cliente: del pago confirmado en adelante.
type OrderEvent = "paid" | "shipped" | "delivered" | "cancelled";

export const notifyOrder = (orderId: number, event: OrderEvent) => after(() => sendOrderEmail(orderId, event));

async function sendOrderEmail(orderId: number, event: OrderEvent) {
  const [order] = await sql`
    select o.id, o.code, o.tracking, o.shipping_name, o.shipping_address, o.shipping_city, o.shipping_fee, u.email,
           (select coalesce(sum(total), 0) from order_items where order_id = o.id)::int as items_total
    from orders o
    join users u on u.id = o.user_id
    where o.id = ${orderId}`;
  // Sin cuenta (venta presencial) o sin correo no hay a quién avisar.
  if (!order?.email) return;

  const items = await sql`select product_name, quantity from order_items where order_id = ${orderId} order by id`;
  const total = formatCOP(order.items_total + order.shipping_fee);
  const products: [string, string][] = items.map((item) => [`${item.quantity} ×`, item.product_name as string]);
  const greeting = `Hola${order.shipping_name ? `, ${String(order.shipping_name).split(" ")[0]}` : ""}.`;
  const button = { label: "Ver mi pedido", path: `/pedidos/${order.id}` };

  const emails: Record<OrderEvent, Parameters<typeof sendEmail>[0]> = {
    paid: {
      to: order.email,
      subject: `Pago confirmado: estamos preparando tu pedido ${order.code}`,
      title: "Recibimos tu pago",
      paragraphs: [
        greeting,
        `Tu pago de ${total} quedó confirmado y ya estamos preparando tu pedido ${order.code}.`,
        `La entrega tarda ${deliveryEstimate} aproximadamente. Te escribiremos cuando salga, con la guía de envío.`,
      ],
      rows: [...products, ["Envío a", `${order.shipping_address}, ${order.shipping_city}`], ["Total pagado", total]],
      button,
    },
    shipped: {
      to: order.email,
      subject: `Tu pedido ${order.code} va en camino`,
      title: "Tu pedido va en camino",
      paragraphs: [
        greeting,
        `Despachamos tu pedido ${order.code} a ${order.shipping_address}, ${order.shipping_city}.`,
        order.tracking ? "Con la guía de abajo puedes seguirlo en la página de la transportadora." : "Pronto lo tendrás en tus manos.",
        "Cuando lo recibas, puedes avisarnos desde tu pedido.",
      ],
      rows: order.tracking ? [["Guía de envío", order.tracking]] : undefined,
      button,
    },
    delivered: {
      to: order.email,
      subject: `Tu pedido ${order.code} fue entregado`,
      title: "Pedido entregado",
      paragraphs: [greeting, `Tu pedido ${order.code} figura como entregado. Gracias por comprar en Velare: esperamos que lo disfrutes.`],
      button,
    },
    cancelled: {
      to: order.email,
      subject: `Tu pedido ${order.code} fue cancelado`,
      title: "Cancelamos tu pedido",
      paragraphs: [
        greeting,
        `Tu pedido ${order.code} fue cancelado. Como ya lo habías pagado, te devolveremos ${total} por el mismo medio de pago; si necesitamos algún dato, te escribiremos.`,
        "Si tienes preguntas, responde este correo o escríbenos por WhatsApp.",
      ],
      button,
    },
  };
  await sendEmail(emails[event]);
}

// ---------- Cotizaciones ----------

// A los administradores, cuando alguien pide una cotización.
export const notifyQuoteRequested = (quoteId: number) =>
  after(async () => {
    const [quote] = await sql`
      select q.id, q.perfume, q.details, q.phone, u.email
      from quotes q join users u on u.id = q.user_id
      where q.id = ${quoteId}`;
    if (!quote) return;
    const admins = await sql`select email from users where role = 'admin' and email is not null`;
    await sendEmail({
      to: admins.map((admin) => admin.email as string),
      subject: `Nueva cotización: ${quote.perfume}`,
      title: "Te pidieron una cotización",
      paragraphs: [
        `Un cliente busca ${quote.perfume}.`,
        ...(quote.details ? [`Detalles: ${quote.details}`] : []),
        "Respóndele desde el panel: el cliente recibe la respuesta por correo y la ve en la tienda.",
      ],
      rows: [
        ["Correo", quote.email ?? "Sin correo"],
        ["WhatsApp", quote.phone],
      ],
      button: { label: "Responder la cotización", path: `/admin/cotizaciones?abrir=${quote.id}` },
    });
  });

// Al cliente, cada vez que se responde (o corrige) su cotización.
export const notifyQuoteAnswered = (quoteId: number, corrected: boolean) =>
  after(async () => {
    const [quote] = await sql`
      select q.perfume, q.price, q.answer, u.email
      from quotes q join users u on u.id = q.user_id
      where q.id = ${quoteId}`;
    if (!quote?.email) return;
    const found = quote.price !== null;
    await sendEmail({
      to: quote.email,
      subject: `${corrected ? "Actualizamos tu" : "Respondimos tu"} cotización: ${quote.perfume}`,
      title: found ? "Ya tenemos el precio" : "Sobre tu cotización",
      paragraphs: [
        found
          ? `Conseguimos ${quote.perfume}. Este es el precio:`
          : `Buscamos ${quote.perfume}, pero por ahora no lo pudimos conseguir.`,
        ...(quote.answer ? [quote.answer] : []),
      ],
      rows: found ? [["Precio", formatCOP(quote.price)]] : undefined,
      button: { label: "Ver mi cotización", path: "/cotizar#mis-cotizaciones" },
    });
  });
