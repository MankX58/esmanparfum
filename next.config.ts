import type { NextConfig } from "next";

// Política de contenido (CSP): lista lo único que la página puede cargar o a dónde puede enviar datos.
// Si alguien lograra meter código ajeno en una página, el navegador lo bloquea.
// - script 'unsafe-inline': Next.js escribe pequeños scripts en la página para arrancar; sin ese permiso
//   habría que firmarlos uno a uno (nonce). Aun así solo se cargan scripts de este sitio y de Vercel Analytics.
// - style 'unsafe-inline': los estilos en línea de React y de las notificaciones.
// - img: fotos del sitio, de Vercel Blob y la foto de perfil de Google.
// - form-action: los formularios solo envían a este sitio y a Wompi (pago).
const isDev = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://lh3.googleusercontent.com",
  "font-src 'self' data:",
  `connect-src 'self' https://va.vercel-scripts.com${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
  "form-action 'self' https://checkout.wompi.co https://*.auth0.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  images: {
    // Las fotos de producto que se suben desde el panel viven en Vercel Blob.
    // Solo se aceptan imágenes de ese almacenamiento, de ningún otro sitio.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },

  experimental: {
    // Subir una foto pasa por una acción del servidor, que por defecto acepta hasta 1 MB.
    // La foto llega ya reducida por el navegador (unos 300 KB); 2 MB deja margen de sobra.
    serverActions: { bodySizeLimit: "2mb" },
  },

  poweredByHeader: false, // no anuncia "X-Powered-By: Next.js": una pista menos para quien busca fallos conocidos

  // Cabeceras de seguridad para todas las páginas.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" }, // el navegador no adivina tipos de archivo
          { key: "X-Frame-Options", value: "DENY" }, // nadie puede mostrar la tienda o el panel dentro de otra página
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
          // Solo HTTPS durante 2 años (los navegadores lo ignoran en http://localhost).
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          // Otras páginas no pueden quedarse con una referencia a esta ventana.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
      // Lo personal (panel, pedidos, carrito, acceso) nunca se guarda en cachés ni en el historial
      // del navegador: tras cerrar sesión, "atrás" no vuelve a mostrarlo. Tampoco se indexa.
      {
        source: "/:area(admin|pedidos|checkout|carrito|entrar|sin-acceso|auth)/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
