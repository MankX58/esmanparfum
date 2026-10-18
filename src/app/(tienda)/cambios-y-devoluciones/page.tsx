import type { Metadata } from "next";
import { LegalLink, LegalPage, ResponsibleParty, type LegalSection } from "@/components/store/legal-page";
import { getStoreSettings } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Cambios, devoluciones y garantía",
  description: "Derecho de retracto, garantía y reversión del pago en Velare, según el Estatuto del Consumidor.",
  alternates: { canonical: "/cambios-y-devoluciones" },
};

// Derechos del consumidor en ventas a distancia, según la Ley 1480 de 2011: garantía legal
// (arts. 7 a 11), derecho de retracto (art. 47) y reversión del pago (art. 51).
export default async function ReturnsPage() {
  const store = await getStoreSettings();

  const sections: LegalSection[] = [
    {
      id: "retracto",
      title: "Derecho de retracto",
      body: (
        <>
          <p>
            En las compras a distancia la ley te permite arrepentirte de la compra dentro de los <strong>5 días hábiles</strong>{" "}
            siguientes a la entrega (art. 47 de la Ley 1480 de 2011).
          </p>
          <p>
            Los perfumes son productos de uso personal, que la ley excluye del retracto. Aun así, lo aceptamos si el perfume está{" "}
            <strong>sellado, sin abrir, sin usar y en su empaque original</strong>, con todo lo que venía en él. Un perfume abierto o
            probado no se puede devolver por retracto, porque no podemos volver a venderlo como nuevo.
          </p>
          <p>
            Para ejercerlo, escríbenos dentro de ese plazo. El costo de devolvernos el producto corre por tu cuenta. Cuando lo
            recibamos y verifiquemos su estado, te devolvemos todo lo que pagaste, sin descuentos, en un plazo máximo de 30 días
            calendario.
          </p>
        </>
      ),
    },
    {
      id: "garantia",
      title: "Garantía",
      body: (
        <>
          <p>Garantizamos que cada perfume es original y llega en buen estado. Tienes derecho a la garantía si el producto:</p>
          <ul>
            <li>Llega roto, derramado o con el empaque dañado por el transporte.</li>
            <li>No es el que pediste (otra referencia, otro tamaño o presentación).</li>
            <li>Tiene un defecto de fábrica, por ejemplo un atomizador que no funciona.</li>
            <li>No es original.</li>
          </ul>
          <p>
            En esos casos te lo cambiamos por uno igual o, si no es posible, te devolvemos el dinero. La garantía legal de los
            productos nuevos es de un año (art. 8 de la Ley 1480). Para los daños del transporte, te pedimos que nos escribas en los{" "}
            <strong>5 días hábiles</strong> siguientes a la entrega, con fotos del producto y del empaque, para poder reclamar a la
            transportadora.
          </p>
          <p>
            La garantía no cubre el desgaste normal por el uso, los daños por mal almacenamiento (calor, sol o golpes después de la
            entrega) ni que el aroma no sea de tu gusto.
          </p>
        </>
      ),
    },
    {
      id: "reversion",
      title: "Reversión del pago",
      body: (
        <>
          <p>
            Si pagaste con tarjeta de crédito, débito o un medio de pago electrónico, puedes pedir que se revierta el pago cuando
            (art. 51 de la Ley 1480):
          </p>
          <ul>
            <li>Fuiste víctima de fraude o la compra no la hiciste tú.</li>
            <li>No recibiste el producto.</li>
            <li>El producto no corresponde a lo que pediste o es defectuoso.</li>
          </ul>
          <p>
            Para hacerlo, dentro de los <strong>5 días hábiles</strong> siguientes a que te enteres del problema, preséntanos tu queja
            por los medios de abajo y pide la reversión al emisor de tu medio de pago (tu banco o la entidad de tu tarjeta). Si
            recibiste el producto, debes devolverlo en las mismas condiciones en que llegó.
          </p>
        </>
      ),
    },
    {
      id: "no-entregados",
      title: "Pedidos que no llegan o se cancelan",
      body: (
        <p>
          Si no podemos conseguir un producto o tu pedido no se puede entregar por una causa nuestra, te devolvemos todo lo que pagaste.
          Los pedidos sin pagar los puedes cancelar tú mismo desde la página del pedido.
        </p>
      ),
    },
    {
      id: "reembolsos",
      title: "Cómo te devolvemos el dinero",
      body: (
        <p>
          Devolvemos el dinero por el mismo medio con el que pagaste. Si pagaste con Wompi, el reembolso se hace a tu tarjeta o cuenta y
          el tiempo en que lo veas depende de tu banco. Si pagaste por transferencia, te transferimos a la cuenta que nos indiques a
          tu nombre. Si tu pedido tenía descuentos, se devuelve lo que pagaste realmente.
        </p>
      ),
    },
    {
      id: "como-solicitar",
      title: "Cómo hacer una solicitud",
      body: (
        <>
          <p>
            Escríbenos con tu nombre, el código o la fecha de tu pedido, qué pasó y, si aplica, fotos del producto y del empaque. Te
            respondemos en máximo 15 días hábiles.
          </p>
          <ResponsibleParty store={store} />
          <p>
            Si no quedas conforme, puedes acudir a la{" "}
            <a href="https://www.sic.gov.co" target="_blank" rel="noreferrer" className="underline decoration-line hover:decoration-ink">
              Superintendencia de Industria y Comercio
            </a>
            . Consulta también los <LegalLink href="/terminos">Términos y condiciones</LegalLink>.
          </p>
        </>
      ),
    },
  ];

  return (
    <LegalPage
      title="Cambios, devoluciones y garantía"
      intro={<p>Lo que puedes hacer si te arrepientes de una compra, si un producto llega con un problema o si hubo un error con tu pago.</p>}
      sections={sections}
    />
  );
}
