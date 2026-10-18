import { sql } from "./db";
import { emptyRates, type ShippingRates } from "./shipping";

// Estados de un pedido, en el orden en que avanza. Cada paso lo mueve una sola acción:
//   pending → (Wompi aprueba el pago) → payment_confirmed → (panel: marcar como enviado) →
//   shipped → (panel o cliente: entregado) → delivered
// Estados antiguos que ya no se asignan: "payment_reported" (el cliente avisaba de una
// transferencia; se muestra como Por pagar) y "preparing" (se muestra como payment_confirmed).
export const statusLabels = {
  pending: "Por pagar",
  payment_reported: "Pago en revisión",
  payment_confirmed: "Preparando tu pedido", // Wompi aprobó el pago: el pedido pasa aquí solo
  preparing: "Preparando tu pedido",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
} as const;

export type OrderStatus = keyof typeof statusLabels;

// Los pasos que se muestran en el recorrido del pedido.
export const orderSteps: OrderStatus[] = ["pending", "payment_confirmed", "shipped", "delivered"];

// En qué paso del recorrido está un pedido (0 a 3). No aplica a los cancelados.
const stepAlias: Partial<Record<OrderStatus, OrderStatus>> = { payment_reported: "pending", preparing: "payment_confirmed" };
export const stepOf = (status: OrderStatus) => orderSteps.indexOf(stepAlias[status] ?? status);

// Un pedido ya pagado que falta despachar.
export const isToShip = (status: OrderStatus) => status === "payment_confirmed" || status === "preparing";

// El cliente solo ve el código del pedido cuando el pago ya está confirmado.
// Antes de eso (por pagar, pago en revisión o cancelado) el pedido se muestra sin código.
export const showsCode = (status: OrderStatus) => stepOf(status) >= stepOf("payment_confirmed");

export type Order = {
  id: number;
  code: string;
  status: OrderStatus;
  ordered_on: string;
  user_id: number | null;
  customer: string | null;
  customer_id: number | null;
  customer_phone: string | null;
  customer_email: string | null; // el de su cuenta; si no tiene cuenta, el de su ficha de cliente
  channel: string | null;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_notes: string | null;
  shipping_fee: number;
  payment_method: string | null; // 'Wompi' o 'Transferencia' en los pedidos de la tienda
  tracking: string | null;
  payment_reference: string | null;
  payment_reported_at: string | null;
  payment_confirmed_at: string | null;
  confirmed_by: string | null;
  admin_notes: string | null;
  wompi_transaction_id: string | null;
  wompi_status: string | null;
  promo_code: string | null; // código promocional usado, tal como estaba al hacer el pedido
  promo_percent: number | null;
  transfer_percent: number | null; // descuento por pagar con transferencia
  promo_discount: number; // pesos descontados por el código
  transfer_discount: number; // pesos descontados por la transferencia
  items_total: number; // productos ya con el descuento del código
  items_discount: number; // descuento total del código en pesos
};

// total ya trae restado el descuento del código (discount).
export type OrderItem = { product_name: string; quantity: number; unit_price: number; discount: number; total: number };

// Un pedido con el total de sus líneas. Devuelve undefined si no existe.
export async function getOrder(id: number) {
  const rows = (await sql`
    select o.id, o.code, o.status, o.ordered_on::text as ordered_on, o.user_id, c.name as customer,
           o.customer_id, c.phone as customer_phone, coalesce(buyer.email, c.email) as customer_email, o.channel,
           o.shipping_name, o.shipping_phone, o.shipping_address, o.shipping_city, o.shipping_notes,
           o.shipping_fee, o.payment_method, o.tracking, o.payment_reference,
           o.payment_reported_at::text as payment_reported_at,
           o.payment_confirmed_at::text as payment_confirmed_at,
           u.email as confirmed_by, o.admin_notes, o.wompi_transaction_id, o.wompi_status, o.promo_code, o.promo_percent, o.transfer_percent,
           (select coalesce(sum(total), 0) from order_items where order_id = o.id)::int as items_total,
           (select coalesce(sum(discount), 0) from order_items where order_id = o.id)::int as items_discount,
           -- Cada descuento redondeado por línea, igual que al crear el pedido (lib/promo.ts).
           (select coalesce(sum(round(quantity * unit_price * coalesce(o.promo_percent, 0) / 100.0)), 0)
              from order_items where order_id = o.id)::int as promo_discount,
           (select coalesce(sum(round(quantity * unit_price * coalesce(o.transfer_percent, 0) / 100.0)), 0)
              from order_items where order_id = o.id)::int as transfer_discount
    from orders o
    left join customers c on c.id = o.customer_id
    left join users u on u.id = o.payment_confirmed_by
    left join users buyer on buyer.id = o.user_id
    where o.id = ${id}`) as Order[];
  return rows[0];
}

export async function getOrderItems(orderId: number) {
  return (await sql`
    select product_name, quantity, unit_price, discount, total
    from order_items where order_id = ${orderId} order by id`) as OrderItem[];
}

// Datos de la tienda que el dueño configura en Panel → Ajustes.
// (Las llaves de Wompi viven en las variables de entorno, no aquí.)
export type StoreSettings = {
  whatsapp: string; // número con indicativo, solo dígitos: 573001234567
  shippingRates: ShippingRates; // costo de envío por zona (ver lib/shipping.ts); null = se coordina
  qrImage: string; // QR para pagar por transferencia, dentro de la carpeta public: "/pago-qr.jpg"
  // Quién responde por la tienda. Salen en Términos, Privacidad y Cambios y devoluciones.
  legalName: string; // nombre completo o razón social
  legalId: string; // cédula o NIT
  address: string; // domicilio: dirección y ciudad
  email: string; // correo para peticiones, quejas y datos personales
};

const emptySettings: StoreSettings = { whatsapp: "", shippingRates: emptyRates, qrImage: "", legalName: "", legalId: "", address: "", email: "" };

export async function getStoreSettings(): Promise<StoreSettings> {
  const [row] = await sql`select value from settings where key = 'store'`;
  const saved = (row?.value ?? {}) as Partial<StoreSettings>;
  // Solo los campos actuales: la llave, el titular, el banco y el envío fijo de antes pueden seguir guardados.
  return {
    whatsapp: saved.whatsapp ?? emptySettings.whatsapp,
    shippingRates: { ...emptyRates, ...saved.shippingRates },
    qrImage: saved.qrImage ?? emptySettings.qrImage,
    legalName: saved.legalName ?? "",
    legalId: saved.legalId ?? "",
    address: saved.address ?? "",
    email: saved.email ?? "",
  };
}
