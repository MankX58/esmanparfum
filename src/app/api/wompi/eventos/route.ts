import { applyTransaction, verifyEvent } from "@/lib/wompi";

// Aquí Wompi avisa cada cambio de una transacción (evento transaction.updated).
// Esta dirección se registra en el panel de Wompi: Desarrolladores → URL de eventos.
// Solo se cree un aviso con la firma correcta. Wompi reintenta si no recibe un 200.
export async function POST(request: Request) {
  let event;
  try {
    event = await request.json();
  } catch {
    return new Response("JSON no válido", { status: 400 });
  }
  if (!verifyEvent(event)) return new Response("Firma no válida", { status: 401 });

  if (event.event === "transaction.updated" && event.data?.transaction) {
    await applyTransaction(event.data.transaction);
  }
  return new Response("ok");
}
