// El logotipo de Ésman Parfum (public/esman-parfum-logos). `tone` es el color del logo: "dark" para
// fondos claros y "light" para el verde de la marca. Se pide por altura (className h-*) y el ancho
// sale solo de la proporción de cada versión.
const versions = {
  horizontal: { ratio: 2483 / 640, dark: "logo-horizontal-negro.svg", light: "logo-horizontal-blanco.svg" },
  vertical: { ratio: 2181 / 1148, dark: "logo-vertical-negro.svg", light: "logo-vertical-blanco.svg" },
  symbol: { ratio: 692 / 1323, dark: "logo-simbolo-negro.svg", light: "logo-simbolo-blanco.svg" },
} as const;

export function Logo({
  variant = "horizontal",
  tone = "dark",
  className = "",
}: {
  variant?: keyof typeof versions;
  tone?: "dark" | "light";
  className?: string;
}) {
  const version = versions[variant];
  // eslint-disable-next-line @next/next/no-img-element -- SVG: next/image no lo optimiza y no hace falta
  return <img src={`/esman-parfum-logos/${version[tone]}`} alt="Ésman Parfum" style={{ aspectRatio: version.ratio }} className={`w-auto ${className}`} />;
}
