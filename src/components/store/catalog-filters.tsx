"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { linkStyles } from "../button";
import { controlStyles } from "../field";

type Option = { value: string; label: string };
type Values = { q: string; marca: string; publico: string; tamano: string; orden: string };
type Menu = "marca" | "tamano";

// Búsqueda y filtros del catálogo. El público está a la vista como pestañas; marca y tamaño son dos
// menús compactos que muestran lo elegido y se abren sobre la página (sin empujar el contenido).
// Lo elegido se guarda en la dirección (?marca=Rasasi&tamano=100), igual que en FilterBar.
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
  const [menu, setMenu] = useState<Menu | null>(null);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const root = useRef<HTMLDivElement>(null);

  function apply(next: Values, delay = 0) {
    setCurrent(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const query = new URLSearchParams(Object.entries(next).filter(([, value]) => value));
      startTransition(() => router.replace(`${pathname}?${query}`, { scroll: false }));
    }, delay);
  }
  const set = (name: keyof Values, value: string) => apply({ ...current, [name]: value });

  // El menú abierto se cierra con Esc o al tocar fuera de los filtros.
  useEffect(() => {
    if (!menu) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenu(null);
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setMenu(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [menu]);

  const active = Object.values(current).some(Boolean);
  const menus: { name: Menu; label: string; all: string; options: Option[] }[] = [
    { name: "marca", label: "Marca", all: "Todas las marcas", options: brands },
    { name: "tamano", label: "Tamaño", all: "Todos los tamaños", options: sizes },
  ];

  return (
    <div role="search" ref={root} className="relative mb-8">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <input
          type="search"
          aria-label="Buscar por nombre o marca"
          placeholder="Buscar por nombre o marca"
          value={current.q}
          onChange={(event) => apply({ ...current, q: event.target.value }, 250)}
          className={`${controlStyles} h-11 min-w-0 w-full`}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 border-b border-line">
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

        <div className="flex gap-5 sm:gap-7">
          {menus.map(({ name, label, options }) => {
            const chosen = options.find((option) => option.value === current[name]);
            return (
              <button
                key={name}
                type="button"
                aria-expanded={menu === name}
                aria-haspopup="listbox"
                onClick={() => setMenu(menu === name ? null : name)}
                className="flex items-center gap-1.5 py-3 text-sm text-ink-soft transition-colors duration-(--duration-quick) ease-smooth-out hover:text-ink aria-expanded:text-ink"
              >
                {chosen ? <span className="max-w-32 truncate text-ink underline decoration-1 underline-offset-4">{chosen.label}</span> : label}
                <svg
                  aria-hidden
                  viewBox="0 0 12 12"
                  className={`size-3 shrink-0 transition-transform duration-(--duration-fast) ease-smooth-out ${menu === name ? "rotate-180" : ""}`}
                >
                  <path d="M2 4.5 6 8.5l4-4" fill="none" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>
            );
          })}
          {/* Orden: un texto con flecha, como Marca y Tamaño. El selector nativo se abre con la lista del teléfono. */}
          <label className="relative flex items-center py-3 text-sm text-ink-soft transition-colors duration-(--duration-quick) hover:text-ink">
            <span className="sr-only">Ordenar</span>
            <select
              value={current.orden}
              onChange={(event) => set("orden", event.target.value)}
              className={`cursor-pointer appearance-none bg-transparent pr-4 outline-none focus-visible:underline ${current.orden ? "text-ink underline decoration-1 underline-offset-4" : ""}`}
            >
              <option value="">Más vendidos</option>
              {sorts.map((sort) => (
                <option key={sort.value} value={sort.value}>
                  {sort.label}
                </option>
              ))}
            </select>
            <svg aria-hidden viewBox="0 0 12 12" className="pointer-events-none absolute right-0 size-3">
              <path d="M2 4.5 6 8.5l4-4" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </label>
        </div>
      </div>

      {menus.map(
        ({ name, label, all, options }) =>
          menu === name && (
            <OptionList
              key={name}
              label={label}
              all={all}
              options={options}
              selected={current[name]}
              onPick={(value) => {
                set(name, value);
                setMenu(null);
              }}
            />
          ),
      )}

      <div className="mt-2 flex h-5 items-center gap-4 text-xs">
        {active && (
          <button type="button" onClick={() => apply({ q: "", marca: "", publico: "", tamano: "", orden: "" })} className={linkStyles.default}>
            Limpiar todo
          </button>
        )}
        <span aria-live="polite" className="text-ink-faint">
          {pending && <span className="motion-safe:animate-skeleton">Buscando…</span>}
        </span>
      </div>
    </div>
  );
}

// La lista de un menú: abre bajo la barra, con buscador si son muchas opciones. Elegir la opción
// marcada, o "Todas", quita el filtro.
function OptionList({
  label,
  all,
  options,
  selected,
  onPick,
}: {
  label: string;
  all: string;
  options: Option[];
  selected: string;
  onPick: (value: string) => void;
}) {
  const [text, setText] = useState("");
  const shown = options.filter((option) => option.label.toLowerCase().includes(text.trim().toLowerCase()));
  const searchable = options.length > 8;
  const row =
    "flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left text-sm transition-colors duration-(--duration-quick) hover:bg-surface";
  return (
    <div
      role="listbox"
      aria-label={label}
      className="absolute inset-x-0 top-full z-20 mt-1 border border-line bg-paper shadow-lg motion-safe:animate-disclose sm:inset-x-auto sm:right-0 sm:w-72"
    >
      {searchable && (
        <input
          type="search"
          aria-label={`Buscar ${label.toLowerCase()}`}
          placeholder={`Buscar ${label.toLowerCase()}`}
          value={text}
          onChange={(event) => setText(event.target.value)}
          // Solo con ratón: en el teléfono, abrir el teclado tapa la lista.
          autoFocus={typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches}
          className="h-11 w-full border-b border-line bg-transparent px-4 text-base outline-none placeholder:text-ink-faint sm:text-sm"
        />
      )}
      <ul className="max-h-64 overflow-y-auto py-1">
        {!text && (
          <li>
            <button type="button" role="option" aria-selected={!selected} onClick={() => onPick("")} className={`${row} text-ink-soft`}>
              {all}
              {!selected && <Check />}
            </button>
          </li>
        )}
        {shown.map((option) => (
          <li key={option.value}>
            <button
              type="button"
              role="option"
              aria-selected={selected === option.value}
              onClick={() => onPick(selected === option.value ? "" : option.value)}
              className={`${row} aria-selected:font-medium`}
            >
              {option.label}
              {selected === option.value && <Check />}
            </button>
          </li>
        ))}
        {shown.length === 0 && <li className="px-4 py-3 text-sm text-ink-soft">Nada con ese nombre.</li>}
      </ul>
    </div>
  );
}

function Check() {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className="size-3 shrink-0">
      <path d="m2 6.5 2.5 2.5L10 3.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
