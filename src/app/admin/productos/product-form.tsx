"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sileo } from "sileo";
import { buttonStyles } from "@/components/button";
import { Field, fieldProps, inputStyles } from "@/components/field";
import { parseMoney } from "@/lib/form";
import { formatPercent } from "@/lib/format";
import { noteLevels, type Notes } from "@/lib/notes";
import { useServerForm } from "@/lib/use-server-form";
import { saveProduct } from "./actions";

export type Product = {
  id: number;
  sku: string;
  name: string;
  brand: string | null;
  audience: string | null;
  size_ml: number | null;
  category: string | null;
  description: string | null;
  notes: Notes | null;
  list_price: number;
  initial_stock: number;
  initial_unit_cost: number;
  reorder_point: number;
  is_active: boolean;
};

const input = `${inputStyles} h-11`;
const sectionTitle = "font-display text-xl";

// Formulario para crear (sin `product`) o editar un producto.
// `avgCost` es el costo promedio actual: sirve para mostrar el margen mientras se cambia el precio.
export function ProductForm({
  product,
  suggestedSku,
  avgCost,
}: {
  product?: Product;
  suggestedSku?: string;
  avgCost?: number;
}) {
  const router = useRouter();
  const [price, setPrice] = useState(product ? String(product.list_price) : "");

  const { state, pending, busy, handleSubmit } = useServerForm(saveProduct.bind(null, product?.id ?? null), () => {
    if (product) {
      sileo.success({ title: "Cambios guardados" });
    } else {
      sileo.success({ title: "Producto creado" });
      router.push("/admin/productos");
    }
  });
  const errors = state.errors ?? {};

  const priceValue = parseMoney(price);
  const margin = avgCost !== undefined && priceValue ? (priceValue - avgCost) / priceValue : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-12">
      {state.message && (
        <p role="alert" className="border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      )}

      <section className="flex flex-col gap-6">
        <h2 className={sectionTitle}>Identificación</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="SKU" name="sku" error={errors.sku} hint="Código corto y único. Ejemplo: P026">
            <input {...fieldProps("sku", errors.sku)} defaultValue={product?.sku ?? suggestedSku} className={input} />
          </Field>
          <Field label="Nombre" name="name" error={errors.name}>
            <input {...fieldProps("name", errors.name)} defaultValue={product?.name} className={input} />
          </Field>
          <Field label="Marca" name="brand" error={errors.brand}>
            <input {...fieldProps("brand", errors.brand)} defaultValue={product?.brand ?? ""} className={input} />
          </Field>
          <Field label="Categoría" name="category" error={errors.category} hint="Opcional. Ejemplo: Árabe, Diseñador">
            <input {...fieldProps("category", errors.category)} defaultValue={product?.category ?? ""} className={input} />
          </Field>
          <Field label="Público" name="audience" error={errors.audience}>
            <select {...fieldProps("audience", errors.audience)} defaultValue={product?.audience ?? ""} className={input}>
              <option value="">Sin definir</option>
              <option>Hombre</option>
              <option>Mujer</option>
              <option>Unisex</option>
            </select>
          </Field>
          <Field label="Tamaño (ml)" name="size_ml" error={errors.size_ml}>
            <input
              {...fieldProps("size_ml", errors.size_ml)}
              inputMode="numeric"
              defaultValue={product?.size_ml ?? ""}
              className={input}
            />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-6 border-t border-line pt-10">
        <h2 className={sectionTitle}>Precio e inventario</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Precio de lista"
            name="list_price"
            error={errors.list_price}
            hint={
              margin === null ? (
                "En pesos, sin decimales."
              ) : (
                <>
                  Margen con el costo promedio actual:{" "}
                  <span key={margin} className="inline-block text-ink tabular-nums motion-safe:animate-swap">
                    {formatPercent(margin)}
                  </span>
                </>
              )
            }
          >
            <input
              {...fieldProps("list_price", errors.list_price)}
              inputMode="numeric"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className={input}
            />
          </Field>
          <Field
            label="Punto de reorden"
            name="reorder_point"
            error={errors.reorder_point}
            hint="Cuando el stock llegue a este número o menos, la alerta dirá Pedir."
          >
            <input
              {...fieldProps("reorder_point", errors.reorder_point)}
              inputMode="numeric"
              defaultValue={product?.reorder_point ?? 0}
              className={input}
            />
          </Field>
          <Field
            label="Stock inicial"
            name="initial_stock"
            error={errors.initial_stock}
            hint="Unidades que ya tenías antes de registrar compras aquí."
          >
            <input
              {...fieldProps("initial_stock", errors.initial_stock)}
              inputMode="numeric"
              defaultValue={product?.initial_stock ?? 0}
              className={input}
            />
          </Field>
          <Field
            label="Costo unitario inicial"
            name="initial_unit_cost"
            error={errors.initial_unit_cost}
            hint="Costo de esas unidades. Si aún no hay compras, se usa como costo de referencia."
          >
            <input
              {...fieldProps("initial_unit_cost", errors.initial_unit_cost)}
              inputMode="numeric"
              defaultValue={product?.initial_unit_cost ?? 0}
              className={input}
            />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-6 border-t border-line pt-10">
        <h2 className={sectionTitle}>Tienda</h2>
        <Field label="Descripción" name="description" error={errors.description} hint="Opcional. Se mostrará en la página del producto.">
          <textarea
            {...fieldProps("description", errors.description)}
            rows={5}
            defaultValue={product?.description ?? ""}
            className={`${inputStyles} py-2.5 leading-relaxed`}
          />
        </Field>
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-medium">Notas olfativas</legend>
          <p className="-mt-2 max-w-[60ch] text-xs leading-relaxed text-ink-faint">
            Separadas por comas, como en Fragrantica. Se muestran en la tienda como una foto más del perfume y se comparten
            entre sus tamaños. Déjalas vacías si no las conoces.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {noteLevels.map((level) => (
              <Field key={level.key} label={level.label} name={`notes_${level.key}`} hint={level.hint}>
                <input
                  {...fieldProps(`notes_${level.key}`)}
                  defaultValue={product?.notes?.[level.key]?.join(", ") ?? ""}
                  placeholder="Ejemplo: bergamota, limón, menta"
                  className={input}
                />
              </Field>
            ))}
          </div>
          <input type="hidden" name="notes_source" value={product?.notes?.source ?? ""} />
        </fieldset>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} className="size-5 accent-brand" />
          Activo: el producto se muestra en la tienda
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-8">
        <button type="submit" disabled={busy} className={buttonStyles.primary}>
          {pending ? "Guardando…" : product ? "Guardar cambios" : "Crear producto"}
        </button>
        <Link href="/admin/productos" className={buttonStyles.secondary}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
