import { Check } from "@phosphor-icons/react/dist/ssr";
import { orderSteps, statusLabels, stepOf, type OrderStatus } from "@/lib/orders";

// Cómo se ve el avance de un pedido en toda la app:
// - OrderProgress: el recorrido completo (página del pedido, en tienda y en panel).
// - OrderStatusBadge: versión corta para listas y encabezados.

// Nombre corto de cada paso del recorrido, en el orden de orderSteps. El panel no dice "tu".
const stepNames = {
  customer: ["Pedido hecho", "Preparando tu pedido", "Enviado", "Entregado"],
  admin: ["Pedido hecho", "Preparando pedido", "Enviado", "Entregado"],
};
const adminLabels: Partial<Record<OrderStatus, string>> = { payment_confirmed: "Preparando pedido", preparing: "Preparando pedido" };

// Qué está pasando en cada estado y a quién le toca actuar, dicho para el cliente y para el panel.
export const statusHints: Record<"customer" | "admin", Record<OrderStatus, string>> = {
  customer: {
    pending: "Te toca: paga con Wompi. Al aprobarse el pago, tu pedido se confirma solo.",
    payment_reported: "Nos toca: estamos revisando tu transferencia.",
    payment_confirmed: "Wompi confirmó tu pago. Estamos alistando tu pedido para enviarlo.",
    preparing: "Wompi confirmó tu pago. Estamos alistando tu pedido para enviarlo.",
    shipped: "Tu pedido va en camino. Avísanos cuando lo recibas.",
    delivered: "Entregado. Gracias por tu compra.",
    cancelled: "Este pedido se canceló.",
  },
  admin: {
    pending: "El cliente aún no ha pagado en Wompi. No tienes que hacer nada: cuando Wompi apruebe el pago, el pedido pasa solo a Preparando pedido.",
    payment_reported: "Pedido de antes de Wompi: revisa tu banco y confirma la transferencia.",
    payment_confirmed: "Wompi aprobó el pago. Te toca: alista el pedido y márcalo como enviado.",
    preparing: "Wompi aprobó el pago. Te toca: alista el pedido y márcalo como enviado.",
    shipped: "En camino. Márcalo como entregado cuando el cliente lo reciba.",
    delivered: "Pedido cerrado. No hay nada más que hacer.",
    cancelled: "Este pedido se canceló.",
  },
};

// Recorrido del pedido. En el teléfono es una línea vertical; desde pantallas medianas, horizontal.
export function OrderProgress({ status, audience }: { status: OrderStatus; audience: "customer" | "admin" }) {
  if (status === "cancelled") {
    return (
      <p role="status" className="border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
        {statusHints[audience].cancelled}
      </p>
    );
  }

  const current = stepOf(status);
  const finished = status === "delivered";

  return (
    <ol aria-label="Avance del pedido" className="flex flex-col md:flex-row">
      {orderSteps.map((step, index) => {
        const done = index < current || finished;
        const isCurrent = index === current && !finished;
        return (
          <li
            key={step}
            aria-current={index === current ? "step" : undefined}
            className="relative flex flex-1 gap-4 pb-7 last:pb-0 md:flex-col md:gap-3 md:pr-4 md:pb-0"
          >
            {/* Línea hacia el paso siguiente: vertical en el teléfono, horizontal en pantallas medianas. */}
            {index < orderSteps.length - 1 && (
              <span aria-hidden className="absolute top-8 bottom-1 left-3.5 w-px bg-line md:top-3.5 md:right-1 md:bottom-auto md:left-8 md:h-px md:w-auto">
                {index < current && (
                  <span
                    style={{ animationDelay: `${index * 120}ms` }}
                    className="absolute inset-0 origin-left bg-brand md:motion-safe:animate-grow"
                  />
                )}
              </span>
            )}

            {/* Marcador: visto bueno sobre verde si ya pasó; número sobre el tono más oscuro
                (y un pulso) si es el actual; número en gris si falta. */}
            <span className="relative grid size-7 shrink-0 place-items-center">
              {isCurrent && <span aria-hidden className="absolute inset-0 bg-brand motion-safe:animate-ping" />}
              <span
                className={`relative grid size-7 place-items-center text-xs font-medium tabular-nums ${
                  done ? "bg-brand text-on-brand" : isCurrent ? "bg-ink text-paper" : "border border-line bg-surface text-ink-faint"
                }`}
              >
                {done ? <Check size={14} weight="bold" aria-hidden /> : index + 1}
              </span>
            </span>

            <div className="min-w-0 pt-1 md:pt-0">
              <p className={`text-sm ${isCurrent ? "font-medium" : done ? "text-ink-soft" : "text-ink-faint"}`}>
                {stepNames[audience][index]}
                {done && <span className="sr-only"> (completado)</span>}
              </p>
              {index === current && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{statusHints[audience][status]}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// Estado en corto: el nombre y una barrita de cuatro tramos que se llena hasta el paso actual.
export function OrderStatusBadge({ status, audience = "customer" }: { status: OrderStatus; audience?: "customer" | "admin" }) {
  if (status === "cancelled") {
    return <span className="text-sm font-medium text-danger">{statusLabels.cancelled}</span>;
  }

  const current = stepOf(status);
  return (
    <span className="inline-flex flex-col gap-1.5">
      <span className="text-sm font-medium whitespace-nowrap">{(audience === "admin" && adminLabels[status]) || statusLabels[status]}</span>
      <span aria-hidden className="flex gap-0.5">
        {orderSteps.map((step, index) => (
          <span key={step} className={`h-1 w-4 ${index <= current ? "bg-brand" : "bg-line"}`} />
        ))}
      </span>
      <span className="sr-only">
        Paso {current + 1} de {orderSteps.length}
      </span>
    </span>
  );
}
