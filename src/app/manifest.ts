import type { MetadataRoute } from "next";

// /manifest.webmanifest: nombre, colores e icono de la tienda para el teléfono
// (al guardarla en la pantalla de inicio) y para los buscadores.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ésman Parfum",
    short_name: "Ésman",
    description: "Perfumes originales con envío en Colombia.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f8f5",
    theme_color: "#596357",
    icons: [{ src: "/icon", sizes: "192x192", type: "image/png" }],
  };
}
