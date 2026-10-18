"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { linkStyles } from "./button";
import { controlStyles } from "./field";

export type Filter = {
  name: string; // nombre del parámetro en la dirección, por ejemplo "stock"
  label: string; // texto de la opción vacía, por ejemplo "Todo el stock"
  options: { value: string; label: string }[];
};

// Búsqueda y filtros de una lista. Lo elegido se guarda en la dirección de la página
// (?q=hawas&stock=AGOTADO) y la página, en el servidor, lee esos parámetros para
// consultar la base de datos. Así el filtro se conserva al recargar o compartir el enlace.
export function FilterBar({
  placeholder,
  filters = [],
  values,
}: {
  placeholder?: string; // texto del buscador. Sin él, la barra solo tiene los filtros
  filters?: Filter[];
  values: Record<string, string>; // lo que está aplicado ahora mismo
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [current, setCurrent] = useState(values);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // `delay` espera a que la persona deje de escribir antes de consultar.
  function apply(next: Record<string, string>, delay = 0) {
    setCurrent(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const query = new URLSearchParams(Object.entries(next).filter(([, value]) => value));
      startTransition(() => router.replace(`${pathname}?${query}`, { scroll: false }));
    }, delay);
  }

  const active = Object.values(current).some(Boolean);

  return (
    // En el teléfono: el buscador a todo el ancho y los filtros de dos en dos (el último, si queda
    // solo, ocupa la fila). Desde pantallas medianas, todo en una fila que se acomoda sola.
    <div role="search" className="mb-6 grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap sm:gap-3">
      {placeholder && (
        <input
          type="search"
          aria-label={placeholder}
          placeholder={placeholder}
          value={current.q ?? ""}
          onChange={(event) => apply({ ...current, q: event.target.value }, 250)}
          className={`${controlStyles} col-span-2 h-11 w-full sm:w-auto sm:min-w-56 sm:flex-1`}
        />
      )}
      {filters.map((filter, index) => (
        <select
          key={filter.name}
          aria-label={filter.label}
          value={current[filter.name] ?? ""}
          onChange={(event) => apply({ ...current, [filter.name]: event.target.value })}
          className={`${controlStyles} h-11 w-full min-w-0 sm:w-auto sm:max-w-full ${
            filters.length % 2 === 1 && index === filters.length - 1 ? "col-span-2" : ""
          }`}
        >
          <option value="">{filter.label}</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
      {active && (
        <button type="button" onClick={() => apply({})} className={`justify-self-start text-sm ${linkStyles.default}`}>
          Limpiar
        </button>
      )}
      <span aria-live="polite" className="text-xs text-ink-faint">
        {pending && <span className="motion-safe:animate-skeleton">Buscando…</span>}
      </span>
    </div>
  );
}
