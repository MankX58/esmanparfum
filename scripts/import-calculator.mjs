// Agrega a la tienda los perfumes nuevos de la calculadora de margen (Excel, hoja "Calculadora").
//
//   npm run db:calculadora -- "<ruta del .xlsx>"            solo muestra qué haría
//   npm run db:calculadora -- "<ruta del .xlsx>" --guardar  agrega los productos nuevos
//
// Solo agrega los perfumes que todavía no existen en la tienda, con su marca, nombre, tamaño, costo
// (como costo unitario inicial, sin flete) y precio de venta. No cambia los que ya existen: si en
// el Excel tienen otro precio, costo o tamaño, solo lo avisa, para que lo corrijas en el panel.
// Los productos nuevos quedan activos, sin stock (se venden bajo pedido), sin fotos ni descripción.
// Un perfume "ya existe" si la tienda tiene su SKU con el mismo nombre, o el mismo nombre con otro
// SKU (así no se duplica). Si el SKU está ocupado por otro perfume, no se agrega y se avisa.
import { readSheet } from "read-excel-file/node";
import { connect } from "./db.mjs";

const file = process.argv[2];
const save = process.argv.includes("--guardar");
if (!file || file.startsWith("--")) throw new Error('Falta la ruta del Excel. Ejemplo: npm run db:calculadora -- "C:/ruta/Calculadora.xlsx"');

// Igual que src/lib/slug.ts: "Rasasi Hawas Ice EDP" → "rasasi-hawas-ice-edp".
const slugify = (text) =>
  text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const clean = (value) => (typeof value === "string" ? value.trim() : value);
// Para comparar nombres: sin tildes ni mayúsculas, y sin la marca repetida al inicio del nombre
// ("Versace" + "Versace Eros Energy EDP" es lo mismo que "Versace" + "Eros Energy EDP").
function nameKey(brand, name) {
  const b = (brand ?? "").trim();
  const n = b && name.toLowerCase().startsWith(b.toLowerCase()) ? name.slice(b.length) : name;
  return slugify(`${b} ${n}`);
}
const peso = (n) => `$${Math.round(n).toLocaleString("es-CO")}`;

// La fila de títulos es la que empieza por "SKU"; las de abajo son los productos.
const rows = await readSheet(file, "Calculadora");
const header = rows.findIndex((row) => row[0] === "SKU");
if (header === -1) throw new Error('No encontré la fila de títulos ("SKU") en la hoja Calculadora.');
const products = rows
  .slice(header + 1)
  .map(([sku, brand, name, size, cost, , , , price]) => ({
    sku: clean(sku),
    brand: clean(brand) || null,
    name: clean(name),
    size: Number.isInteger(size) && size > 0 ? size : null,
    cost: Math.round(Number(cost)),
    price: Math.round(Number(price)),
  }))
  // Solo filas completas: con SKU, nombre, costo y precio.
  .filter((p) => /^P\d+$/.test(p.sku ?? "") && p.name && p.cost > 0 && p.price > 0);

const db = await connect();
const { rows: existing } = await db.query("select sku, brand, name, size_ml, initial_unit_cost, list_price from products");
const bySku = new Map(existing.map((p) => [p.sku, p]));
// Clave de nombre + tamaño: el mismo perfume en otro tamaño es otro producto.
const keyOf = (brand, name, size) => `${nameKey(brand, name)}|${size ?? ""}`;
const byName = new Map(existing.map((p) => [keyOf(p.brand, p.name, p.size_ml), p]));

const sameSku = [];
const elsewhere = []; // el perfume ya está en la tienda con otro SKU
const occupied = []; // el SKU del Excel lo tiene otro perfume en la tienda
const toAdd = [];
for (const p of products) {
  const saved = bySku.get(p.sku);
  const twin = byName.get(keyOf(p.brand, p.name, p.size));
  // Mismo SKU y mismo perfume: el nombre coincide, o coinciden costo y precio (nombre escrito distinto).
  const samePerfume =
    saved && (nameKey(saved.brand, saved.name) === nameKey(p.brand, p.name) || (saved.initial_unit_cost === p.cost && saved.list_price === p.price));
  if (samePerfume) sameSku.push(p);
  else if (twin) elsewhere.push({ ...p, storeSku: twin.sku });
  else if (saved) occupied.push({ ...p, storeName: [saved.brand, saved.name].filter(Boolean).join(" ") });
  else toAdd.push(p);
}
const changed = sameSku
  .map((p) => {
    const saved = bySku.get(p.sku);
    const notes = [];
    if (saved.list_price !== p.price) notes.push(`precio ${peso(saved.list_price)} → ${peso(p.price)}`);
    if (saved.initial_unit_cost !== p.cost) notes.push(`costo ${peso(saved.initial_unit_cost)} → ${peso(p.cost)}`);
    if ((saved.size_ml ?? null) !== p.size) notes.push(`tamaño ${saved.size_ml ?? "vacío"} → ${p.size ?? "vacío"} ml`);
    if (nameKey(saved.brand, saved.name) !== nameKey(p.brand, p.name)) notes.push(`nombre "${saved.name}" → "${p.name}"`);
    return { sku: p.sku, notes };
  })
  .filter((p) => p.notes.length > 0);

// Nombres repetidos en el Excel (misma marca y nombre): suele ser un error de copiar y pegar.
const seen = new Map();
for (const p of products) {
  const key = `${p.brand} ${p.name}`.toLowerCase();
  seen.set(key, [...(seen.get(key) ?? []), p.sku]);
}
const repeated = [...seen.values()].filter((skus) => skus.length > 1);

console.log(`En el Excel: ${products.length} productos. Nuevos para la tienda: ${toAdd.length}.\n`);
for (const p of toAdd) {
  console.log(`  + ${p.sku}  ${[p.brand, p.name].filter(Boolean).join(" ")}${p.size ? `, ${p.size} ml` : ""}  costo ${peso(p.cost)}  precio ${peso(p.price)}`);
}
if (changed.length > 0) {
  console.log("\nYa existen con otros datos en el Excel (no se cambian; corrígelos en el panel si quieres):");
  for (const p of changed) console.log(`  ! ${p.sku}: ${p.notes.join(", ")}`);
}
if (elsewhere.length > 0) {
  console.log("\nYa están en la tienda con otro SKU (no se agregan para no duplicarlos):");
  for (const p of elsewhere) console.log(`  = ${p.sku} en el Excel es ${p.storeSku} en la tienda: ${p.name}`);
}
if (occupied.length > 0) {
  console.log("\nSKU ocupado en la tienda por otro perfume (no se agregan; cambia el SKU en el Excel o en el panel):");
  for (const p of occupied) console.log(`  × ${p.sku}: en el Excel es "${p.name}", en la tienda es "${p.storeName}"`);
}
if (repeated.length > 0) {
  console.log("\nMismo nombre en varias filas (revisa si es un error o un tamaño distinto):");
  for (const skus of repeated) console.log(`  ? ${skus.join(", ")}`);
}

if (save && toAdd.length > 0) {
  await db.query("begin");
  try {
    for (const p of toAdd) {
      let slug = slugify(`${p.brand ?? ""} ${p.name}`);
      const { rows: taken } = await db.query("select 1 from products where slug = $1", [slug]);
      if (taken.length > 0) slug = `${slug}-${slugify(p.sku)}`;
      await db.query(
        `insert into products (sku, slug, name, brand, size_ml, list_price, initial_unit_cost, is_active)
         values ($1, $2, $3, $4, $5, $6, $7, true)`,
        [p.sku, slug, p.name, p.brand, p.size, p.price, p.cost],
      );
    }
    await db.query("commit");
    console.log(`\nListo: ${toAdd.length} producto(s) agregado(s) a la tienda.`);
  } catch (error) {
    await db.query("rollback");
    throw error;
  }
} else if (!save) {
  console.log('\nNo se guardó nada. Para agregarlos: agrega --guardar al final del comando.');
}
await db.end();
