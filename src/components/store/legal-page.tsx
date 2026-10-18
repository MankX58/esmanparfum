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
      <p className="mt-3 text-sm text-ink-faint">Última actualización: {legalUpdated}</p>
      <div className="mt-6 max-w-[68ch] leading-relaxed text-ink-soft">{intro}</div>

      <div className="mt-12 grid items-start gap-12 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <nav aria-label="Contenido" className="border-y border-line py-5 text-sm lg:sticky lg:top-24 lg:border-y-0 lg:py-0">
          <ol className="flex flex-col gap-2">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-ink-soft transition-colors duration-(--duration-quick) ease-smooth-out hover:text-ink">
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex max-w-[68ch] flex-col gap-12">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-titulo`}>
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

// Un dato legal de Ajustes, o un aviso de que falta llenarlo.
export const legalValue = (value: string, label: string) => value || `[${label}: pendiente]`;

// Quién responde por la tienda y cómo contactarla. Sale de Panel → Ajustes.
export function ResponsibleParty({ store }: { store: StoreSettings }) {
  return (
    <ul>
      <li>
        <strong>Responsable:</strong> {legalValue(store.legalName, "nombre o razón social")}, identificado con cédula o NIT{" "}
        {legalValue(store.legalId, "número")}, que vende bajo la marca Velare.
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
