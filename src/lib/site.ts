// Dirección pública de la tienda, sin barra al final. Sale de APP_BASE_URL:
// http://localhost:3000 en desarrollo y https://<proyecto>.vercel.app en producción.
// La usan el mapa del sitio, robots.txt y los datos que leen los buscadores.
export const siteUrl = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Lo que tarda en llegar un pedido después de pagarlo. Se muestra en el checkout y en cada pedido.
export const deliveryEstimate = "unos 15 días";

// Lo mismo como rango en días, para dar fechas concretas.
export const deliveryDays ={ min: 12, max: 15 };

// "entre el 5 y el 8 de noviembre": cuándo llegaría un pedido pagado hoy (días calendario, hora de Colombia).
export function deliveryWindow(from = new Date()) {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(from).split("-").map(Number);
  const on = (days: number) => new Date(Date.UTC(year, month - 1, day + days));
  const part = (date: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-CO", { timeZone: "UTC", ...options }).format(date);
  const [first, last] = [on(deliveryDays.min), on(deliveryDays.max)];
  return first.getUTCMonth() === last.getUTCMonth()
    ? `entre el ${part(first, { day: "numeric" })} y el ${part(last, { day: "numeric", month: "long" })}`
    : `entre el ${part(first, { day: "numeric", month: "long" })} y el ${part(last, { day: "numeric", month: "long" })}`;
}

// Convierte una ruta ("/producto/x") o la dirección de una foto en una dirección completa.
export const absoluteUrl = (path: string) => (path.startsWith("http") ? path : `${siteUrl}${path}`);
