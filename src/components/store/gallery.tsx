"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { noteInfo } from "@/lib/note-info";
import { filledLevels, hasNotes, noteLabel, type Notes } from "@/lib/notes";

// Fotos de un producto en su página: una grande y, si hay más, miniaturas para cambiarla.
// Después de las fotos va una diapositiva con las notas olfativas (si el perfume las tiene). Su
// fondo toma el tono del fondo de la primera foto, medido en el navegador, para que parezca
// una foto más de la misma sesión. Sin fotos, la primera diapositiva es `fallback` (la etiqueta).
type Slide = { type: "photo"; src: string } | { type: "fallback" } | { type: "notes" };

export function Gallery({
  images,
  alt,
  notes,
  fallback,
}: {
  images: string[];
  alt: string;
  notes?: Notes | null;
  fallback?: React.ReactNode;
}) {
  const [current, setCurrent] = useState(0);
  const [tone, setTone] = useState<string | null>(null);

  const slides: Slide[] = [
    ...(images.length > 0 ? images.map((src) => ({ type: "photo" as const, src })) : [{ type: "fallback" as const }]),
    ...(hasNotes(notes) ? [{ type: "notes" as const }] : []),
  ];
  const slide = slides[current] ?? slides[0];
  const key = (item: Slide, index: number) => (item.type === "photo" ? item.src : `${item.type}-${index}`);

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden bg-surface">
        {/* key: al cambiar de diapositiva, la nueva entra con una transición corta. */}
        {slide.type === "photo" ? (
          <Image
            key={slide.src}
            src={slide.src}
            alt={alt}
            fill
            priority
            sizes="(min-width: 1024px) 32rem, 100vw"
            className="object-cover motion-safe:animate-settle"
            // Con la primera foto cargada se mide su tono de fondo (una sola vez).
            onLoad={current === 0 && tone === null ? (event) => setTone(edgeTone(event.currentTarget)) : undefined}
          />
        ) : slide.type === "notes" ? (
          <NotesSlide key="notes" notes={notes!} />
        ) : (
          <div key="fallback" className="absolute inset-0 motion-safe:animate-settle">
            {fallback}
          </div>
        )}
      </div>

      {slides.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-3">
          {slides.map((item, index) => (
            <li key={key(item, index)}>
              <button
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={item.type === "notes" ? "Ver las notas olfativas" : `Ver la foto ${index + 1} de ${slides.length}`}
                aria-current={index === current}
                className="relative block aspect-square w-full overflow-hidden bg-surface opacity-60 transition-opacity duration-(--duration-quick) ease-smooth-out hover:opacity-100 aria-[current=true]:opacity-100 aria-[current=true]:outline-2 aria-[current=true]:outline-offset-2 aria-[current=true]:outline-ink"
              >
                {item.type === "photo" ? (
                  <Image src={item.src} alt="" fill sizes="6rem" className="object-cover" />
                ) : item.type === "notes" ? (
                  // Miniatura de las notas: el mismo tono, con la palabra "Notas".
                  <span
                    style={tone ? { background: tone } : undefined}
                    className={`grid size-full place-items-center bg-mist font-display text-[11px] tracking-[0.16em] uppercase ${textOn(tone)}`}
                  >
                    Notas
                  </span>
                ) : (
                  // Miniatura de la etiqueta (cuando no hay fotos): la inicial del perfume sobre el verde.
                  <span className="grid size-full place-items-center bg-brand font-display text-lg text-on-brand">
                    {alt.charAt(0)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Cuánto dura cada nivel sobre la piel y qué tanto de la barra ocupa (la pirámide, de lado).
// "strength": la barra se hace más intensa hacia el fondo, como el perfume se asienta en la piel.
const levelTime: Record<string, { label: string; width: string; strength: number }> = {
  top: { label: "Primeros minutos", width: "28%", strength: 0.5 },
  heart: { label: "Primeras horas", width: "62%", strength: 0.75 },
  base: { label: "Todo el día", width: "100%", strength: 1 },
};

// La diapositiva de notas: cada nivel (salida → corazón → fondo) con una línea fina que se alarga
// según cuánto dura, y sus notas como pastillas de contorno. Sin iconos: solo tipografía y líneas.
function NotesSlide({ notes }: { notes: Notes }) {
  const levels = filledLevels(notes);
  const count = levels.reduce((total, level) => total + notes[level.key]!.length, 0);
  const dense = count > 14; // con muchas notas las pastillas se achican para que quepan en la "foto" (4:5)
  // La nota abierta: su explicación sale en una tarjeta sobre la parte baja de la diapositiva.
  const [open, setOpen] = useState<{ note: string; level: string } | null>(null);
  const openInfo = open ? noteInfo(open.note) : null;
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <div
      style={{
        backgroundColor: "#f7f4f0",
        backgroundImage: "linear-gradient(rgb(255 255 255 / 0.22), rgb(255 255 255 / 0.22))",
        "--accent": "#8a6232",
      } as React.CSSProperties}
      className="absolute inset-0 flex flex-col justify-center bg-[#f7f4f0] px-6 py-8 text-ink motion-safe:animate-settle sm:px-10"
      onClick={() => setOpen(null)}
    >
      <p className="font-display text-xs tracking-[0.24em] uppercase opacity-70">Notas olfativas</p>
      <ol className="mt-6 flex flex-col gap-6">
        {levels.map((level, index) => {
          const time = levelTime[level.key];
          return (
            <li
              key={level.key}
              style={{ animationDelay: `calc(var(--duration-micro) * ${index + 1})` }}
              className="group motion-safe:animate-unveil"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-xl font-light sm:text-2xl">{level.label}</p>
                {time && <p className="text-[10px] tracking-[0.18em] uppercase opacity-55">{time.label}</p>}
              </div>
              {time && (
                <div aria-hidden className="mt-2 h-px w-full bg-current/10">
                  {/* La línea se dibuja de izquierda a derecha, un nivel tras otro. */}
                  <div
                    className="h-px origin-left bg-(--accent) motion-safe:animate-grow transition-[height] duration-(--duration-quick) ease-smooth-out group-hover:h-0.5"
                    style={{ width: time.width, opacity: time.strength, animationDelay: `calc(var(--duration-micro) * ${index + 2})` }}
                  />
                </div>
              )}
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {notes[level.key]!.map((note, position) => (
                  <li
                    key={note}
                    style={{ animationDelay: `calc(var(--duration-stagger) * ${index * 4 + position + 3})` }}
                    className="motion-safe:animate-unveil"
                  >
                    <button
                      type="button"
                      aria-expanded={open?.note === note}
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpen(open?.note === note ? null : { note, level: level.label });
                      }}
                      className={`group/pill relative cursor-pointer overflow-hidden rounded-full border border-(--accent)/35 bg-(--accent)/10 font-light transition-[translate,background-color,border-color] duration-(--duration-quick) ease-smooth-out hover:-translate-y-0.5 hover:border-(--accent)/80 hover:bg-(--accent)/25 aria-expanded:border-(--accent) aria-expanded:bg-(--accent)/30 ${
                        dense ? "px-2.5 py-0.5 text-xs" : "px-3.5 py-1 text-sm sm:text-base"
                      }`}
                    >
                      {/* Destello que cruza la pastilla al pasar el cursor. */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-linear-to-r from-transparent via-white/40 to-transparent group-hover/pill:animate-sheen"
                      />
                      {noteLabel(note)}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
      {open && (
        <div
          key={open.note}
          role="dialog"
          aria-label={noteLabel(open.note)}
          onClick={(event) => event.stopPropagation()}
          className="absolute inset-x-3 bottom-3 rounded-sm bg-ink p-4 text-paper shadow-xl motion-safe:animate-rise sm:inset-x-5 sm:bottom-5 sm:p-5"
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Cerrar"
            className="absolute top-2 right-2 grid size-8 place-items-center text-lg leading-none opacity-60 transition-opacity duration-(--duration-quick) hover:opacity-100"
          >
            ×
          </button>
          <p className="text-[10px] tracking-[0.2em] uppercase opacity-60">{open.level}</p>
          <p className="mt-0.5 pr-8 font-display text-lg font-light">{noteLabel(open.note)}</p>
          <p className="mt-1.5 text-sm leading-relaxed opacity-85">{openInfo ?? "Aún no tenemos una descripción de esta nota."}</p>
        </div>
      )}
      {notes.source && !open && <p className="absolute right-6 bottom-4 text-[11px] opacity-50 sm:right-10">Notas según Fragrantica</p>}
    </div>
  );
}

// Promedio del color del borde de una foto (los fondos de estudio suelen ser lisos).
// La imagen viene del mismo sitio (/_next/image), así que el navegador deja leer sus píxeles.
function edgeTone(img: HTMLImageElement): string | null {
  try {
    const width = 40;
    const height = 50;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(img, 0, 0, width, height);
    const { data } = context.getImageData(0, 0, width, height);
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Solo un marco de 3 píxeles alrededor: ahí casi nunca está el frasco.
        if (x > 2 && x < width - 3 && y > 2 && y < height - 3) continue;
        const i = (y * width + x) * 4;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
    }
    return `rgb(${Math.round(r / count)} ${Math.round(g / count)} ${Math.round(b / count)})`;
  } catch {
    return null; // si el navegador no deja leer la imagen, queda el tono neutro de la tienda
  }
}

// Texto oscuro sobre fondos claros y claro sobre fondos oscuros.
function textOn(tone: string | null) {
  const [r, g, b] = (tone?.match(/\d+/g) ?? ["240", "240", "236"]).map(Number);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.55 ? "text-ink" : "text-paper";
}
