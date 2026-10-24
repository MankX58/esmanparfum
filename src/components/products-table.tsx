import Link from "next/link";
import { formatCOP, formatPercent } from "@/lib/format";

export type ProductRow = {
  id: number;
  sku: string;
  name: string;
  brand: string | null;
  audience: string | null;
  size_ml: number | null;
  list_price: number;
  is_active: boolean;
  stock: number;
  avg_cost: number;
  unit_profit: number;
  margin: number;
  inventory_value: number;
  alert: StockAlert;
  sizes?: number; // cuántos tamaños tiene su perfume (1 = no tiene otros)
};

export type StockAlert = "OK" | "PEDIR" | "AGOTADO";

// Mismas alertas del Excel. "Agotado" va en gris: en un negocio bajo pedido es lo normal.
const alerts: Record<StockAlert, { label: string; style: string }> = {
  OK: { label: "OK", style: "bg-ok-soft text-ok" },
  PEDIR: { label: "Pedir", style: "bg-warn-soft text-warn" },
  AGOTADO: { label: "Agotado", style: "bg-mist text-ink-soft" },
};

export function StockBadge({ alert }: { alert: StockAlert }) {
  return (
    <span
      className={`inline-block w-18 py-1 text-center text-[11px] leading-none font-medium tracking-[0.08em] uppercase ${alerts[alert].style}`}
    >
      {alerts[alert].label}
    </span>
  );
}

// Clases de celda compartidas por las tablas del panel.
export const cell = "px-3 sm:px-4";
export const th = `${cell} py-3 text-xs font-medium whitespace-nowrap text-ink-faint`;
export const numberCell = `${cell} py-4 text-right whitespace-nowrap tabular-nums`;
// En el teléfono solo cabe lo esencial: el resto aparece desde pantallas medianas o grandes.
export const fromMd = "hidden md:table-cell";
export const fromLg = "hidden lg:table-cell";
export const row = "transition-colors duration-(--duration-quick) ease-smooth-out hover:bg-paper";

export function ProductsTable({ products }: { products: ProductRow[] }) {
  return (
    <div className="overflow-x-auto border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line">
          <tr>
            <th className={th}>Producto</th>
            <th className={`${th} text-right`}>Precio</th>
            <th className={`${th} ${fromMd} text-right`}>Costo promedio</th>
            <th className={`${th} ${fromLg} text-right`}>Ganancia por unidad</th>
            <th className={`${th} ${fromMd} text-right`}>Margen</th>
            <th className={`${th} text-right`}>Stock</th>
            <th className={`${th} ${fromLg} text-right`}>Inventario a costo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {products.map((p) => (
            <tr key={p.id} className={row}>
              <td className={`${cell} py-4`}>
                <Link
                  href={`/admin/productos/${p.id}`}
                  className="font-medium py-2 underline decoration-transparent transition-colors duration-(--duration-quick) ease-smooth-out hover:decoration-ink"
                >
                  {p.name}
                </Link>
                {/* La "etiqueta" del producto: marca en mayúsculas espaciadas, como en la caja del perfume. */}
                <p className="mt-1 flex flex-wrap items-baseline gap-x-3 text-xs text-ink-faint tabular-nums">
                  {p.brand && <span className="font-display tracking-[0.14em] uppercase">{p.brand}</span>}
                  <span>{p.sku}</span>
                  {p.audience && <span className="hidden sm:inline">{p.audience}</span>}
                  {p.size_ml && <span>{p.size_ml} ml</span>}
                  {(p.sizes ?? 1) > 1 && <span className="text-brand">Uno de {p.sizes} tamaños</span>}
                  {!p.is_active && <span className="text-warn">Inactivo</span>}
                </p>
              </td>
              <td className={numberCell}>{formatCOP(p.list_price)}</td>
              <td className={`${numberCell} ${fromMd} text-ink-soft`}>{formatCOP(p.avg_cost)}</td>
              <td className={`${numberCell} ${fromLg} text-ink-soft`}>{formatCOP(p.unit_profit)}</td>
              <td className={`${numberCell} ${fromMd} text-ink-soft`}>{formatPercent(p.margin)}</td>
              <td className={numberCell}>
                <span className={`mr-3 ${p.stock > 0 ? "" : "text-ink-faint"}`}>{p.stock}</span>
                <StockBadge alert={p.alert} />
              </td>
              <td className={`${numberCell} ${fromLg} ${p.inventory_value > 0 ? "" : "text-ink-faint"}`}>
                {formatCOP(p.inventory_value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
