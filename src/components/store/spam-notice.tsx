import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";

// Aviso de que enviamos correos y de que pueden caer en Spam. Marcar "No es spam" una vez
// le enseña a Gmail que nuestros correos son legítimos y los siguientes llegan a la bandeja.
export function SpamNotice({ email, className = "" }: { email?: string | null; className?: string }) {
  return (
    <p className={`flex items-start gap-3 border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-ink-soft ${className}`}>
      <EnvelopeSimple size={20} weight="light" aria-hidden className="mt-0.5 shrink-0 text-brand" />
      <span>
        Te avisaremos por correo{email ? <> a <strong className="font-medium text-ink">{email}</strong></> : null}. Si no ves
        nuestros correos, revisa tu carpeta de <strong className="font-medium text-ink">Spam</strong> o{" "}
        <strong className="font-medium text-ink">Promociones</strong> y márcalos como «No es spam» para que los siguientes
        lleguen a tu bandeja de entrada.
      </span>
    </p>
  );
}
