"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { sileo } from "sileo";
import { buttonStyles, linkStyles } from "@/components/button";
import { ConfirmButton } from "@/components/confirm-button";
import { Field, fieldProps, inputStyles } from "@/components/field";
import { SearchSelect, type SearchOption } from "@/components/search-select";
import { formatCOP } from "@/lib/format";
import { useServerForm } from "@/lib/use-server-form";
import { addSize, joinSizes, leaveSizes, setPrice } from "./actions";

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

// Tamaños de presentación de un perfume: la lista con el precio de cada uno, el formulario para
// agregar un tamaño nuevo y el buscador para unir un producto que ya existe (por ejemplo, el mismo
// perfume que se creó aparte en otro tamaño). `productId` es el producto que se está editando.
// `candidates`: los demás productos, para unirlos como tamaño de este.
export function ProductSizes({
  productId,
  sizes,
  suggestedSku,
  candidates,
}: {
  productId: number;
  sizes: SizeRow[];
  suggestedSku: string;
  candidates: SearchOption[];
}) {
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
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
                <p>
                  <span className="mr-3 font-medium text-ink tabular-nums">{formatCOP(size.list_price)}</span>
                  Es el que estás editando
                </p>
                {sizes.length > 1 && <SeparateButton size={size} />}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                {/* key: si el precio cambia por otro lado, el campo vuelve a mostrar el guardado. */}
                <PriceForm key={size.list_price} size={size} />
                <Link href={`/admin/productos/${size.id}`} className={`text-sm ${linkStyles.default}`}>
                  Abrir
                </Link>
                <SeparateButton size={size} />
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* key: al agregar un tamaño cambia el SKU sugerido y el formulario empieza limpio. */}
      <AddSizeForm key={suggestedSku} productId={productId} suggestedSku={suggestedSku} />
      {/* key: tras unir uno, la lista de candidatos cambia y el buscador empieza vacío. */}
      <JoinSizeForm key={candidates.length} productId={productId} candidates={candidates} />
    </section>
  );
}

// Separa un tamaño del perfume: vuelve a verse como un perfume aparte en la tienda.
function SeparateButton({ size }: { size: SizeRow }) {
  return (
    <ConfirmButton
      action={leaveSizes.bind(null, size.id)}
      label="Separar"
      question={`¿Separar el de ${sizeLabel(size)}? Se verá como otro perfume.`}
      confirmLabel="Sí, separar"
      successMessage="Tamaño separado"
      failureTitle="No se pudo separar"
      danger={false}
    />
  );
}

// Une un producto que ya existe como otro tamaño de este perfume.
function JoinSizeForm({ productId, candidates }: { productId: number; candidates: SearchOption[] }) {
  const [otherId, setOtherId] = useState("");
  const [pending, startTransition] = useTransition();

  function join() {
    if (!otherId) return;
    startTransition(async () => {
      const result = await joinSizes(productId, Number(otherId));
      if (result.ok) {
        sileo.success({ title: "Tamaño unido", description: "En la tienda ya se ven como un solo perfume." });
        setOtherId("");
      } else {
        sileo.error({ title: "No se pudo unir", description: result.message });
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-6">
      <h3 className="font-medium">Unir un producto que ya existe</h3>
      <p className="max-w-[60ch] text-sm leading-relaxed text-ink-soft">
        Si este perfume ya estaba creado aparte en otro tamaño, búscalo aquí y únelo. Conserva su SKU, precio, stock, costo y
        fotos; el nombre, la marca y la descripción pasan a ser los de este perfume.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <label htmlFor={`join-${productId}`} className="sr-only">
            Producto para unir
          </label>
          <SearchSelect
            id={`join-${productId}`}
            options={candidates}
            value={otherId}
            onChange={setOtherId}
            placeholder="Busca por nombre, marca o SKU"
          />
        </div>
        <button type="button" onClick={join} disabled={!otherId || pending} className={buttonStyles.secondary}>
          {pending ? "Uniendo…" : "Unir como tamaño"}
        </button>
      </div>
    </div>
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
