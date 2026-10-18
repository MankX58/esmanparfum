// Calcula el precio de envío de cada zona para que cubra el flete real en al menos el 90 % de los envíos.
//
//   npm run db:envios               solo calcula y muestra la tabla
//   npm run db:envios -- --guardar  además guarda los precios en Ajustes (tabla settings)
//
// Cómo funciona: simula muchos envíos. En cada uno elige al azar cuántos perfumes lleva el pedido,
// cuáles (del catálogo activo, con su tamaño y precio reales), cuánto pesan, el tamaño de la caja,
// la tarifa de la transportadora y el seguro. El precio de la zona es el costo que deja por debajo
// al 90 % de los envíos (percentil 90), redondeado hacia arriba a miles.
//
// Las cifras de abajo son SUPUESTOS a partir de tarifas publicadas en 2026 por terceros (no hay tarifas
// oficiales públicas). Cuando tengas cotizaciones reales de tu transportadora, cambia los rangos y
// vuelve a ejecutar. Cada rango [mín, máx] se elige al azar de forma pareja.
import { connect } from "./db.mjs";

// ---------- Supuestos ----------

const COVERAGE = 0.9; // el precio cubre el flete en el 90 % de los envíos
const SAMPLES = 200_000;

// Cuántos perfumes lleva un pedido. Supuesto: la mayoría lleva uno.
const UNITS_PER_ORDER = [
  [1, 0.75],
  [2, 0.2],
  [3, 0.05],
];

// Peso de un perfume con su caja de fábrica, en gramos por ml. 100 ml ≈ 400–600 g
// (los frascos árabes de vidrio grueso están en la parte alta).
const GRAMS_PER_ML = [4, 6];
const DEFAULT_ML = 100; // para productos sin tamaño registrado
// Empaque de envío: caja de cartón, plástico burbuja y cinta.
const PACKING_GRAMS = [150, 250];
const PACKING_COST = [1500, 3000]; // pesos por pedido
// Caja de envío según unidades (cm). Peso volumétrico = largo × ancho × alto ÷ 5000.
const BOX_CM = { 1: [20, 15, 12], 2: [22, 20, 12], 3: [25, 22, 14] };
const VOLUMETRIC_DIVISOR = 5000;
// Seguro o "valor declarado": porcentaje del valor de los perfumes, con un mínimo en pesos.
const INSURANCE_RATE = [0.01, 0.02];
const INSURANCE_MIN = 1000;

// Tarifa de la transportadora por zona: primer kilo y cada kilo adicional, en pesos.
// Fuentes: andreybusiness.com (tarifas Interrapidísimo 2026), propuesta comercial de effi.com.co
// (2026-06-30) y enviotodo.com.co. Se toma el rango entre la más baja y la más alta encontradas.
const CARRIER = {
  medellin: { firstKg: [9100, 13500], extraKg: [2000, 3500] },
  aburra: { firstKg: [10000, 14500], extraKg: [2000, 3500] },
  antioquia: { firstKg: [11600, 17500], extraKg: [3000, 4500] },
  nacional: { firstKg: [16800, 21000], extraKg: [4000, 5400] },
  remota: { firstKg: [20000, 25000], extraKg: [7000, 10000] },
};

// ---------- Simulación ----------

// Números al azar con semilla fija: cada ejecución da el mismo resultado.
function random(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = random(20261018);
const between = ([min, max]) => min + (max - min) * rand();
function pickUnits() {
  let r = rand();
  for (const [units, share] of UNITS_PER_ORDER) if ((r -= share) < 0) return units;
  return UNITS_PER_ORDER.at(-1)[0];
}

function shipmentCost(zone, catalog) {
  const units = pickUnits();
  const perfumes = Array.from({ length: units }, () => catalog[Math.floor(rand() * catalog.length)]);

  const realKg = (perfumes.reduce((sum, p) => sum + (p.size_ml ?? DEFAULT_ML) * between(GRAMS_PER_ML), 0) + between(PACKING_GRAMS)) / 1000;
  const [l, w, h] = BOX_CM[units];
  const volumetricKg = (l * w * h) / VOLUMETRIC_DIVISOR;
  // Se cobra por kilos completos: el mayor entre el peso real y el volumétrico, mínimo 1 kg.
  const billedKg = Math.max(1, Math.ceil(Math.max(realKg, volumetricKg)));

  const rate = CARRIER[zone];
  const freight = between(rate.firstKg) + (billedKg - 1) * between(rate.extraKg);
  const declared = perfumes.reduce((sum, p) => sum + p.list_price, 0);
  const insurance = Math.max(INSURANCE_MIN, declared * between(INSURANCE_RATE));
  return freight + insurance + between(PACKING_COST);
}

const db = await connect();
const { rows: catalog } = await db.query("select size_ml, list_price from products where is_active and list_price > 0");
if (catalog.length === 0) throw new Error("No hay productos activos con precio para simular.");

const rates = {};
console.log(`Simulando ${SAMPLES.toLocaleString("es-CO")} envíos por zona con ${catalog.length} perfumes activos.\n`);
console.log("Zona          Mediana   Percentil 90   Precio al cliente   Envíos cubiertos");
for (const zone of Object.keys(CARRIER)) {
  const costs = Array.from({ length: SAMPLES }, () => shipmentCost(zone, catalog)).sort((a, b) => a - b);
  const p90 = costs[Math.ceil(SAMPLES * COVERAGE) - 1];
  const price = Math.ceil(p90 / 1000) * 1000;
  const covered = costs.filter((cost) => cost <= price).length / SAMPLES;
  rates[zone] = price;
  const peso = (n) => `$${Math.round(n).toLocaleString("es-CO")}`;
  console.log(
    `${zone.padEnd(13)} ${peso(costs[SAMPLES / 2]).padStart(8)}   ${peso(p90).padStart(12)}   ${peso(price).padStart(17)}   ${(covered * 100).toFixed(1).padStart(15)} %`,
  );
}

if (process.argv.includes("--guardar")) {
  // Solo cambia las tarifas: el resto de los ajustes de la tienda queda igual.
  await db.query(
    `insert into settings (key, value) values ('store', jsonb_build_object('shippingRates', $1::jsonb))
     on conflict (key) do update set value = settings.value || jsonb_build_object('shippingRates', $1::jsonb)`,
    [JSON.stringify(rates)],
  );
  console.log("\nGuardado en Ajustes → Costo de envío por zona.");
} else {
  console.log("\nNo se guardó nada. Para guardar: npm run db:envios -- --guardar");
}
await db.end();
