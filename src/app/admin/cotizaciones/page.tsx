import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { linkStyles } from "@/components/button";
import { Fact, PageHeader } from "@/components/page-header";
import { QuoteBadge } from "@/components/quote-badge";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { queryText } from "@/lib/form";
import { formatCOP, formatDate, whatsappLink } from "@/lib/format";
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
};

export default async function QuotesPage({ searchParams }: PageProps<"/admin/cotizaciones">) {
  await requireAdmin();
  // ?abrir=12 llega desde el correo de "nueva cotización": esa fila aparece abierta.
  const open = Number(queryText((await searchParams).abrir));

  // Primero las que esperan respuesta; dentro de cada grupo, las más recientes.
  // ponytail: sin buscador ni páginas, muestra las últimas 200. Agregar FilterBar si el volumen crece.
  const quotes = (await sql`
    select q.id, q.perfume, q.details, q.phone, q.price, q.answer, u.email,
           q.answered_at is not null as answered,
           (q.created_at at time zone 'America/Bogota')::date::text as created_on
    from quotes q
    join users u on u.id = q.user_id
    order by q.answered_at is not null, q.id desc
    limit 200`) as QuoteRow[];
  const pending = quotes.filter((quote) => !quote.answered).length;

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader
        title="Cotizaciones"
        description="Perfumes que te piden y no están en el catálogo. Abre una para ver el detalle y responder con el precio: el cliente ve la respuesta en la tienda y le llega por correo."
      >
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
          <Fact label="Cotizaciones">{quotes.length}</Fact>
          <Fact label="Por responder">{pending}</Fact>
        </dl>
      </PageHeader>

      {quotes.length === 0 ? (
        <div className="border border-line bg-surface px-6 py-14">
          <h2 className="font-medium">Todavía no hay cotizaciones</h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
            Cuando alguien pregunte en la tienda por un perfume que no está en el catálogo, aparecerá aquí para que le
            respondas con el precio.
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
                <details open={quote.id === open} className="group">
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

                  <div className="grid grid-cols-1 gap-x-10 gap-y-6 border-t border-line bg-paper/60 px-4 py-5 motion-safe:animate-disclose sm:px-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
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
