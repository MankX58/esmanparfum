import municipios from "./municipios.json" with { type: "json" };

// Costo de envío por zonas, desde la bodega en Medellín (Tricentenario).
// El cliente elige su municipio de una lista (la oficial del DANE, en municipios.json:
// [código, nombre, departamento]); el municipio dice la zona y la zona dice el precio,
// que el dueño fija en Panel → Ajustes. Sin acceso a la base de datos: también lo usa el navegador.

export type ShippingZone = "medellin" | "aburra" | "antioquia" | "nacional" | "remota";

// Precio de cada zona en pesos. null = no se cobra en la web: se coordina con el cliente.
export type ShippingRates = Record<ShippingZone, number | null>;

export const shippingZones: { id: ShippingZone; label: string; hint: string }[] = [
  { id: "medellin", label: "Medellín", hint: "Entrega urbana desde la bodega." },
  {
    id: "aburra",
    label: "Valle de Aburrá",
    hint: "Bello, Itagüí, Envigado, Sabaneta, La Estrella, Caldas, Copacabana, Girardota y Barbosa.",
  },
  { id: "antioquia", label: "Resto de Antioquia", hint: "Los demás municipios del departamento." },
  { id: "nacional", label: "Resto de Colombia", hint: "Bogotá, Cali, la Costa y demás municipios del país." },
  {
    id: "remota",
    label: "Zonas de difícil acceso",
    hint: "San Andrés y Providencia, Amazonas, Guainía, Guaviare, Vaupés y Vichada. Las transportadoras cobran más o no llevan perfumes.",
  },
];

export const emptyRates: ShippingRates = { medellin: null, aburra: null, antioquia: null, nacional: null, remota: null };

// Municipios del área metropolitana del Valle de Aburrá, por código DANE (sin Medellín).
const ABURRA = ["05079", "05088", "05129", "05212", "05266", "05308", "05360", "05380", "05631"];
// Departamentos a los que las transportadoras llegan por avión o con recargo (trayectos especiales).
const REMOTE_DEPARTMENTS = ["88", "91", "94", "95", "97", "99"];

export type City = { code: string; name: string; label: string };

const cities: City[] = (municipios as [string, string, string][]).map(([code, name, department]) => ({
  code,
  name,
  label: department ? `${name}, ${department}` : name,
}));
const byCode = new Map(cities.map((city) => [city.code, city]));

export const cityOptions = cities.map((city) => ({ value: city.code, label: city.label }));
export const findCity = (code: string) => byCode.get(code);

export function zoneOf(code: string): ShippingZone {
  if (code === "05001") return "medellin";
  if (ABURRA.includes(code)) return "aburra";
  if (code.startsWith("05")) return "antioquia";
  if (REMOTE_DEPARTMENTS.includes(code.slice(0, 2))) return "remota";
  return "nacional";
}

// Lo que cuesta enviar a ese municipio, o null si se coordina aparte.
export const shippingFor = (code: string, rates: ShippingRates) => (byCode.has(code) ? rates[zoneOf(code)] : null);
