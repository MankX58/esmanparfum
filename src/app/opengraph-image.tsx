import { ImageResponse } from "next/og";
import { LogoMark } from "@/components/logo-mark";

// Imagen que aparece al compartir un enlace de la tienda (WhatsApp, redes) cuando la
// página no tiene una foto propia. Un perfume con fotos usa la suya.
export const alt = "Ésman Parfum. Perfumes para ser recordado.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#596357",
          color: "#f6f8f5",
        }}
      >
        <div style={{ display: "flex", width: 150, height: 150 }}>
          <LogoMark size={150} />
        </div>
        <div style={{ marginTop: 28, fontSize: 76, letterSpacing: 22, marginRight: -22 }}>ÉSMAN PARFUM</div>
        <div style={{ marginTop: 20, fontSize: 36, color: "#dfe5dc" }}>Perfumes para ser recordado</div>
      </div>
    ),
    size,
  );
}
