import { createHash, timingSafeEqual } from "node:crypto";

// Firmas de Wompi, sin nada más alrededor para poder probarlas solas (lib.test.ts).

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

// Firma de integridad del Web Checkout: SHA-256 de referencia + valor en centavos + moneda + secreto.
// Impide que alguien cambie el valor en el navegador antes de pagar.
export const integritySignature = (reference: string, amountInCents: string, secret: string) =>
  sha256(`${reference}${amountInCents}COP${secret}`);

// Cada intento de pago lleva su propia referencia: VEL<id del pedido>-<marca de tiempo>.
// Así el cliente puede reintentar tras un pago rechazado, y la referencia dice de qué pedido es.
export const paymentReference = (orderId: number, now = Date.now()) => `VEL${orderId}-${now.toString(36)}`;

export const orderIdFromReference = (reference: string) => {
  const match = /^VEL(\d+)-[a-z0-9]+$/.exec(reference);
  return match ? Number(match[1]) : null;
};

export type WompiEvent = {
  event?: string;
  data?: Record<string, unknown>;
  signature?: { properties?: string[]; checksum?: string };
  timestamp?: number;
};

// Comprueba la firma de un evento de Wompi: SHA-256 de los valores que indica
// signature.properties (en ese orden) + timestamp + secreto de eventos.
export function verifyEventSignature(event: WompiEvent, secret: string) {
  const { properties, checksum } = event.signature ?? {};
  if (!secret || !Array.isArray(properties) || typeof checksum !== "string" || event.timestamp === undefined) return false;

  // Cada propiedad es una ruta dentro de data, por ejemplo "transaction.amount_in_cents".
  const values = properties.map((path) =>
    path.split(".").reduce<unknown>((value, key) => (value as Record<string, unknown> | undefined)?.[key], event.data),
  );
  const expected = sha256(`${values.join("")}${event.timestamp}${secret}`);
  const received = checksum.toLowerCase();
  return expected.length === received.length && timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}
