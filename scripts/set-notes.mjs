// Pone las notas olfativas de db/notes.json (tomadas de Fragrantica) en los productos.
//   npm run db:notas             solo en los perfumes que aún no tienen notas
//   npm run db:notas -- --todas  en todos, reemplazando lo que haya (también lo escrito en el panel)
// Las notas son del perfume: se ponen en el producto del SKU y en todos sus tamaños.
import { readFileSync } from "node:fs";
import { connect } from "./db.mjs";

const all = process.argv.includes("--todas");
const notes = JSON.parse(readFileSync("db/notes.json", "utf8"));
const db = await connect();

let updated = 0;
for (const [sku, value] of Object.entries(notes)) {
  const result = await db.query(
    `update products set notes = $1::jsonb, updated_at = now()
     where coalesce(parent_id, id) = (select coalesce(parent_id, id) from products where sku = $2)
       and ($3 or notes is null)`,
    [JSON.stringify(value), sku, all],
  );
  updated += result.rowCount;
}

console.log(
  all
    ? `Listo: ${updated} producto(s) con las notas reemplazadas.`
    : `Listo: ${updated} producto(s) recibieron notas. Los que ya tenían no se tocaron.`,
);
await db.end();
