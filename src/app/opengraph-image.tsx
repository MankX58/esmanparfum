import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// Imagen que aparece al compartir un enlace de la tienda (WhatsApp, redes) cuando la
// página no tiene una foto propia. Un perfume con fotos usa la suya.
export const alt = "Ésman Parfum. Perfumes para ser recordado.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  // El monograma de la marca en blanco (public/esman-parfum-logos), como imagen incrustada.
  const symbol = await readFile(path.join(process.cwd(), "public/esman-parfum-logos/logo-simbolo-blanco-1024.png"));
  const symbolUrl = `data:image/png;base64,${symbol.toString("base64")}`;

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
        {/* eslint-disable-next-line @next/next/no-img-element -- imagen de Satori (next/og), no una página */}
        <img src={symbolUrl} alt="" width={163} height={312} />
        <div style={{ marginTop: 30, fontSize: 76, letterSpacing: 22, marginRight: -22 }}>ÉSMAN PARFUM</div>
        <div style={{ marginTop: 18, fontSize: 34, color: "#dfe5dc" }}>Perfumes para ser recordado</div>
      </div>
    ),
    size,
  );
}
