"use client";

import Image from "next/image";
import { useState } from "react";
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
          <NotesSlide key="notes" notes={notes!} tone={tone} />
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

// La diapositiva de notas: salida, corazón y fondo, una debajo de otra, en la tipografía de la marca.
function NotesSlide({ notes, tone }: { notes: Notes; tone: string | null }) {
  const levels = filledLevels(notes);
  // Con muchas notas la letra baja un poco para que todo quepa en la "foto" (siempre 4:5).
  const count = levels.reduce((total, level) => total + notes[level.key]!.length, 0);
  const noteSize = count > 18 ? "text-sm sm:text-base" : count > 11 ? "text-base sm:text-xl" : "text-lg sm:text-2xl";
  const gap = count > 18 ? "py-2.5 sm:py-3" : "py-4 sm:py-5";
  return (
    <div
      style={tone ? { background: tone } : undefined}
      className={`absolute inset-0 flex flex-col justify-center bg-mist px-7 py-10 motion-safe:animate-settle sm:px-12 ${textOn(tone)}`}
    >
      <p className="font-display text-xs tracking-[0.24em] uppercase opacity-70">Notas olfativas</p>
      <dl className="mt-4 flex flex-col">
        {levels.map((level, index) => (
          <div
            key={level.key}
            style={{ animationDelay: `calc(var(--duration-micro) * ${index + 1})` }}
            className={`border-t border-current/15 motion-safe:animate-unveil ${gap}`}
          >
            <dt className="text-[11px] tracking-[0.2em] uppercase opacity-60">{level.label}</dt>
            <dd className={`mt-1.5 font-display leading-snug font-light text-balance ${noteSize}`}>
              {notes[level.key]!.map(noteLabel).join(" · ")}
            </dd>
          </div>
        ))}
      </dl>
      {notes.source && <p className="absolute right-7 bottom-5 text-[11px] opacity-50 sm:right-12">Notas según Fragrantica</p>}
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
