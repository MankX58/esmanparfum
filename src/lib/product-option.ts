import type { SearchOption } from "@/components/search-select";

// Cómo se nombra un perfume en las listas con buscador: "P007 · Armaf Club de Nuit Intense man EDT, 105 ml".
// Lleva marca y SKU para poder buscar por cualquiera de los dos. Vive aparte de search-select (que es
// de cliente) para que también la puedan llamar las páginas del servidor.
export function productOption(p: { id: number; sku: string; brand: string | null; name: string; size_ml: number | null }, hint?: string): SearchOption {
  const name = [p.brand, p.name].filter(Boolean).join(" ") + (p.size_ml ? `, ${p.size_ml} ml` : "");
  return { value: String(p.id), label: `${p.sku} · ${name}`, hint };
}
