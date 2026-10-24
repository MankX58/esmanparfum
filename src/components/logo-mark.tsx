// El símbolo de Ésman Parfum: una É clara sobre el verde salvia de la marca, de esquinas rectas.
// Solo se usa para generar imágenes (icono de la pestaña, icono del teléfono, vista previa
// al compartir), por eso lleva estilos en línea y colores fijos en lugar de clases de Tailwind.
// `size` es el lado de la É en píxeles; el fondo llena todo el espacio disponible.
export function LogoMark({ size }: { size: number }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#596357" }}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <path d="M17 17 H33 M17 28.5 H31 M17 40 H33 M17 17 V40 M21 11 L28 5" stroke="#f6f8f5" strokeWidth="3.5" />
      </svg>
    </div>
  );
}
