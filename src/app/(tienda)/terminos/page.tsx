import type { Metadata } from "next";
import { LegalLink, LegalPage, ResponsibleParty, type LegalSection } from "@/components/store/legal-page";
import { getStoreSettings } from "@/lib/orders";
import { TRANSFER_DISCOUNT } from "@/lib/promo";
import { deliveryEstimate } from "@/lib/site";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Condiciones de compra en Velare: productos, precios, pagos con Wompi o transferencia, envíos y garantías.",
  alternates: { canonical: "/terminos" },
};

// Términos y condiciones de compra. Basados en la Ley 1480 de 2011 (Estatuto del Consumidor),
// en especial sus reglas para ventas a distancia y comercio electrónico (arts. 46 a 51).
export default async function TermsPage() {
  const store = await getStoreSettings();

  const sections: LegalSection[] = [
    {
      id: "quienes-somos",
      title: "Quiénes somos",
      body: (
        <>
          <p>Velare es una tienda en línea de perfumes y lociones que vende en Colombia. Estos son los datos de quien responde por ella:</p>
          <ResponsibleParty store={store} />
        </>
      ),
    },
    {
      id: "aceptacion",
      title: "Aceptación de estos términos",
      body: (
        <>
          <p>
            Al hacer un pedido aceptas estos términos, la <LegalLink href="/privacidad">Política de privacidad</LegalLink> y la política de{" "}
            <LegalLink href="/cambios-y-devoluciones">Cambios, devoluciones y garantía</LegalLink>. Te lo pedimos de forma expresa con una
            casilla antes de confirmar el pedido.
          </p>
          <p>
            Para comprar debes ser mayor de edad y tener una cuenta en la tienda. Puedes crearla con tu correo o con tu cuenta de Google.
            Eres responsable de que los datos que nos des sean ciertos y de cuidar el acceso a tu cuenta.
          </p>
        </>
      ),
    },
    {
      id: "productos",
      title: "Productos",
      body: (
        <>
          <p>
            Vendemos perfumes originales, en su empaque de fábrica. Las fotos son de referencia: el empaque puede cambiar según el lote
            o la edición del fabricante. Las descripciones de los aromas son orientativas, porque cada persona percibe un perfume de
            forma distinta.
          </p>
          <p>
            Muchos productos se venden bajo pedido: los conseguimos con el proveedor después de que pagas. Si un producto se agota
            con el proveedor y no podemos conseguirlo, te avisamos y te devolvemos todo lo que pagaste, o te ofrecemos otro si lo
            prefieres.
          </p>
          <p>
            Velare no es distribuidor oficial ni está afiliada a las marcas que vende. Los nombres y logos de las marcas pertenecen a
            sus dueños y se usan solo para identificar cada producto.
          </p>
        </>
      ),
    },
    {
      id: "precios",
      title: "Precios",
      body: (
        <>
          <p>
            Los precios están en pesos colombianos y son el precio final de cada producto. El costo del envío se muestra aparte antes
            de confirmar el pedido. Si el envío se coordina contigo, te lo informamos antes de despacharlo.
          </p>
          <p>
            Los precios pueden cambiar en cualquier momento, pero el de tu pedido es el que aparecía al hacerlo. Si por un error
            evidente un producto se publica con un precio que no corresponde (por ejemplo, con un cero de menos), podemos cancelar el
            pedido y devolverte lo pagado.
          </p>
        </>
      ),
    },
    {
      id: "pedidos",
      title: "Pedidos",
      body: (
        <>
          <p>
            Un pedido queda en firme cuando se confirma su pago. Mientras no lo pagues, puedes cancelarlo desde la página del pedido.
            Puedes seguir el estado de cada pedido en <strong>Mis pedidos</strong>.
          </p>
          <p>
            Podemos rechazar o cancelar un pedido si sospechamos de fraude, si los datos de entrega no son válidos o si no podemos
            conseguir el producto. En esos casos te devolvemos todo lo que hayas pagado.
          </p>
        </>
      ),
    },
    {
      id: "pagos",
      title: "Formas de pago",
      body: (
        <>
          <p>Al hacer el pedido eliges cómo pagarlo:</p>
          <ul>
            <li>
              <strong>En línea con Wompi</strong>, la pasarela de pagos de Bancolombia: tarjeta de crédito o débito, PSE, Nequi o
              cuenta Bancolombia. Pagas en la página segura de Wompi; Velare no ve ni guarda los datos de tu tarjeta. El pedido se
              confirma cuando Wompi aprueba el pago.
            </li>
            <li>
              <strong>Por transferencia</strong>, con un {TRANSFER_DISCOUNT}% de descuento sobre el valor de los productos. Te
              mostramos el código QR y el valor exacto. Después de pagar, nos avisas desde tu pedido y lo confirmamos cuando vemos el
              dinero en nuestra cuenta. Si el valor transferido no coincide, te contactamos antes de seguir.
            </li>
          </ul>
          <p>Una vez hecho el pedido no se puede cambiar la forma de pago; si quieres otra, cancela el pedido y haz uno nuevo.</p>
        </>
      ),
    },
    {
      id: "codigos",
      title: "Códigos promocionales",
      body: (
        <ul>
          <li>Se puede usar un código por pedido, y se aplica al hacer el pedido.</li>
          <li>El descuento es un porcentaje sobre el valor de los productos; no se aplica al envío.</li>
          <li>Cada código tiene su propia vigencia y podemos pausarlo o terminarlo en cualquier momento, sin afectar los pedidos ya hechos.</li>
          <li>Se puede sumar al descuento por pagar con transferencia.</li>
          <li>Los códigos no se cambian por dinero ni se aplican a pedidos anteriores.</li>
        </ul>
      ),
    },
    {
      id: "envios",
      title: "Envíos y entrega",
      body: (
        <>
          <p>
            Enviamos a todo Colombia a la dirección que indiques en el pedido. La entrega tarda {deliveryEstimate} aproximadamente,
            contados desde que se confirma tu pago. Es un tiempo estimado: puede variar por la disponibilidad del proveedor, la
            transportadora o la ciudad de destino. Si hay un retraso importante, te avisamos.
          </p>
          <p>
            El costo del envío depende del municipio de entrega y se muestra antes de confirmar el pedido. Los perfumes contienen
            alcohol y las transportadoras los llevan por tierra: a algunas zonas, como San Andrés y Providencia o la Amazonía, puede
            no ser posible enviarlos, o el envío se coordina contigo.
          </p>
          <p>
            Cuando despachamos el pedido, verás la guía de envío en la página del pedido. Revisa que la dirección y el teléfono sean
            correctos: si el envío no se puede entregar por datos errados, el nuevo envío puede tener costo.
          </p>
        </>
      ),
    },
    {
      id: "retracto-garantia",
      title: "Retracto, cambios, garantía y reversión del pago",
      body: (
        <p>
          Tus derechos como consumidor (derecho de retracto, garantía legal y reversión del pago) y cómo ejercerlos están en la
          política de <LegalLink href="/cambios-y-devoluciones">Cambios, devoluciones y garantía</LegalLink>, que hace parte de estos
          términos.
        </p>
      ),
    },
    {
      id: "uso",
      title: "Uso del sitio",
      body: (
        <p>
          No está permitido usar el sitio para fines ilegales, intentar acceder a cuentas ajenas, alterar precios o pagos, ni copiar
          el contenido del sitio (textos, fotos y diseño) sin autorización. Podemos suspender una cuenta que incumpla estas reglas.
        </p>
      ),
    },
    {
      id: "responsabilidad",
      title: "Responsabilidad",
      body: (
        <p>
          Respondemos por los productos que vendemos en los términos de la ley colombiana. No respondemos por fallas de servicios de
          terceros que no dependan de nosotros (por ejemplo, caídas de internet, de los bancos o de la pasarela de pagos), aunque te
          ayudaremos a resolverlas. Nada de lo dicho aquí limita los derechos que la ley te da como consumidor.
        </p>
      ),
    },
    {
      id: "cambios-terminos",
      title: "Cambios a estos términos",
      body: (
        <p>
          Podemos actualizar estos términos. La versión vigente es la publicada en esta página, con su fecha. Cada pedido se rige por
          los términos vigentes el día en que se hizo.
        </p>
      ),
    },
    {
      id: "ley-quejas",
      title: "Ley aplicable, peticiones y quejas",
      body: (
        <>
          <p>
            Estos términos se rigen por las leyes de Colombia, en especial la Ley 1480 de 2011 (Estatuto del Consumidor). Si tienes una
            petición, queja o reclamo, escríbenos por los medios de la sección 1: te respondemos en un máximo de 15 días hábiles.
          </p>
          <p>
            Si no quedas conforme con nuestra respuesta, puedes acudir a la{" "}
            <a href="https://www.sic.gov.co" target="_blank" rel="noreferrer" className="underline decoration-line hover:decoration-ink">
              Superintendencia de Industria y Comercio
            </a>
            , la autoridad que protege a los consumidores en Colombia.
          </p>
        </>
      ),
    },
  ];

  return (
    <LegalPage
      title="Términos y condiciones"
      intro={<p>Estas son las reglas de compra en Velare. Las escribimos en lenguaje sencillo; si algo no queda claro, escríbenos.</p>}
      sections={sections}
    />
  );
}
