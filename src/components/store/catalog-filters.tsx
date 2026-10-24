"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { linkStyles } from "../button";
import { controlStyles } from "../field";

type Option = { value: string; label: string };
type Values = { q: string; marca: string; publico: string; tamano: string; orden: string };

// Búsqueda y filtros del catálogo. Lo más usado (público) está a la vista como pestañas; marca y
// tamaño viven en un panel que se abre bajo la barra, con todas las opciones a un toque. Lo elegido
// se guarda en la dirección (?marca=Rasasi&tamano=100), igual que en FilterBar.
export function CatalogFilters({
  values,
  audiences,
  brands,
  sizes,
  sorts,
}: {
  values: Values;
  audiences: Option[];
  brands: Option[];
  sizes: Option[];
  sorts: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [current, setCurrent] = useState(values);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function apply(next: Values, delay = 0) {
    setCurrent(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const query = new URLSearchParams(Object.entries(next).filter(([, value]) => value));
      startTransition(() => router.replace(`${pathname}?${query}`, { scroll: false }));
    }, delay);
  }
  const set = (name: keyof Values, value: string) => apply({ ...current, [name]: value });
  // Tocar la opción elegida la quita.
  const toggle = (name: keyof Values, value: string) => set(name, current[name] === value ? "" : value);

  const extra = [current.marca, current.tamano].filter(Boolean).length;
  const labelOf = (options: Option[], value: string) => options.find((option) => option.value === value)?.label ?? value;
  const active = Object.values(current).some(Boolean);

  return (
    <div role="search" className="mb-8">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <input
          type="search"
          aria-label="Buscar por nombre o marca"
          placeholder="Buscar por nombre o marca"
          value={current.q}
          onChange={(event) => apply({ ...current, q: event.target.value }, 250)}
          className={`${controlStyles} h-11 min-w-0 flex-1 basis-56`}
        />
        <label className="flex h-11 items-center gap-2 text-sm text-ink-soft">
          <span className="hidden sm:inline">Ordenar</span>
          <select
            aria-label="Ordenar"
            value={current.orden}
            onChange={(event) => set("orden", event.target.value)}
            className={`${controlStyles} h-11 max-w-44 text-ink`}
          >
            <option value="">Más vendidos</option>
            {sorts.map((sort) => (
              <option key={sort.value} value={sort.value}>
                {sort.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line">
        {/* Público: pestañas con subrayado, una sola fila incluso en el teléfono. */}
        <div role="group" aria-label="Para quién" className="flex gap-5 sm:gap-7">
          {[{ value: "", label: "Todos" }, ...audiences].map((audience) => {
            const selected = current.publico === audience.value;
            return (
              <button
                key={audience.value}
                type="button"
                aria-pressed={selected}
                onClick={() => set("publico", audience.value)}
                className="relative -mb-px py-3 text-sm text-ink-soft transition-colors duration-(--duration-quick) ease-smooth-out hover:text-ink aria-pressed:text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-transform after:duration-(--duration-fast) after:ease-smooth-out aria-pressed:after:scale-x-100"
              >
                {audience.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="catalog-more-filters"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 py-3 text-sm text-ink transition-colors duration-(--duration-quick) ease-smooth-out hover:text-ink-soft"
        >
          Marca y tamaño
          {extra > 0 && <span className="grid size-5 place-items-center bg-ink text-[11px] text-paper tabular-nums">{extra}</span>}
          <svg
            aria-hidden
            viewBox="0 0 12 12"
            className={`size-3 transition-transform duration-(--duration-fast) ease-smooth-out ${open ? "rotate-180" : ""}`}
          >
            <path d="M2 4.5 6 8.5l4-4" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>

      {open && (
        <div id="catalog-more-filters" className="grid gap-6 border-b border-line py-6 motion-safe:animate-disclose sm:grid-cols-[2fr_1fr] sm:gap-10">
          <ChipGroup label="Marca" options={brands} selected={current.marca} onToggle={(value) => toggle("marca", value)} />
          <ChipGroup label="Tamaño" options={sizes} selected={current.tamano} onToggle={(value) => toggle("tamano", value)} />
        </div>
      )}

      {/* Con el panel cerrado, lo elegido sigue a la vista y se quita con un toque. */}
      {(!open && extra > 0) || active ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!open && current.marca && <ActiveChip label={current.marca} onRemove={() => set("marca", "")} />}
          {!open && current.tamano && <ActiveChip label={labelOf(sizes, current.tamano)} onRemove={() => set("tamano", "")} />}
          {active && (
            <button type="button" onClick={() => apply({ q: "", marca: "", publico: "", tamano: "", orden: "" })} className={`text-xs ${linkStyles.default}`}>
              Limpiar todo
            </button>
          )}
        </div>
      ) : null}

      <span aria-live="polite" className="mt-2 block h-4 text-xs text-ink-faint">
        {pending && <span className="motion-safe:animate-skeleton">Buscando…</span>}
      </span>
    </div>
  );
}

// Un grupo de opciones como fichas: la elegida se rellena de tinta.
function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: Option[];
  selected: string;
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-[11px] tracking-[0.18em] text-ink-soft uppercase">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected === option.value}
            onClick={() => onToggle(option.value)}
            className="border border-line px-3 py-1.5 text-sm transition-[background-color,border-color,color] duration-(--duration-quick) ease-smooth-out hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper"
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

// Un filtro aplicado, para quitarlo con un toque.
function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Quitar ${label}`}
      className="flex items-center gap-1.5 border border-ink bg-ink px-2.5 py-1 text-xs text-paper transition-opacity duration-(--duration-quick) hover:opacity-80"
    >
      {label}
      <span aria-hidden>×</span>
    </button>
  );
}
