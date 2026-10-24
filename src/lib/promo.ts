// Códigos promocionales. El descuento es un porcentaje del valor de los productos
// (el envío no se descuenta) y se reparte entre las líneas del pedido.
// Sin acceso a la base de datos: también lo usa el formulario del navegador.

export type PromoCode = { code: string; percent: number };

// "  verano10 " → "VERANO10". Solo letras, números, guion y guion bajo.
export const normalizeCode = (raw: string) => raw.trim().toUpperCase();
export const validCode = (code: string) => /^[A-Z0-9_-]{3,30}$/.test(code);

// Descuento de una línea: su valor por el porcentaje, redondeado al peso.
// El del pedido es la suma de sus líneas, así el carrito, el pedido y Wompi muestran lo mismo.
export const lineDiscount = (lineTotal: number, percent: number) => Math.round((lineTotal * percent) / 100);
