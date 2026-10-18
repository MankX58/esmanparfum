"use client";

import { useId, useRef, useState } from "react";
import { inputStyles } from "./field";

// Lista desplegable con buscador, para elegir entre muchas opciones (por ejemplo, un perfume).
// Se escribe parte del nombre, la marca o el SKU y la lista se reduce. Con el teclado:
// flechas para moverse, Enter para elegir y Escape para cerrar.
// Si lleva `name`, envía el valor elegido en un campo oculto, como lo haría un <select>.

export type SearchOption = { value: string; label: string; hint?: string };

// Cómo se nombra un perfume en estas listas: "P007 · Armaf Club de Nuit Intense man EDT, 105 ml".
// Lleva marca y SKU para poder buscar por cualquiera de los dos.
export function productOption(p: { id: number; sku: string; brand: string | null; name: string; size_ml: number | null }, hint?: string): SearchOption {
  const name = [p.brand, p.name].filter(Boolean).join(" ") + (p.size_ml ? `, ${p.size_ml} ml` : "");
  return { value: String(p.id), label: `${p.sku} · ${name}`, hint };
}

const MAX_SHOWN = 50; // más resultados no caben a la vista; escribir más reduce la lista

// Sin tildes ni mayúsculas, para que "lattafa" encuentre "Lattafa" y "acqua" encuentre "Acqua".
const simplify = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function SearchSelect({
  id,
  name,
  options,
  value,
  onChange,
  placeholder = "Escribe para buscar",
  emptyLabel,
  invalid,
  describedBy,
}: {
  id: string;
  name?: string;
  options: SearchOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string; // opción para dejarlo vacío, por ejemplo "Escribir el costo a mano"
  invalid?: boolean;
  describedBy?: string;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const list = useRef<HTMLUListElement>(null);

  const selected = options.find((option) => option.value === value);
  // Cada palabra escrita debe aparecer en la opción, en cualquier orden: "nuit 105" encuentra "Club de Nuit, 105 ml".
  const words = simplify(query).split(/\s+/).filter(Boolean);
  const matches = options.filter((option) => {
    const text = simplify(`${option.label} ${option.hint ?? ""}`);
    return words.every((word) => text.includes(word));
  });
  const shown = [...(emptyLabel && !query ? [{ value: "", label: emptyLabel }] : []), ...matches.slice(0, MAX_SHOWN)];

  function choose(option: SearchOption) {
    onChange(option.value);
    setQuery("");
    setOpen(false);
  }

  function move(step: number) {
    const next = Math.min(Math.max(active + step, 0), shown.length - 1);
    setActive(next);
    list.current?.children[next]?.scrollIntoView({ block: "nearest" });
  }

  return (
    <div className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        // El campo solo guarda lo que se busca. Lo elegido se ve como texto de ayuda (placeholder):
        // así, al escribir, la búsqueda empieza siempre desde cero.
        value={query}
        placeholder={selected ? selected.label : (emptyLabel ?? placeholder)}
        onFocus={() => {
          setOpen(true);
          setActive(0);
        }}
        onBlur={() => {
          setOpen(false);
          setQuery("");
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!open) setOpen(true);
            else move(1);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            move(-1);
          } else if (event.key === "Enter" && open) {
            // Enter elige la opción marcada y no envía el formulario.
            event.preventDefault();
            if (shown[active]) choose(shown[active]);
          } else if (event.key === "Escape") {
            setQuery("");
            setOpen(false);
          }
        }}
        // Con algo elegido y la lista cerrada, el texto de ayuda se ve como texto normal.
        className={`${inputStyles} h-11 pr-9 ${selected && !open ? "placeholder:text-ink!" : ""}`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-ink-faint transition-transform duration-(--duration-fast) ease-smooth-out ${open ? "rotate-180" : ""}`}
      >
        ▾
      </span>

      {open && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 origin-top overflow-y-auto border border-line bg-surface text-sm shadow-lg motion-safe:animate-disclose"
        >
          {shown.length === 0 ? (
            <li className="px-3 py-3 text-ink-faint">Nada coincide con &quot;{query}&quot;.</li>
          ) : (
            shown.map((option, index) => (
              <li
                key={option.value || "vacio"}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={option.value === value}
                // onMouseDown y no onClick: así se elige antes de que el campo pierda el foco y se cierre la lista.
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(option);
                }}
                onMouseEnter={() => setActive(index)}
                className={`flex cursor-pointer items-baseline justify-between gap-3 px-3 py-2.5 transition-colors duration-(--duration-quick) ease-smooth-out ${
                  index === active ? "bg-mist" : ""
                } ${option.value === value ? "font-medium" : ""} ${option.value === "" ? "text-ink-soft" : ""}`}
              >
                <span>{option.label}</span>
                {option.hint && <span className="shrink-0 text-xs text-ink-faint tabular-nums">{option.hint}</span>}
              </li>
            ))
          )}
          {matches.length > MAX_SHOWN && (
            <li className="px-3 py-2 text-xs text-ink-faint">Hay {matches.length - MAX_SHOWN} más: escribe para reducir la lista.</li>
          )}
        </ul>
      )}
    </div>
  );
}
