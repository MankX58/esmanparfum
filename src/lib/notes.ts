// Notas olfativas de un perfume, como las publica Fragrantica: pirámide de salida, corazón y
// fondo, o una sola lista ("all") cuando el perfume no tiene pirámide. Sin acceso a la base de
// datos: también lo usa la galería en el navegador.

export type Notes = { top?: string[]; heart?: string[]; base?: string[]; all?: string[]; source?: string };
export type NoteLevel = "top" | "heart" | "base" | "all";

export const noteLevels: { key: NoteLevel; label: string; hint: string }[] = [
  { key: "top", label: "Salida", hint: "Lo primero que se siente, los primeros minutos." },
  { key: "heart", label: "Corazón", hint: "El carácter del perfume, durante las primeras horas." },
  { key: "base", label: "Fondo", hint: "Lo que queda en la piel al final del día." },
  { key: "all", label: "Notas", hint: "Solo si el perfume no tiene pirámide: todas sus notas juntas." },
];

// Los niveles que tienen notas, en orden.
export const filledLevels = (notes: Notes | null | undefined) =>
  noteLevels.filter((level) => (notes?.[level.key]?.length ?? 0) > 0);

export const hasNotes = (notes: Notes | null | undefined) => filledLevels(notes).length > 0;

// "bergamota, limón,  menta" → ["bergamota", "limón", "menta"]. Máximo 20 notas de 40 letras.
export const parseNoteList = (text: string) =>
  text
    .split(/[,\n]/)
    .map((note) => note.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((note) => note.slice(0, 40));

// "flor de azahar" → "Flor de azahar".
export const noteLabel = (note: string) => note.charAt(0).toUpperCase() + note.slice(1);
