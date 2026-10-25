"use client"; // Las pantallas de error de Next.js deben ser componentes de cliente.

import { useEffect } from "react";
import { buttonStyles } from "@/components/button";

// Se muestra si una página del panel falla al cargar (por ejemplo, sin conexión a la base de datos).
export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="border border-line bg-surface px-6 py-14">
      <h1 className="font-display text-2xl">No pudimos cargar esta página</h1>
      <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
        Suele ser un problema pasajero de conexión con la base de datos. Vuelve a intentarlo; si sigue fallando, revisa
        tu conexión a internet.
      </p>
      {/* El código identifica este error en los registros de Vercel (Logs → buscar el digest). */}
      {error.digest && <p className="mt-3 text-xs text-ink-faint">Código del error: {error.digest}</p>}
      <button onClick={() => retry()} className={`mt-6 ${buttonStyles.primary}`}>
        Reintentar
      </button>
    </div>
  );
}
