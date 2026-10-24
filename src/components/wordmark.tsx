// El nombre de la marca, siempre escrito igual: Jost en mayúsculas espaciadas.
export function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`font-display tracking-[0.22em] whitespace-nowrap uppercase sm:tracking-[0.32em] ${className}`}>Ésman Parfum</span>;
}
