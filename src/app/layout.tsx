import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next"
import { Geist, Jost } from "next/font/google";
import { Toaster } from "sileo";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// Geist: texto e interfaz. Jost: títulos, marca y etiquetas de producto.
const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const jost = Jost({ variable: "--font-jost", subsets: ["latin"] });

// Datos por defecto para buscadores y para la vista previa al compartir un enlace.
// Cada página puede poner su propio título y descripción.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl), // con esto, las direcciones relativas (fotos, canonical) salen completas
  title: { default: "Ésman Parfum · Perfumes originales para hombre y mujer en Colombia", template: "%s · Ésman Parfum" },
  description:
    "Ésman Parfum (Esman): perfumes originales para hombre, mujer y unisex con envío a toda Colombia. Elige tu fragancia, paga seguro con Wompi y recíbela en casa.",
  applicationName: "Ésman Parfum",
  keywords: ["Ésman Parfum", "Esman Parfum", "Ésman", "Esman", "perfumes originales", "perfumes Colombia", "perfumes para hombre", "perfumes para mujer", "comprar perfumes en línea"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: {
    siteName: "Ésman Parfum",
    locale: "es_CO",
    type: "website",
    title: "Ésman Parfum · Perfumes para ser recordado",
    description: "Perfumes originales para hombre, mujer y unisex con envío a toda Colombia.",
  },
  twitter: { card: "summary_large_image", title: "Ésman Parfum · Perfumes para ser recordado" },
};

// Código que da Google Search Console para comprobar que el sitio es tuyo (ver README).
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;

// Color de la barra del navegador en el teléfono: el verde salvia de la marca (--color-brand).
export const viewport: Viewport = { themeColor: "#596357", viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geist.variable} ${jost.variable} h-full antialiased`}>
      {/* Va escrita aquí y no en `metadata`: así sale siempre al principio de la página, que es
          donde la busca el verificador de Google, sin esperar a los datos de cada página. */}
      <head>{googleVerification && <meta name="google-site-verification" content={googleVerification} />}</head>
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        <Analytics />
        {/* Lo primero que encuentra quien navega con teclado: salta la cabecera y va al contenido. */}
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-brand focus:px-4 focus:py-3 focus:text-sm focus:text-on-brand"
        >
          Saltar al contenido
        </a>
        {children}
        {/* Avisos (toasts) de toda la app. Se lanzan con sileo.success(...), sileo.error(...). */}
        <Toaster position="top-center" theme="light" options={{ fill: "#596357", roundness: 6, duration: 2000 }} />
      </body>
    </html>
  );
}
