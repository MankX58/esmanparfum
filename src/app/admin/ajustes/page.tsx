import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/auth";
import { getFinanceSettings } from "@/lib/finance";
import { getStoreSettings } from "@/lib/orders";
import { wompiConfigured, wompiTestMode } from "@/lib/wompi";
import { FinanceForm } from "./finance-form";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  await requireAdmin();
  const [settings, finance] = await Promise.all([getStoreSettings(), getFinanceSettings()]);

  return (
    <div className="flex max-w-3xl flex-col gap-12 motion-safe:animate-settle">
      <div>
        <PageHeader
          title="Ajustes"
          description="El estado de los pagos con Wompi, el QR para pagar por transferencia, los datos de contacto y envío, y los valores que usan las cuentas del panel."
        />
        <SettingsForm settings={settings} wompi={{ configured: wompiConfigured(), testMode: wompiTestMode() }} />
      </div>
      <FinanceForm settings={finance} />
    </div>
  );
}
