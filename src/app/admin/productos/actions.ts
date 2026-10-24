"use server";

import { del, put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { readForm, type FormState } from "@/lib/form";
import { noteLevels, parseNoteList, type Notes } from "@/lib/notes";
import { slugify } from "@/lib/slug";

const AUDIENCES = ["Hombre", "Mujer", "Unisex"];

// Códigos de PostgreSQL: 23505 = valor repetido, 23503 = otro registro depende de este.
const dbError = (error: unknown) => error as { code?: string; constraint?: string };

// Crea un producto (id = null) o actualiza uno existente.
export async function saveProduct(id: number | null, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const form = readForm(formData);
  const sku = (form.text("sku", { required: true, max: 20 }) ?? "").toUpperCase();
  const name = form.text("name", { required: true, max: 120 }) ?? "";
  const brand = form.text("brand", { max: 60 });
  const audience = form.oneOf("audience", AUDIENCES);
  const sizeMl = form.integer("size_ml", { min: 1, max: 5000 });
  const category = form.text("category", { max: 60 });
  const description = form.text("description", { max: 2000 });
  // Notas olfativas: una lista separada por comas por nivel. Vacías todas = sin notas.
  const notes: Notes = {};
  for (const level of noteLevels) {
    const list = parseNoteList(form.text(`notes_${level.key}`, { max: 800 }) ?? "");
    if (list.length > 0) notes[level.key] = list;
  }
  const notesSource = form.text("notes_source", { max: 300 });
  if (notesSource?.startsWith("https://") && Object.keys(notes).length > 0) notes.source = notesSource;
  const notesJson = Object.keys(notes).length > 0 ? JSON.stringify(notes) : null;
  const listPrice = form.money("list_price", { required: true }) ?? 0;
  const initialStock = form.integer("initial_stock") ?? 0;
  const initialUnitCost = form.money("initial_unit_cost") ?? 0;
  const reorderPoint = form.integer("reorder_point") ?? 0;
  const isActive = form.checkbox("is_active");
  if (form.hasErrors()) return { errors: form.errors };

  try {
    if (id === null) {
      // La dirección del producto (slug) se decide al crearlo y ya no cambia: así los enlaces
      // compartidos y lo que Google tenga guardado siguen funcionando aunque se corrija el nombre.
      let slug = slugify(`${brand ?? ""} ${name}`);
      const taken = await sql`select 1 from products where slug = ${slug}`;
      if (taken.length > 0) slug = `${slug}-${slugify(sku)}`;

      const rows = await sql`
        insert into products
          (sku, slug, name, brand, audience, size_ml, category, description, notes,
           list_price, initial_stock, initial_unit_cost, reorder_point, is_active)
        values
          (${sku}, ${slug}, ${name}, ${brand}, ${audience}, ${sizeMl}, ${category}, ${description}, ${notesJson}::jsonb,
           ${listPrice}, ${initialStock}, ${initialUnitCost}, ${reorderPoint}, ${isActive})
        returning id`;
      id = rows[0].id as number;
    } else {
      await sql`
        update products set
          sku = ${sku}, name = ${name}, brand = ${brand}, audience = ${audience},
          size_ml = ${sizeMl}, category = ${category}, description = ${description}, notes = ${notesJson}::jsonb,
          list_price = ${listPrice}, initial_stock = ${initialStock}, initial_unit_cost = ${initialUnitCost},
          reorder_point = ${reorderPoint}, is_active = ${isActive}, updated_at = now()
        where id = ${id}`;
      // El perfume es uno solo aunque venga en varios tamaños: lo que lo describe
      // se copia a sus otros tamaños. Precio, stock, SKU y fotos son de cada uno.
      await sql`
        update products set
          name = ${name}, brand = ${brand}, audience = ${audience},
          category = ${category}, description = ${description}, notes = ${notesJson}::jsonb, updated_at = now()
        where id <> ${id}
          and coalesce(parent_id, id) = (select coalesce(parent_id, id) from products where id = ${id})`;
    }
  } catch (error) {
    if (dbError(error).code === "23505") {
      return dbError(error).constraint === "products_sku_key"
        ? { errors: { sku: "Ya existe un producto con ese SKU." } }
        : { message: "Ya existe un producto con la misma marca y nombre." };
    }
    throw error;
  }

  revalidatePath("/admin", "layout");
  return { ok: true, id };
}

// ---------- Tamaños de presentación ----------

// El siguiente SKU con el formato del Excel: P025 → P026.
export async function suggestSku() {
  await requireAdmin();
  const [last] = await sql`
    select max(substring(sku from 2)::int) as number from products where sku ~ '^P[0-9]+$'`;
  return `P${String((last.number ?? 0) + 1).padStart(3, "0")}`;
}

// Agrega otro tamaño a un perfume. El tamaño nuevo es un producto aparte (con su SKU, precio,
// stock y costo) que copia del original lo que describe al perfume y sus fotos.
// Los campos se llaman new_* para no chocar con los del formulario del producto, que está en la misma página.
export async function addSize(productId: number, formData: FormData): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(productId)) return { message: "Producto no válido." };

  const form = readForm(formData);
  const sizeMl = form.integer("new_size_ml", { required: true, min: 1, max: 5000 });
  const listPrice = form.money("new_price", { required: true });
  const sku = (form.text("new_sku", { required: true, max: 20 }) ?? "").toUpperCase();
  if (form.hasErrors()) return { errors: form.errors };

  const [source] = await sql`
    select coalesce(parent_id, id) as group_id, name, brand from products where id = ${productId}`;
  if (!source) return { message: "El producto ya no existe." };

  const repeated = await sql`
    select 1 from products where coalesce(parent_id, id) = ${source.group_id} and size_ml = ${sizeMl}`;
  if (repeated.length > 0) return { errors: { new_size_ml: "Este perfume ya tiene ese tamaño." } };

  let slug = slugify(`${source.brand ?? ""} ${source.name} ${sizeMl} ml`);
  const taken = await sql`select 1 from products where slug = ${slug}`;
  if (taken.length > 0) slug = `${slug}-${slugify(sku)}`;

  try {
    // parent_id apunta siempre al producto original, nunca a otro tamaño.
    await sql`
      insert into products
        (sku, slug, name, brand, audience, size_ml, category, description, notes, images,
         list_price, reorder_point, is_active, parent_id)
      select ${sku}, ${slug}, name, brand, audience, ${sizeMl}, category, description, notes, images,
             ${listPrice}, reorder_point, is_active, ${source.group_id}
      from products where id = ${productId}`;
  } catch (error) {
    if (dbError(error).code === "23505") return { errors: { new_sku: "Ya existe un producto con ese SKU." } };
    throw error;
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// Cambia solo el precio de un producto: sirve para ajustar el de cada tamaño sin abrirlo.
export async function setPrice(productId: number, formData: FormData): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(productId)) return { message: "Producto no válido." };

  const form = readForm(formData);
  const listPrice = form.money("price", { required: true });
  if (form.hasErrors()) return { errors: form.errors };

  await sql`update products set list_price = ${listPrice}, updated_at = now() where id = ${productId}`;

  revalidatePath("/", "layout");
  return { ok: true };
}

// ---------- Fotos del producto (Vercel Blob) ----------

const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 1_500_000; // la foto llega ya reducida por el navegador: 1,5 MB es de sobra

// Vercel conecta el almacén al proyecto con BLOB_STORE_ID (lo normal hoy) o con un
// BLOB_READ_WRITE_TOKEN (almacenes antiguos, o para usarlo en tu computador).
const blobConnected = () => Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);

// Sube una foto y la agrega al final de las fotos del producto. El navegador ya la
// convirtió a JPEG y la redujo (ver shrink-image.ts), pero aquí se vuelve a comprobar todo.
export async function addProductImage(productId: number, formData: FormData): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(productId)) return { message: "Producto no válido." };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { message: "No llegó ninguna imagen." };
  if (file.size > MAX_IMAGE_BYTES) return { message: "La foto pesa demasiado. Prueba con otra." };
  // Un JPEG de verdad empieza siempre por estos tres bytes; el nombre o el tipo declarado no bastan.
  const start = new Uint8Array(await file.slice(0, 3).arrayBuffer());
  if (start[0] !== 0xff || start[1] !== 0xd8 || start[2] !== 0xff) return { message: "El archivo no es una imagen válida." };

  const [product] = await sql`select sku, cardinality(images) as count from products where id = ${productId}`;
  if (!product) return { message: "El producto ya no existe." };
  if (product.count >= MAX_IMAGES) return { message: `Un producto puede tener hasta ${MAX_IMAGES} fotos. Quita alguna primero.` };
  if (!blobConnected()) {
    return { message: "Falta conectar el almacenamiento de fotos (Vercel Blob). Los pasos están en el README." };
  }

  let url: string;
  try {
    // addRandomSuffix: cada foto recibe un nombre único, así ninguna pisa a otra.
    const blob = await put(`productos/${String(product.sku).toLowerCase()}.jpg`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/jpeg",
    });
    url = blob.url;
  } catch (error) {
    // Lo más común: el almacén se creó como privado. Las fotos de la tienda necesitan uno público.
    console.error(error);
    return { message: "Vercel Blob rechazó la foto. Revisa que el almacén sea público (Public), no privado." };
  }
  await sql`update products set images = array_append(images, ${url}), updated_at = now() where id = ${productId}`;

  revalidatePath("/", "layout");
  return { ok: true };
}

// Quita una foto del producto. Si estaba en Vercel Blob, también borra el archivo.
export async function removeProductImage(productId: number, url: string): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(productId) || typeof url !== "string") return { message: "Foto no válida." };

  // El "where" comprueba que la foto es de este producto: así no se puede pedir que se borre un archivo ajeno.
  const removed = await sql`
    update products set images = array_remove(images, ${url}), updated_at = now()
    where id = ${productId} and ${url} = any(images)
    returning id`;
  if (removed.length === 0) return { message: "Esa foto ya no está en el producto." };

  // Las fotos de la carpeta public (npm run db:fotos) no están en Blob: solo se desvinculan.
  // Un tamaño nuevo copia las fotos del original: el archivo se borra cuando ya nadie lo usa.
  const stillUsed = await sql`select 1 from products where ${url} = any(images) limit 1`;
  if (stillUsed.length === 0 && url.startsWith("https://") && blobConnected()) await del(url);

  revalidatePath("/", "layout");
  return { ok: true };
}

// Pone una foto de primera: es la que se ve en el catálogo y al abrir el producto.
export async function setMainImage(productId: number, url: string): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(productId) || typeof url !== "string") return { message: "Foto no válida." };

  const moved = await sql`
    update products set images = array_prepend(${url}, array_remove(images, ${url})), updated_at = now()
    where id = ${productId} and ${url} = any(images)
    returning id`;
  if (moved.length === 0) return { message: "Esa foto ya no está en el producto." };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteProduct(id: number): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(id)) return { message: "Producto no válido." };

  try {
    await sql`delete from products where id = ${id}`;
  } catch (error) {
    if (dbError(error).code === "23503") {
      return { message: "Este producto tiene compras, ventas u otros tamaños registrados. Desactívalo en lugar de eliminarlo." };
    }
    throw error;
  }

  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ---------- Unir y separar tamaños ----------

// Une otro producto que ya existe (con todos sus tamaños, si tiene) como tamaño de este perfume.
// Desde ahí la tienda los muestra como un solo perfume con selector de tamaño. Lo que describe al
// perfume (nombre, marca, público, categoría y descripción) pasa a ser el de este producto; cada
// tamaño conserva su SKU, precio, stock, costo y fotos.
export async function joinSizes(productId: number, otherId: number): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(productId) || !Number.isInteger(otherId) || productId === otherId) return { message: "Producto no válido." };

  const [base] = await sql`select coalesce(parent_id, id) as root from products where id = ${productId}`;
  const [other] = await sql`select coalesce(parent_id, id) as root from products where id = ${otherId}`;
  if (!base || !other) return { message: "El producto ya no existe." };
  if (base.root === other.root) return { message: "Ese producto ya es un tamaño de este perfume." };

  // Dos productos con el mismo tamaño no pueden ser el mismo perfume.
  const [clash] = await sql`
    select size_ml from products
    where coalesce(parent_id, id) = ${other.root} and size_ml is not null
      and size_ml in (select size_ml from products where coalesce(parent_id, id) = ${base.root} and size_ml is not null)
    limit 1`;
  if (clash) return { message: `Este perfume ya tiene un tamaño de ${clash.size_ml} ml. Cambia el tamaño de uno de los dos antes de unirlos.` };

  await sql.transaction([
    // Todo el grupo del otro producto pasa a colgar del producto original de este perfume.
    sql`update products set parent_id = ${base.root}, updated_at = now() where coalesce(parent_id, id) = ${other.root}`,
    // Lo que describe al perfume queda igual en todos sus tamaños. Si este no tenía descripción, se usa la de otro tamaño.
    sql`
      update products set
        name = r.name, brand = r.brand,
        audience = coalesce(r.audience, products.audience), category = coalesce(r.category, products.category),
        description = coalesce(r.description, (
          select d.description from products d
          where coalesce(d.parent_id, d.id) = ${base.root} and d.description is not null
          order by d.id limit 1)),
        notes = coalesce(r.notes, (
          select d.notes from products d
          where coalesce(d.parent_id, d.id) = ${base.root} and d.notes is not null
          order by d.id limit 1)),
        updated_at = now()
      from (select name, brand, audience, category, description, notes from products where id = ${base.root}) r
      where coalesce(products.parent_id, products.id) = ${base.root}`,
  ]);

  revalidatePath("/", "layout");
  return { ok: true };
}

// Separa un tamaño: vuelve a ser un perfume aparte en la tienda. Si es el producto original del
// perfume, el siguiente tamaño toma su lugar como original.
export async function leaveSizes(productId: number): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(productId)) return { message: "Producto no válido." };

  const [product] = await sql`select parent_id from products where id = ${productId}`;
  if (!product) return { message: "El producto ya no existe." };

  if (product.parent_id !== null) {
    await sql`update products set parent_id = null, updated_at = now() where id = ${productId}`;
  } else {
    const [next] = await sql`select min(id) as id from products where parent_id = ${productId}`;
    if (!next?.id) return { message: "Este perfume no tiene otros tamaños." };
    await sql.transaction([
      sql`update products set parent_id = null, updated_at = now() where id = ${next.id}`,
      sql`update products set parent_id = ${next.id}, updated_at = now() where parent_id = ${productId}`,
    ]);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
