import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getStoreSettings } from "@/lib/orders";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Hacer el pedido", robots: { index: false } };

// Para pedir hay que tener cuenta: así cada persona puede ver después el estado de su pedido.
export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const { shippingRates } = await getStoreSettings();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-12 pb-24 sm:px-8">
      <h1 className="mb-10 font-display text-5xl font-light tracking-tight motion-safe:animate-unveil sm:text-6xl">
        Hacer el pedido
      </h1>
      <CheckoutForm defaultName={user.name && !user.name.includes("@") ? user.name : ""} shippingRates={shippingRates} />
    </main>
  );
}
