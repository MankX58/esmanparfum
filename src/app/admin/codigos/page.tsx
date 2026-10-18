import { ActionButton } from "@/components/action-button";
import { buttonStyles } from "@/components/button";
import { ConfirmButton } from "@/components/confirm-button";
import { PageHeader } from "@/components/page-header";
import { cell, fromMd, numberCell, row, th } from "@/components/products-table";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatCOP, formatDate } from "@/lib/format";
import { deletePromoCode, togglePromoCode } from "./actions";
import { PromoForm } from "./promo-form";

export const metadata = { title: "Códigos promocionales" };

type PromoRow = {
  id: number;
  code: string;
  percent: number;
  last_day: string | null; // último día en que sirve (hora de Colombia); null = sin vencimiento
  expired: boolean;
  is_active: boolean;
  uses: number; // pedidos pagados que lo usaron
  discounted: number; // pesos descontados en esos pedidos
};

export default async function PromoCodesPage() {
  await requireAdmin();

  // Usos: solo pedidos pagados. Un pedido sin pagar o cancelado no fue un descuento real.
  const promos = (await sql`
    select p.id, p.code, p.percent, p.is_active,
           ((p.expires_at at time zone 'America/Bogota') - interval '1 second')::date::text as last_day,
           coalesce(p.expires_at <= now(), false) as expired,
           count(distinct o.id)::int as uses,
           -- Solo la parte del código: el descuento por transferencia va aparte.
           coalesce(sum(round(oi.quantity * oi.unit_price * o.promo_percent / 100.0)), 0)::int as discounted
    from promo_codes p
    left join orders o on o.promo_code = p.code and o.status not in ('pending', 'payment_reported', 'cancelled')
    left join order_items oi on oi.order_id = o.id
    group by p.id
    order by p.is_active desc, p.created_at desc`) as PromoRow[];

  return (
    <div className="flex flex-col gap-10 motion-safe:animate-settle">
      <PageHeader
        title="Códigos promocionales"
        description="El cliente escribe el código al hacer el pedido y recibe el descuento sobre el valor de los productos (el envío no se descuenta). El código y el descuento quedan guardados en el pedido y en Ventas."
      />

      <PromoForm />

      {promos.length === 0 ? (
        <div className="border border-line bg-surface px-6 py-14">
          <h2 className="font-medium">Todavía no hay códigos</h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
            Crea el primero arriba. Puedes pausarlo cuando quieras sin borrarlo.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className={th}>Código</th>
                <th className={`${th} text-right`}>Descuento</th>
                <th className={th}>Vigencia</th>
                <th className={`${th} ${fromMd} text-right`}>Usos</th>
                <th className={`${th} ${fromMd} text-right`}>Descontado</th>
                <th className={th}>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {promos.map((promo) => {
                const state = promo.expired ? "Vencido" : promo.is_active ? "Activo" : "Pausado";
                return (
                  <tr key={promo.id} className={row}>
                    <td className={`${cell} py-4`}>
                      <p className="font-medium tracking-wide">{promo.code}</p>
                      <span
                        className={`mt-1 inline-block px-2 py-1 text-[11px] leading-none font-medium tracking-[0.08em] uppercase ${
                          state === "Activo" ? "bg-ok-soft text-ok" : "bg-mist text-ink-soft"
                        }`}
                      >
                        {state}
                      </span>
                    </td>
                    <td className={numberCell}>{promo.percent}%</td>
                    <td className={`${cell} py-4 text-ink-soft`}>
                      {promo.last_day ? `${promo.expired ? "Venció" : "Hasta"} el ${formatDate(promo.last_day)}` : "Ilimitado"}
                    </td>
                    <td className={`${numberCell} ${fromMd}`}>{promo.uses}</td>
                    <td className={`${numberCell} ${fromMd} text-ink-soft`}>{formatCOP(promo.discounted)}</td>
                    <td className={`${cell} py-4`}>
                      <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
                        {!promo.expired && (
                          <ActionButton
                            action={togglePromoCode.bind(null, promo.id)}
                            label={promo.is_active ? "Pausar" : "Activar"}
                            successMessage={promo.is_active ? "Código pausado" : "Código activado"}
                            className={buttonStyles.secondary}
                          />
                        )}
                        <ConfirmButton
                          action={deletePromoCode.bind(null, promo.id)}
                          label="Borrar"
                          question="¿Borrar?"
                          confirmLabel="Sí"
                          successMessage="Código borrado"
                          failureTitle="No se pudo borrar"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
