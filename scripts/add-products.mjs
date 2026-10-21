// Agrega a la tienda los perfumes de db/new-products.json, con su descripción de db/descriptions.json.
//   npm run db:productos
//
// Solo crea los SKU que aún no existen: los que ya están no se tocan, así que se puede
// ejecutar varias veces. Entran con stock 0; el stock llega al registrar la compra en el panel.
import { readFileSync } from "node:fs";
import { connect } from "./db.mjs";

const products = JSON.parse(readFileSync("db/new-products.json", "utf8"));
const descriptions = JSON.parse(readFileSync("db/descriptions.json", "utf8"));

// Igual que src/lib/slug.ts: "Rasasi Hawas Ice EDP" → "rasasi-hawas-ice-edp".
const slugify = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const db = await connect();
await db.query("begin");

try {
  const added = [];
  for (const p of products) {
    let slug = slugify(`${p.brand} ${p.name}`);
    const taken = await db.query("select 1 from products where slug = $1", [slug]);
    if (taken.rowCount > 0) slug += `-${p.sku.toLowerCase()}`;
    const result = await db.query(
      `insert into products
         (sku, slug, name, brand, audience, size_ml, description, initial_unit_cost, list_price)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       on conflict (sku) do nothing`,
      [p.sku, slug, p.name, p.brand, p.audience, p.size_ml, descriptions[p.sku] ?? null, p.unit_cost, p.list_price],
    );
    if (result.rowCount > 0) added.push(p.sku);
  }
  await db.query("commit");
  console.log(
    added.length > 0
      ? `Listo: ${added.length} producto(s) nuevo(s): ${added.join(", ")}.`
      : "No había productos nuevos: todos los SKU ya existían.",
  );
} catch (error) {
  await db.query("rollback");
  throw error;
} finally {
  await db.end();
}
