import { cache } from "react";
import { sql } from "./db";
import type { Notes } from "./notes";

// Consultas de la tienda pública. Solo devuelven productos activos y solo los datos
// que un cliente puede ver: nunca costos ni márgenes.

export type StoreProduct = {
  id: number;
  slug: string;
  name: string;
  brand: string | null;
  audience: string | null;
  size_ml: number | null;
  category: string | null;
  description: string | null;
  list_price: number;
  images: string[]; // fotos del producto; vacío = se muestra la etiqueta
  in_stock: boolean; // false = se vende bajo pedido
  group_id: number; // igual en todos los tamaños de un mismo perfume
  sizes?: number; // solo en las listas: cuántos tamaños tiene el perfume
  notes?: Notes | null; // solo en la página del producto: notas olfativas
};

// Un tamaño de un perfume, para el selector de la página del producto.
export type ProductSize = { id: number; slug: string; size_ml: number | null; list_price: number; in_stock: boolean };

export const sortOptions = [
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
  { value: "nombre", label: "Nombre" },
];

// Lista de productos con búsqueda, filtros y orden. Sin `orden`, salen primero los más vendidos.
// Un perfume con varios tamaños sale UNA sola vez: lo representa su tamaño más barato
// ("distinct on"), y lo vendido y el stock se suman entre todos sus tamaños (ventana "g").
// Con `tamano` (en ml) solo cuentan los perfumes que vienen en ese tamaño, y la tarjeta muestra ese.
export async function listProducts({ q = "", marca = "", publico = "", orden = "", tamano = 0, limit = 200 } = {}) {
  const like = `%${q}%`;
  return (await sql`
    select id, slug, name, brand, audience, size_ml, category, description, list_price, images, in_stock, group_id, sizes
    from (
      select distinct on (coalesce(p.parent_id, p.id))
             p.id, p.slug, p.name, p.brand, p.audience, p.size_ml, p.category, p.description, p.list_price, p.images,
             coalesce(p.parent_id, p.id) as group_id,
             (count(*) over g)::int as sizes,
             (sum(s.stock) over g) > 0 as in_stock,
             sum(s.units_sold) over g as units_sold,
             sum(s.stock) over g as stock
      from products p
      join product_stats s on s.product_id = p.id
      where p.is_active
        and (${q} = '' or p.name ilike ${like} or p.brand ilike ${like})
        and (${marca} = '' or p.brand = ${marca})
        and (${publico} = '' or p.audience = ${publico})
        and (${tamano}::int = 0 or p.size_ml = ${tamano}::int)
      window g as (partition by coalesce(p.parent_id, p.id))
      order by coalesce(p.parent_id, p.id), p.list_price asc, p.id asc
    ) perfume
    order by
      case when ${orden} = 'precio-asc' then list_price end asc,
      case when ${orden} = 'precio-desc' then list_price end desc,
      case when ${orden} = 'nombre' then name end asc,
      units_sold desc, stock desc, name asc
    limit ${limit}`) as StoreProduct[];
}

// cache(): si se pide el mismo producto dos veces en una visita (título y página), se consulta una sola.
export const getProduct = cache(async (slug: string) => {
  const rows = (await sql`
    select p.id, p.slug, p.name, p.brand, p.audience, p.size_ml, p.category, p.description, p.list_price, p.images, p.notes,
           s.stock > 0 as in_stock, coalesce(p.parent_id, p.id) as group_id
    from products p
    join product_stats s on s.product_id = p.id
    where p.is_active and p.slug = ${slug}`) as StoreProduct[];
  return rows[0];
});

// Los tamaños activos de un perfume, del más pequeño al más grande.
export async function listSizes(groupId: number) {
  return (await sql`
    select p.id, p.slug, p.size_ml, p.list_price, s.stock > 0 as in_stock
    from products p
    join product_stats s on s.product_id = p.id
    where p.is_active and coalesce(p.parent_id, p.id) = ${groupId}
    order by p.size_ml asc nulls last, p.id asc`) as ProductSize[];
}

// Productos por id, para mostrar el carrito con precios actuales.
export async function getProductsById(ids: number[]) {
  return (await sql`
    select p.id, p.slug, p.name, p.brand, p.audience, p.size_ml, p.category, p.description, p.list_price, p.images,
           s.stock > 0 as in_stock, coalesce(p.parent_id, p.id) as group_id
    from products p
    join product_stats s on s.product_id = p.id
    where p.is_active and p.id = any(${ids})`) as StoreProduct[];
}

// Los tamaños (en ml) en que hay perfumes activos, para el filtro del catálogo.
export async function listSizeOptions() {
  const rows = await sql`select distinct size_ml from products where is_active and size_ml is not null order by size_ml`;
  return rows.map((row) => row.size_ml as number);
}

export async function listBrands() {
  const rows = await sql`select brand from products where is_active and brand is not null group by brand order by brand`;
  return rows.map((row) => row.brand as string);
}

// Dirección del catálogo filtrado por una marca. Para los buscadores es la página de esa marca.
export const brandPath = (brand: string) => `/catalogo?marca=${encodeURIComponent(brand)}`;

// Cuántos productos hay para cada público: [{ audience: "Hombre", count: 20 }, ...]
export async function countByAudience() {
  return (await sql`
    select audience, count(*)::int as count
    from products
    where is_active and audience is not null
    group by audience
    order by count desc`) as { audience: string; count: number }[];
}
