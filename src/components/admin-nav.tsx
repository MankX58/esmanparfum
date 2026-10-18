"use client";

import {
  Calculator,
  ChartBar,
  ChatCircleText,
  GearSix,
  Package,
  Receipt,
  Tag,
  Ticket,
  Truck,
  Users,
  Wallet,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Las secciones del panel, agrupadas por lo que se hace en ellas.
const groups = [
  { label: "", sections: [{ href: "/admin", label: "Resumen", icon: ChartBar }] },
  {
    label: "Vender",
    sections: [
      { href: "/admin/pedidos", label: "Pedidos", icon: Package },
      { href: "/admin/cotizaciones", label: "Cotizaciones", icon: ChatCircleText },
      { href: "/admin/codigos", label: "Códigos", icon: Ticket },
      { href: "/admin/clientes", label: "Clientes", icon: Users },
    ],
  },
  {
    label: "Inventario",
    sections: [
      { href: "/admin/productos", label: "Productos", icon: Tag },
      { href: "/admin/compras", label: "Compras", icon: Truck },
      { href: "/admin/precios", label: "Precios", icon: Calculator },
    ],
  },
  {
    label: "Dinero",
    sections: [
      { href: "/admin/ventas", label: "Ventas", icon: Receipt },
      { href: "/admin/caja", label: "Caja", icon: Wallet },
    ],
  },
  { label: "", sections: [{ href: "/admin/ajustes", label: "Ajustes", icon: GearSix }] },
];

// Cada enlace se atenúa cuando el cursor está sobre OTRO enlace (así resalta el que se señala).
// Entrar es rápido (duration-quick) y volver es más suave (duration-medium). El atenuado solo
// aplica en equipos con cursor: en pantallas táctiles se quedaría pegado tras tocar.
// La sección actual (aria-current) se marca distinto según la forma de la barra:
// - Fila horizontal (pantallas de menos de 1280px): una línea debajo, que crece desde la izquierda.
// - Barra lateral (xl): la fila entera con un fondo más oscuro.
const link =
  "relative flex h-12 shrink-0 items-center gap-2 text-on-brand-soft " +
  "transition duration-(--duration-medium) ease-smooth-out hover:text-on-brand aria-[current=page]:text-on-brand " +
  "group-has-[a:hover]/nav:duration-(--duration-quick) [@media(hover:hover)]:group-has-[a:hover]/nav:not-hover:opacity-40 " +
  "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-on-brand " +
  "after:transition-transform after:duration-(--duration-fast) after:ease-smooth-out " +
  "hover:after:scale-x-100 aria-[current=page]:after:scale-x-100 " +
  "xl:h-11 xl:gap-3 xl:px-6 xl:after:hidden xl:hover:bg-on-brand/5 xl:aria-[current=page]:bg-on-brand/10 xl:aria-[current=page]:font-medium";

export function AdminNav() {
  const pathname = usePathname();

  return (
    // En pantallas angostas la fila se desliza de lado; una barra de desplazamiento fina avisa de que hay más.
    <nav
      aria-label="Secciones del panel"
      className="group/nav flex gap-5 overflow-x-auto text-sm [scrollbar-color:var(--color-on-brand-soft)_transparent] [scrollbar-width:thin] sm:gap-6 xl:flex-col xl:gap-5 xl:overflow-visible xl:py-2"
    >
      {groups.map((group, index) => (
        <div key={index} role="group" aria-label={group.label || undefined} className="flex gap-5 sm:gap-6 xl:flex-col xl:gap-0">
          {/* El nombre del grupo solo cabe en la barra lateral. */}
          {group.label && <p className="hidden px-6 pb-1 text-xs text-on-brand-soft xl:block">{group.label}</p>}
          {group.sections.map(({ href, label, icon: Icon }) => {
            // "Resumen" es la raíz del panel: solo está activa en /admin exacto.
            const current = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} aria-current={current ? "page" : undefined} className={link}>
                {/* El icono solo va en la barra lateral: en la fila horizontal alargaría la lista y cortaría secciones. */}
                <Icon size={18} weight="light" aria-hidden className="hidden shrink-0 xl:block" />
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
