// Pone el público (Hombre / Mujer / Unisex) de db/audiences.json en los perfumes que aún no lo tienen.
// Se aplica al producto del SKU y a todos sus tamaños.
import { readFileSync } from "node:fs";
import { connect } from "./db.mjs";

const audiences = JSON.parse(readFileSync("db/audiences.json", "utf8"));
const db = await connect();

let updated = 0;
for (const [sku, audience] of Object.entries(audiences)) {
  const result = await db.query(
    `update products set audience = $1, updated_at = now()
     where coalesce(parent_id, id) = (select coalesce(parent_id, id) from products where sku = $2)
       and audience is null`,
    [audience, sku],
  );
  updated += result.rowCount;
}

console.log(`Listo: ${updated} producto(s) recibieron público. Los que ya tenían no se tocaron.`);
await db.end();
