// Pruebas de las cuentas de dinero. Se ejecutan con: npm test
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { parseMoney, parsePercent, percentText, readForm } from "./form.ts";
import { whatsappLink } from "./format.ts";
import { purchaseEffect } from "./inventory.ts";
import { monthLabel, parsePeriod } from "./period.ts";
import { suggestPrice } from "./pricing.ts";
import { lineDiscount, normalizeCode, validCode } from "./promo.ts";
import { cityOptions, findCity, shippingFor, zoneOf } from "./shipping.ts";
import { integritySignature, orderIdFromReference, paymentReference, verifyEventSignature } from "./wompi-signature.ts";

test("parseMoney acepta pesos con o sin puntos de miles", () => {
  assert.equal(parseMoney("215000"), 215000);
  assert.equal(parseMoney("215.000"), 215000);
  assert.equal(parseMoney("$ 1.215.000"), 1215000);
  assert.equal(parseMoney("0"), 0);
});

test("parseMoney rechaza decimales, negativos y texto", () => {
  // "215.5" NO debe leerse como 2155 ni como 215: es ambiguo y se rechaza.
  for (const bad of ["215.5", "215,50", "-100", "abc", "", "1.2.3", "9999999999"]) {
    assert.equal(parseMoney(bad), null, bad);
  }
});

test("readForm anota los errores por campo", () => {
  const data = new FormData();
  data.set("price", "12,5");
  data.set("quantity", "0");
  data.set("phone", "llámame");
  data.set("mobile", "300 123 4567");
  const form = readForm(data);
  assert.equal(form.money("price", { required: true }), null);
  assert.equal(form.integer("quantity", { min: 1 }), null);
  assert.equal(form.text("name", { required: true }), null);
  form.phone("phone");
  assert.equal(form.phone("mobile"), "300 123 4567");
  assert.deepEqual(Object.keys(form.errors).sort(), ["name", "phone", "price", "quantity"]);
});

test("parsePercent convierte lo escrito en fracción", () => {
  assert.equal(parsePercent("30"), 0.3);
  assert.equal(parsePercent("2,5 %"), 0.025);
  assert.equal(percentText(0.3), "30");
  for (const bad of ["", "abc", "-5", "100", "1.2.3"]) assert.equal(parsePercent(bad), null, bad);
});

test("parsePeriod entiende año, mes y todo el tiempo", () => {
  assert.deepEqual(parsePeriod("2026"), { from: "2026-01-01", to: "2027-01-01" });
  assert.deepEqual(parsePeriod("2026-10"), { from: "2026-10-01", to: "2026-11-01" });
  assert.equal(monthLabel("2026-10"), "octubre de 2026");
  // Diciembre termina donde empieza enero del año siguiente.
  assert.equal(parsePeriod("2026-12").to, "2027-01-01");
  for (const all of ["", "2026-13", "octubre", "2026-1"]) assert.equal(parsePeriod(all).from, null, all);
});

test("suggestPrice da los mismos valores que la hoja Precios del Excel", () => {
  // P011: costo promedio $125.328, margen deseado 30 %, sin comisión ni IVA.
  const price = suggestPrice({ cost: 125328, otherCosts: 0, margin: 0.3, fee: 0, vat: 0 });
  assert.deepEqual(
    { suggested: price?.suggested, rounded: price?.rounded, withVat: price?.withVat, profit: price?.profit },
    { suggested: 179040, rounded: 180000, withVat: 180000, profit: 54672 },
  );
  assert.equal(price?.realMargin.toFixed(4), "0.3037");
  assert.equal(price?.markup.toFixed(4), "0.4362");
  // La tabla de márgenes del Excel: 20 % → $157.000 y 60 % → $314.000.
  assert.equal(suggestPrice({ cost: 125328, otherCosts: 0, margin: 0.2, fee: 0, vat: 0 })?.rounded, 157000);
  assert.equal(suggestPrice({ cost: 125328, otherCosts: 0, margin: 0.6, fee: 0, vat: 0 })?.rounded, 314000);
  // Un precio que ya cae en miles exactos no sube mil pesos por un error de decimales.
  assert.equal(suggestPrice({ cost: 70000, otherCosts: 0, margin: 0.3, fee: 0, vat: 0 })?.rounded, 100000);
  // Comisión e IVA: 3 % de comisión sale del precio; el IVA se suma al final.
  const withFee = suggestPrice({ cost: 67000, otherCosts: 0, margin: 0.3, fee: 0.03, vat: 0.19 });
  assert.deepEqual([withFee?.rounded, withFee?.feeAmount, withFee?.profit, withFee?.withVat], [100000, 3000, 30000, 119000]);
  // Margen y comisión no pueden sumar 100 %.
  assert.equal(suggestPrice({ cost: 1000, otherCosts: 0, margin: 0.9, fee: 0.1, vat: 0 }), null);
});

test("whatsappLink deja solo dígitos y agrega el indicativo de Colombia", () => {
  assert.equal(whatsappLink("300 123-4567", "Hola, ¿qué tal?"), "https://wa.me/573001234567?text=Hola%2C%20%C2%BFqu%C3%A9%20tal%3F");
  assert.equal(whatsappLink("+57 300 123 4567", "ok"), "https://wa.me/573001234567?text=ok");
});

test("purchaseEffect da los mismos valores que el Excel", () => {
  // Compra real P001: 1 unidad a $112.809 con $64.335 de flete, sin stock previo.
  const empty = { stock: 0, unitsIn: 0, costBasis: 0, avgCost: 141382 };
  assert.deepEqual(purchaseEffect(empty, 1, 112809, 64335), {
    totalCost: 177144,
    realUnitCost: 177144,
    newStock: 1,
    newAvgCost: 177144,
  });
  // Una segunda unidad más barata baja el promedio.
  const after = { stock: 0, unitsIn: 1, costBasis: 177144, avgCost: 177144 };
  assert.equal(purchaseEffect(after, 1, 150000, 0).newAvgCost, 163572);
});

// Ejemplos oficiales de la documentación de Wompi (Web Checkout y Eventos).
test("la firma de integridad coincide con el ejemplo de Wompi", () => {
  assert.equal(
    integritySignature("sk8-438k4-xmxm392-sn2m", "2490000", "prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6"),
    "37c8407747e595535433ef8f6a811d853cd943046624a0ec04662b17bbf33bf5",
  );
});

test("la firma de un evento se valida como en el ejemplo de Wompi, y un cambio la invalida", () => {
  const secret = "prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z";
  const event = {
    event: "transaction.updated",
    data: { transaction: { id: "1234-1610641025-49201", amount_in_cents: 4490000, status: "APPROVED" } },
    signature: {
      properties: ["transaction.id", "transaction.status", "transaction.amount_in_cents"],
      // La documentación arma esta cadena en su ejemplo; el checksum que muestra al lado es
      // ilustrativo y no corresponde a ella, así que aquí se usa el SHA-256 real de la cadena
      // (en mayúsculas, como lo envía Wompi).
      checksum: createHash("sha256")
        .update("1234-1610641025-49201APPROVED44900001530291411prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z")
        .digest("hex")
        .toUpperCase(),
    },
    timestamp: 1530291411,
  };
  assert.equal(verifyEventSignature(event, secret), true);
  const tampered = { ...event, data: { transaction: { ...event.data.transaction, amount_in_cents: 100 } } };
  assert.equal(verifyEventSignature(tampered, secret), false);
  assert.equal(verifyEventSignature(event, "otro_secreto"), false);
  assert.equal(verifyEventSignature(event, ""), false);
});

test("la referencia de pago dice de qué pedido es", () => {
  assert.equal(orderIdFromReference(paymentReference(42)), 42);
  assert.equal(orderIdFromReference("ESM42"), null);
  assert.equal(orderIdFromReference("VEL42-abc1"), 42); // pago iniciado antes del cambio de nombre
  assert.equal(orderIdFromReference("otra-cosa"), null);
});

test("el descuento de un código se calcula por línea y se redondea al peso", () => {
  assert.equal(lineDiscount(2 * 215000, 10), 43000);
  assert.equal(lineDiscount(175005, 10), 17501); // ,5 sube, igual que round() en la base de datos
  assert.equal(normalizeCode("  verano10 "), "VERANO10");
  assert.equal(validCode("VERANO10"), true);
  assert.equal(validCode("AB"), false);
  assert.equal(validCode("CON ESPACIO"), false);
});

test("el envío se calcula por la zona del municipio (código DANE)", () => {
  assert.equal(cityOptions.length, 1122); // todos los municipios y áreas no municipalizadas del DANE
  assert.equal(findCity("05001")?.label, "Medellín, Antioquia");
  assert.equal(zoneOf("05001"), "medellin");
  assert.equal(zoneOf("05088"), "aburra"); // Bello
  assert.equal(zoneOf("05360"), "aburra"); // Itagüí
  assert.equal(zoneOf("05615"), "antioquia"); // Rionegro
  assert.equal(zoneOf("11001"), "nacional"); // Bogotá
  assert.equal(zoneOf("88001"), "remota"); // San Andrés
  const rates = { medellin: 8000, aburra: 10000, antioquia: 14000, nacional: 16000, remota: null };
  assert.equal(shippingFor("05266", rates), 10000); // Envigado
  assert.equal(shippingFor("91001", rates), null); // Leticia: se coordina
  assert.equal(shippingFor("99999", rates), null); // código que no existe
});
