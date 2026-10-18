import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ActionButton } from "@/components/action-button";
import { linkStyles } from "@/components/button";
import { ConfirmButton } from "@/components/confirm-button";
import { Fact, PageHeader } from "@/components/page-header";
import { QuoteBadge } from "@/components/quote-badge";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { queryText } from "@/lib/form";
import { formatCOP, formatDate, whatsappLink } from "@/lib/format";
import { hideAnsweredQuotes, toggleQuoteHidden } from "./actions";
import { AnswerForm } from "./answer-form";

export const metadata = { title: "Cotizaciones" };

type QuoteRow = {
  id: number;
  perfume: string;
  details: string | null;
  phone: string;
  price: number | null;
  answer: string | null;
  answered: boolean;
  created_on: string;
  email: string | null;
  hidden: boolean;
};

// Pestañas: "activas" son todas las no ocultas (primero las pendientes).
const views = [
  { value: "activas", label: "Activas" },
  { value: "pendientes", label: "Por responder" },
  { value: "ocultas", label: "Ocultas" },
] as const;
type View = (typeof views)[number]["value"];

export default async function QuotesPage({ searchParams }: PageProps<"/admin/cotizaciones">) {
  await requireAdmin();
  const params = await searchParams;
  // ?abrir=12 llega desde el correo de "nueva cotización": esa fila aparece abierta.
  const open = Number(queryText(params.abrir));
  const view: View = views.find((option) => option.value === queryText(params.vista))?.value ?? "activas";

  // Primero las que esperan respuesta; dentro de cada grupo, las más recientes.
  // ponytail: sin buscador ni páginas, muestra las últimas 200 de cada pestaña. Agregar FilterBar si el volumen crece.
  const quotes = (await sql`
    select q.id, q.perfume, q.details, q.phone, q.price, q.answer, u.email,
           q.answered_at is not null as answered, q.hidden_at is not null as hidden,
           (q.created_at at time zone 'America/Bogota')::date::text as created_on
    from quotes q
    join users u on u.id = q.user_id
    where case ${view}::text
            when 'pendientes' then q.answered_at is null and q.hidden_at is null
            when 'ocultas' then q.hidden_at is not null
            else q.hidden_at is null
          end
    order by q.answered_at is not null, q.id desc
    limit 200`) as QuoteRow[];
  const [counts] = await sql`
    select count(*) filter (where hidden_at is null)::int as activas,
           count(*) filter (where hidden_at is null and answered_at is null)::int as pendientes,
           count(*) filter (where hidden_at is not null)::int as ocultas,
           count(*) filter (where hidden_at is null and answered_at is not null)::int as respondidas
    from quotes`;

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader
        title="Cotizaciones"
        description="Perfumes que te piden y no están en el catálogo. Abre una para ver el detalle y responder con el precio: el cliente ve la respuesta en la tienda y le llega por correo."
      >
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
          <Fact label="Por responder">{counts.pendientes}</Fact>
          <Fact label="Respondidas a la vista">{counts.respondidas}</Fact>
          <Fact label="Ocultas">{counts.ocultas}</Fact>
        </dl>
      </PageHeader>

      {/* Pestañas: cada una es un enlace (?vista=...), así se puede volver con Atrás. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Qué cotizaciones ver" className="flex gap-1 border-b border-line">
          {views.map((option) => (
            <Link
              key={option.value}
              href={option.value === "activas" ? "/admin/cotizaciones" : `/admin/cotizaciones?vista=${option.value}`}
              aria-current={view === option.value ? "page" : undefined}
              className="relative -mb-px px-3 py-2.5 text-sm text-ink-soft transition-colors duration-(--duration-quick) ease-smooth-out after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-brand after:transition-transform after:duration-(--duration-fast) after:ease-smooth-out hover:text-ink aria-[current=page]:font-medium aria-[current=page]:text-ink aria-[current=page]:after:scale-x-100"
            >
              {option.label}
              <span className="ml-1.5 text-xs text-ink-faint tabular-nums">{counts[option.value]}</span>
            </Link>
          ))}
        </nav>
        {view === "activas" && counts.respondidas > 0 && (
          <ConfirmButton
            action={hideAnsweredQuotes}
            label={`Ocultar las ${counts.respondidas} respondidas`}
            question="¿Ocultar todas las respondidas?"
            confirmLabel="Sí, ocultar"
            successMessage="Respondidas ocultas"
            failureTitle="No se pudieron ocultar"
            danger={false}
          />
        )}
      </div>

      {quotes.length === 0 ? (
        <div className="border border-line bg-surface px-6 py-14">
          <h2 className="font-medium">
            {view === "ocultas" ? "No hay cotizaciones ocultas" : view === "pendientes" ? "No hay nada por responder" : "No hay cotizaciones a la vista"}
          </h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
            {view === "ocultas"
              ? "Las que ocultes aparecen aquí. Puedes volver a mostrarlas cuando quieras."
              : "Cuando alguien pregunte en la tienda por un perfume que no está en el catálogo, aparecerá aquí para que le respondas con el precio."}
          </p>
        </div>
      ) : (
        // Una fila por cotización. Con <details> el navegador la abre y la cierra sin código y funciona con teclado.
        <ul className="divide-y divide-line border border-line bg-surface">
          {quotes.map((quote) => {
            const greeting = `Hola, te escribimos de Velare por tu cotización de ${quote.perfume}.`;
            const message = quote.price === null ? greeting : `${greeting} El precio es ${formatCOP(quote.price)}.`;
            return (
              <li key={quote.id} id={`cotizacion-${quote.id}`}>
                {/* "accordion" (globals.css): el contenido se despliega en altura al abrir y se recoge al cerrar. */}
                <details open={quote.id === open} className="accordion group">
                  <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors duration-(--duration-quick) ease-smooth-out hover:bg-paper sm:grid-cols-[minmax(0,1fr)_8rem_6.5rem_auto_auto] sm:px-5 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{quote.perfume}</span>
                      <span className="block truncate text-xs text-ink-faint sm:hidden">
                        {formatDate(quote.created_on)}, {quote.email ?? "sin correo"}
                      </span>
                    </span>
                    <span className="hidden truncate text-xs text-ink-faint sm:block">{quote.email ?? "Sin correo"}</span>
                    <span className="hidden text-xs text-ink-faint tabular-nums sm:block">{formatDate(quote.created_on)}</span>
                    <QuoteBadge answered={quote.answered} price={quote.price} />
                    <CaretDown
                      size={16}
                      aria-hidden
                      className="text-ink-faint transition-transform duration-(--duration-fast) ease-smooth-out group-open:rotate-180"
                    />
                  </summary>

                  <div className="grid grid-cols-1 gap-x-10 gap-y-6 border-t border-line bg-paper/60 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
                    <div className="min-w-0 text-sm">
                      {quote.details ? (
                        <p className="leading-relaxed break-words whitespace-pre-line text-ink-soft">{quote.details}</p>
                      ) : (
                        <p className="text-ink-faint">El cliente no dio más detalles.</p>
                      )}
                      <dl className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs text-ink-faint">Correo</dt>
                          <dd className="break-all">{quote.email ?? "Sin correo"}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-ink-faint">Pedida el</dt>
                          <dd>{formatDate(quote.created_on)}</dd>
                        </div>
                      </dl>
                      <a href={whatsappLink(quote.phone, message)} target="_blank" rel="noreferrer" className={`mt-3 inline-block ${linkStyles.default}`}>
                        Escribirle por WhatsApp al {quote.phone}
                      </a>
                      <div className="mt-4 border-t border-line pt-3">
                        <ActionButton
                          action={toggleQuoteHidden.bind(null, quote.id)}
                          label={quote.hidden ? "Volver a mostrar" : "Ocultar esta cotización"}
                          successMessage={quote.hidden ? "Cotización a la vista" : "Cotización oculta"}
                          className={`text-sm ${linkStyles.default}`}
                        />
                      </div>
                    </div>
                    <AnswerForm quoteId={quote.id} price={quote.price} answer={quote.answer} answered={quote.answered} />
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
