import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { linkStyles } from "@/components/button";
import type { StoreSettings } from "@/lib/orders";

// Formato de las páginas legales: título, fecha de actualización, índice y secciones numeradas.
// El índice va al lado en pantallas grandes y arriba en el teléfono.

export type LegalSection = { id: string; title: string; body: React.ReactNode };

// Fecha de la versión vigente de los tres documentos. Cambiarla cuando se modifique el texto.
export const legalUpdated = "18 de octubre de 2026";

export function LegalPage({ title, intro, sections }: { title: string; intro: React.ReactNode; sections: LegalSection[] }) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-12 pb-24 sm:px-8">
      <h1 className="font-display text-4xl font-light tracking-tight text-balance motion-safe:animate-unveil sm:text-5xl">{title}</h1>
      <p className="mt-3 text-sm text-ink-faint motion-safe:animate-unveil motion-safe:[animation-delay:var(--duration-micro)]">
        Última actualización: {legalUpdated}
      </p>
      <div className="mt-6 max-w-[68ch] leading-relaxed text-ink-soft motion-safe:animate-unveil motion-safe:[animation-delay:calc(var(--duration-micro)*2)]">
        {intro}
      </div>

      <div className="mt-12 grid items-start gap-12 lg:grid-cols-[16rem_minmax(0,1fr)]">
        {/* El índice: en pantallas grandes, fijo al lado. En el teléfono se pliega para no empujar
            el texto hacia abajo (13 enlaces seguidos ocupan casi una pantalla). */}
        <details className="accordion group border-y border-line motion-safe:animate-settle lg:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-sm font-medium [&::-webkit-details-marker]:hidden">
            Contenido ({sections.length} secciones)
            <CaretDown size={16} aria-hidden className="text-ink-faint transition-transform duration-(--duration-fast) ease-smooth-out group-open:rotate-180" />
          </summary>
          <nav aria-label="Contenido" className="pb-3">
            <TableOfContents sections={sections} />
          </nav>
        </details>
        <nav aria-label="Contenido" className="hidden text-sm motion-safe:animate-settle lg:sticky lg:top-24 lg:block">
          <TableOfContents sections={sections} />
        </nav>

        <div className="flex max-w-[68ch] flex-col gap-12">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-titulo`} className="reveal">
              <h2 id={`${section.id}-titulo`} className="font-display text-2xl">
                {index + 1}. {section.title}
              </h2>
              {/* Párrafos y listas del texto legal, con el mismo ritmo en las tres páginas. */}
              <div className="mt-4 flex flex-col gap-4 leading-relaxed text-ink-soft [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-medium [&_strong]:text-ink [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function TableOfContents({ sections }: { sections: LegalSection[] }) {
  return (
    <ol className="flex flex-col text-sm lg:gap-2">
      {sections.map((section, index) => (
        <li key={section.id}>
          {/* En el teléfono cada enlace mide 40 px de alto, cómodo para el dedo. */}
          <a
            href={`#${section.id}`}
            className="flex min-h-10 items-center text-ink-soft transition duration-(--duration-quick) ease-smooth-out hover:translate-x-1 hover:text-ink lg:inline-block lg:min-h-0"
          >
            {index + 1}. {section.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

// Un dato legal de Ajustes, o un aviso de que falta llenarlo.
export const legalValue = (value: string, label: string) => value || `[${label}: pendiente]`;

// Quién responde por la tienda y cómo contactarla. Sale de Panel → Ajustes.
export function ResponsibleParty({ store }: { store: StoreSettings }) {
  return (
    <ul>
      <li>
        <strong>Responsable:</strong> {legalValue(store.legalName, "nombre o razón social")}, identificado con cédula o NIT{" "}
        {legalValue(store.legalId, "número")}, que vende bajo la marca Ésman Parfum.
      </li>
      <li>
        <strong>Domicilio:</strong> {legalValue(store.address, "dirección")}, Colombia.
      </li>
      <li>
        <strong>Correo:</strong>{" "}
        {store.email ? (
          <a href={`mailto:${store.email}`} className={linkStyles.default}>
            {store.email}
          </a>
        ) : (
          legalValue("", "correo")
        )}
      </li>
      {/* Solo un número real (con indicativo tiene al menos 10 dígitos). */}
      {store.whatsapp.length >= 10 && (
        <li>
          <strong>WhatsApp:</strong>{" "}
          <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noreferrer" className={linkStyles.default}>
            +{store.whatsapp}
          </a>
        </li>
      )}
    </ul>
  );
}

// Enlace a otra página legal dentro del texto.
export function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={linkStyles.default}>
      {children}
    </Link>
  );
}
