"use client";

import Image from "next/image";
import { useRef } from "react";

// El QR de pago. Al tocarlo se abre en grande para escanearlo desde otro teléfono.
// Usa el <dialog> del navegador: se cierra con Escape, con el botón o tocando fuera.
export function QrImage({ src }: { src: string }) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label="Ampliar el código QR"
        className="shrink-0 cursor-zoom-in bg-surface p-2 transition duration-(--duration-quick) ease-smooth-out hover:-translate-y-0.5 active:scale-98"
      >
        <Image src={src} alt="Código QR para pagar" width={192} height={192} className="size-48 object-contain" />
        <span className="mt-1 block text-xs text-ink-soft">Toca para ampliar</span>
      </button>

      <dialog
        ref={dialog}
        // Un clic en el fondo oscuro (el propio dialog, no su contenido) lo cierra.
        onClick={(event) => event.target === dialog.current && dialog.current?.close()}
        className="m-auto max-h-[92dvh] max-w-[92vw] bg-surface p-0 backdrop:bg-ink/70 open:motion-safe:animate-modal"
      >
        <div className="flex flex-col items-center gap-4 p-4 sm:p-6">
          <Image src={src} alt="Código QR para pagar, ampliado" width={640} height={640} className="h-auto max-h-[72dvh] w-[min(80vw,34rem)] object-contain" />
          <button type="button" onClick={() => dialog.current?.close()} className="h-11 px-6 text-sm underline decoration-line hover:decoration-ink">
            Cerrar
          </button>
        </div>
      </dialog>
    </>
  );
}
