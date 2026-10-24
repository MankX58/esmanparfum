"use client";

// Gráficas y cifras animadas del panel. Envuelven los componentes de Arc UI (carpeta "arc",
// copiados de uiarc.dev) para darles el tema de Ésman Parfum (clase "arc"), los textos en español
// y el formato de pesos. Las páginas usan estos, no los de la carpeta "arc" directamente.
import "./arc/theme.css";
import { AnimatedCounter } from "./arc/animated-counter/animated-counter";
import { BarChart } from "./arc/bar-chart/bar-chart";
import { DonutChart } from "./arc/donut-chart/donut-chart";
import { Gauge } from "./arc/gauge/gauge";
import { formatCOP } from "@/lib/format";

// Una cifra cuyos dígitos ruedan hasta su valor al aparecer. `money` le pone el signo de pesos,
// `danger` la pinta de rojo (un saldo negativo) y `small` la hace más pequeña.
export function Counter({
  value,
  money = false,
  danger = false,
  small = false,
}: {
  value: number;
  money?: boolean;
  danger?: boolean;
  small?: boolean;
}) {
  // El contador de Arc toma su color y su tamaño de estas dos variables.
  const style = {
    ...(danger && { "--foreground": "var(--color-danger)" }),
    ...(small && { "--text-3xl": "1.5rem" }),
  } as React.CSSProperties;
  return (
    <span className="arc" style={style}>
      {/* El signo va en el prefijo ("-$ 219.608"), con un espacio que no se parte ni se pierde. */}
      <AnimatedCounter
        value={Math.abs(value)}
        prefix={`${value < 0 ? "-" : ""}${money ? "$ " : ""}`}
        locale="es-CO"
        animateOnView
      />
    </span>
  );
}

// Barras de un valor en pesos por mes. Al pasar por una barra, la cifra de arriba muestra ese mes.
export function MonthlyBars({
  label,
  period,
  months,
}: {
  label: string;
  period: string;
  months: { key: string; label: string; short: string; value: number }[];
}) {
  return (
    <div className="arc">
      <BarChart
        label={label}
        period={period}
        data={months.map((month) => ({ key: month.key, label: month.label, axisLabel: month.short, value: month.value }))}
        averageLabel="Promedio por mes"
        valueLabel="Total del mes"
        categoryLabel="Mes"
        formatValue={formatCOP}
      />
    </div>
  );
}

// Rosca que reparte un total en pesos entre sus partes. Cada parte se puede ocultar desde la leyenda.
export function MoneyDonut({ label, items }: { label: string; items: { label: string; total: number }[] }) {
  return (
    <div className="arc">
      <DonutChart
        label={label}
        data={items.map((item) => ({ key: item.label, label: item.label, value: item.total }))}
        formatValue={formatCOP}
        otherLabel="Otros"
        emptyLabel="Sin datos"
        size={176}
        thickness={20}
      />
    </div>
  );
}

// Medidor de la meta de ventas del mes: qué parte de la meta se lleva vendida.
export function GoalGauge({ label, sold, goal }: { label: string; sold: number; goal: number }) {
  return (
    <div className="arc">
      <Gauge
        label={label}
        value={Math.min(sold, goal)}
        max={goal}
        detail={`${formatCOP(sold)} de ${formatCOP(goal)}`}
        tone={sold >= goal ? "success" : "accent"}
      />
    </div>
  );
}
