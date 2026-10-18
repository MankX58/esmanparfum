"use client";

import Link from "next/link";
import { sileo } from "sileo";
import { buttonStyles, linkStyles } from "@/components/button";
import { Field, fieldProps, inputStyles } from "@/components/field";
import { formatCOP } from "@/lib/format";
import { useServerForm } from "@/lib/use-server-form";
import { addSize, setPrice } from "./actions";

export type SizeRow = {
  id: number;
  sku: string;
  size_ml: number | null;
  list_price: number;
  stock: number;
  is_active: boolean;
};

const input = `${inputStyles} h-11`;
const sizeLabel = (size: SizeRow) => (size.size_ml ? `${size.size_ml} ml` : "Sin tamaño");

// Tamaños de presentación de un perfume: la lista con el precio de cada uno y el formulario
// para agregar otro. `productId` es el producto que se está editando en esta página.
export function ProductSizes({ productId, sizes, suggestedSku }: { productId: number; sizes: SizeRow[]; suggestedSku: string }) {
  return (
    <section aria-labelledby="tamanos" className="flex flex-col gap-6">
      <div>
        <h2 id="tamanos" className="font-display text-xl">
          Tamaños de presentación
        </h2>
        <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
          Cada tamaño es un producto con su propio SKU, precio, stock y costo. En la tienda se ven como un solo perfume
          con un selector de tamaño. El nombre, la marca, el público, la categoría y la descripción se comparten: al
          cambiarlos en uno, cambian en todos.
        </p>
      </div>

      <ul className="border-b border-line">
        {sizes.map((size) => (
          <li key={size.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line py-4 motion-safe:animate-settle">
            <div className="min-w-40">
              <p className="font-medium tabular-nums">{sizeLabel(size)}</p>
              <p className="mt-1 text-xs text-ink-faint">
                {size.sku}, {size.stock} en stock{size.is_active ? "" : ", inactivo"}
              </p>
            </div>
            {size.id === productId ? (
              // El precio de este se cambia en el formulario de arriba: un solo lugar por dato.
              <p className="text-sm text-ink-soft">
                <span className="mr-3 font-medium text-ink tabular-nums">{formatCOP(size.list_price)}</span>
                Es el que estás editando
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                {/* key: si el precio cambia por otro lado, el campo vuelve a mostrar el guardado. */}
                <PriceForm key={size.list_price} size={size} />
                <Link href={`/admin/productos/${size.id}`} className={`text-sm ${linkStyles.default}`}>
                  Abrir
                </Link>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* key: al agregar un tamaño cambia el SKU sugerido y el formulario empieza limpio. */}
      <AddSizeForm key={suggestedSku} productId={productId} suggestedSku={suggestedSku} />
    </section>
  );
}

// Precio de un tamaño, editable en la misma fila.
function PriceForm({ size }: { size: SizeRow }) {
  const { state, pending, busy, handleSubmit } = useServerForm(setPrice.bind(null, size.id), () => {
    sileo.success({ title: "Precio guardado", description: sizeLabel(size) });
  });
  const error = state.errors?.price ?? state.message;
  const id = `price-${size.id}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          id={id}
          name="price"
          aria-label={`Precio de ${sizeLabel(size)}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          inputMode="numeric"
          defaultValue={size.list_price}
          className={`${input} w-32 tabular-nums`}
        />
        <button type="submit" disabled={busy} className={buttonStyles.secondary}>
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}

function AddSizeForm({ productId, suggestedSku }: { productId: number; suggestedSku: string }) {
  const { state, pending, busy, handleSubmit } = useServerForm(addSize.bind(null, productId), () => {
    sileo.success({ title: "Tamaño agregado", description: "Ábrelo para ponerle stock, costo o sus propias fotos." });
  });
  const errors = state.errors ?? {};

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <h3 className="font-medium">Agregar un tamaño</h3>
      {state.message && (
        <p role="alert" className="border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      )}
      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Tamaño (ml)" name="new_size_ml" error={errors.new_size_ml}>
          <input {...fieldProps("new_size_ml", errors.new_size_ml)} inputMode="numeric" className={input} />
        </Field>
        <Field label="Precio de lista" name="new_price" error={errors.new_price} hint="En pesos, sin decimales.">
          <input {...fieldProps("new_price", errors.new_price)} inputMode="numeric" className={input} />
        </Field>
        <Field label="SKU" name="new_sku" error={errors.new_sku} hint="Código corto y único.">
          <input {...fieldProps("new_sku", errors.new_sku)} defaultValue={suggestedSku} className={input} />
        </Field>
      </div>
      <button type="submit" disabled={busy} className={`self-start ${buttonStyles.secondary}`}>
        {pending ? "Agregando…" : "Agregar tamaño"}
      </button>
    </form>
  );
}
