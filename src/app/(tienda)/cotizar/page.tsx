import type { Metadata } from "next";
import { buttonStyles } from "@/components/button";
import { QuoteBadge } from "@/components/quote-badge";
import { SpamNotice } from "@/components/store/spam-notice";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { queryText } from "@/lib/form";
import { formatCOP, formatDate, whatsappLink } from "@/lib/format";
import { getStoreSettings } from "@/lib/orders";
import { QuoteForm } from "./quote-form";

export const metadata: Metadata = {
  title: "Cotizar un perfume",
  description: "¿Buscas un perfume que no está en el catálogo de Velare? Dinos cuál y te respondemos con el precio.",
  alternates: { canonical: "/cotizar" },
};

const steps = [
  { title: "Cuéntanos qué buscas", text: "Nombre, marca y tamaño. Entre más detalles, mejor." },
  { title: "Averiguamos el precio", text: "Buscamos el perfume y calculamos cuánto te costaría." },
  { title: "Te respondemos", text: "Verás el precio en esta página. Cotizar no te compromete a comprar." },
];

type QuoteRow = {
  id: number;
  perfume: string;
  details: string | null;
  phone: string;
  price: number | null;
  answer: string | null;
  answered: boolean;
  created_on: string;
};

// La página es pública para que cualquiera vea cómo funciona; para enviar una
// solicitud hay que tener cuenta, así cada persona ve después sus respuestas.
export default async function QuotePage({ searchParams }: PageProps<"/cotizar">) {
  // ?perfume=... llega desde el catálogo, cuando una búsqueda no encontró nada.
  const perfume = queryText((await searchParams).perfume).slice(0, 120);
  const here = perfume ? `/cotizar?perfume=${encodeURIComponent(perfume)}` : "/cotizar";

  const user = await getCurrentUser();
  const quotes = user
    ? ((await sql`
        select id, perfume, details, phone, price, answer,
               answered_at is not null as answered,
               (created_at at time zone 'America/Bogota')::date::text as created_on
        from quotes
        where user_id = ${user.id}
        order by id desc`) as QuoteRow[])
    : [];
  const store = await getStoreSettings();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-12 pb-24 sm:px-8">
      {/* grid-cols-1: en el teléfono la columna nunca se ensancha más que la pantalla, aunque el texto sea largo. */}
      <div className="grid grid-cols-1 items-start gap-x-20 gap-y-16 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-5xl leading-[1.05] font-light tracking-tight text-balance motion-safe:animate-unveil sm:text-6xl">
            ¿No está en el catálogo?
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-ink-soft motion-safe:animate-unveil motion-safe:[animation-delay:var(--duration-micro)]">
            Dinos qué perfume buscas y te respondemos con el precio.
          </p>

          <div className="mt-10 max-w-xl motion-safe:animate-settle">
            {user ? (
              <QuoteForm defaultPerfume={perfume} defaultPhone={quotes[0]?.phone ?? ""} />
            ) : (
              <>
                {/* /auth/login lo atiende Auth0: por eso es <a> y no <Link>. */}
                <a href={`/auth/login?returnTo=${encodeURIComponent(here)}`} className={buttonStyles.primary}>
                  Entrar para cotizar
                </a>
                <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-ink-soft">
                  Necesitas una cuenta para que puedas ver la respuesta cuando la tengamos.
                </p>
              </>
            )}
          </div>
        </div>

        {quotes.length === 0 ? (
          <section aria-labelledby="como-funciona" className="motion-safe:animate-settle">
            <h2 id="como-funciona" className="font-display text-2xl">
              Cómo funciona
            </h2>
            <ol className="mt-6 flex flex-col gap-8">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-5 border-t border-line pt-5">
                  <span className="w-6 shrink-0 font-display text-3xl leading-none font-light text-ink-faint tabular-nums">{index + 1}</span>
                  <div>
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <section aria-labelledby="mis-cotizaciones">
            <h2 id="mis-cotizaciones" className="scroll-mt-24 font-display text-2xl">
              Tus cotizaciones
            </h2>
            <SpamNotice email={user?.email} className="mt-4" />
            {/* key: la lista vuelve a entrar cuando se agrega una cotización. */}
            <ul key={quotes.length} className="mt-6 border-b border-line motion-safe:animate-settle">
              {quotes.map((quote) => (
                <li key={quote.id} className="border-t border-line py-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-display text-2xl leading-tight break-words">{quote.perfume}</h3>
                      <p className="mt-1 text-xs text-ink-faint">Pedida el {formatDate(quote.created_on)}</p>
                    </div>
                    <QuoteBadge answered={quote.answered} price={quote.price} />
                  </div>
                  {quote.details && <p className="mt-3 text-sm leading-relaxed break-words whitespace-pre-line text-ink-soft">{quote.details}</p>}

                  {!quote.answered ? (
                    <p className="mt-3 text-sm text-ink-soft">Estamos averiguando el precio.</p>
                  ) : (
                    <div className="mt-4 border border-line bg-surface p-5">
                      {quote.price !== null ? (
                        <p className="font-display text-3xl tabular-nums">{formatCOP(quote.price)}</p>
                      ) : (
                        <p className="font-medium">No pudimos conseguir este perfume.</p>
                      )}
                      {quote.answer && <p className="mt-2 text-sm leading-relaxed break-words whitespace-pre-line text-ink-soft">{quote.answer}</p>}
                      {quote.price !== null && store.whatsapp && (
                        <a
                          href={whatsappLink(store.whatsapp, `Hola, quiero el ${quote.perfume} que me cotizaron en ${formatCOP(quote.price)}.`)}
                          target="_blank"
                          rel="noreferrer"
                          className={`mt-5 ${buttonStyles.secondary}`}
                        >
                          Pedirlo por WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
