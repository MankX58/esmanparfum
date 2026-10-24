import type { Metadata } from "next";
import { LegalLink, LegalPage, ResponsibleParty, type LegalSection } from "@/components/store/legal-page";
import { getStoreSettings } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo trata Ésman Parfum tus datos personales y cómo ejercer tus derechos, según la Ley 1581 de 2012.",
  alternates: { canonical: "/privacidad" },
};

// Política de tratamiento de datos personales. Sigue la Ley 1581 de 2012 y el Decreto 1377
// de 2013 (hoy en el Decreto 1074 de 2015), que piden decir quién trata los datos, para qué,
// los derechos del titular, cómo ejercerlos y desde cuándo rige la política.
export default async function PrivacyPage() {
  const store = await getStoreSettings();

  const sections: LegalSection[] = [
    {
      id: "responsable",
      title: "Responsable del tratamiento",
      body: (
        <>
          <p>El responsable de tus datos personales es:</p>
          <ResponsibleParty store={store} />
          <p>Por esos mismos medios atendemos cualquier consulta o reclamo sobre tus datos.</p>
        </>
      ),
    },
    {
      id: "datos",
      title: "Qué datos recogemos",
      body: (
        <>
          <ul>
            <li>
              <strong>De tu cuenta:</strong> tu nombre y tu correo. Si entras con Google, también vemos tu foto de perfil, que solo se
              muestra en el menú de tu cuenta y no guardamos.
            </li>
            <li>
              <strong>De tus pedidos:</strong> el nombre de quien recibe, teléfono, dirección, ciudad, notas de entrega, los productos
              que compras, los valores y el estado de cada pedido.
            </li>
            <li>
              <strong>De tus pagos:</strong> si pagas con Wompi, Wompi recibe los datos de tu medio de pago; nosotros solo recibimos el
              número de la transacción y si fue aprobada. Si pagas por transferencia, guardamos lo que nos escribas al avisar el pago
              (por ejemplo, desde qué cuenta pagaste).
            </li>
            <li>
              <strong>De tus cotizaciones:</strong> el perfume que buscas, los detalles que nos des y tu WhatsApp.
            </li>
            <li>
              <strong>Técnicos:</strong> las cookies necesarias para mantener tu sesión abierta y el contenido de tu carrito, que se
              guarda en tu propio navegador.
            </li>
          </ul>
          <p>No pedimos datos sensibles (como salud u origen étnico) ni recogemos a sabiendas datos de menores de edad.</p>
        </>
      ),
    },
    {
      id: "finalidades",
      title: "Para qué los usamos",
      body: (
        <>
          <ul>
            <li>Crear y administrar tu cuenta.</li>
            <li>Procesar tus pedidos, confirmar tus pagos y enviarte los productos.</li>
            <li>Responder tus cotizaciones, preguntas, quejas y solicitudes de garantía.</li>
            <li>Escribirte por WhatsApp o correo sobre tus pedidos y cotizaciones.</li>
            <li>Llevar la contabilidad de la tienda y cumplir obligaciones legales, tributarias y contables.</li>
            <li>Prevenir fraudes y proteger la seguridad del sitio.</li>
          </ul>
          <p>
            No vendemos ni alquilamos tus datos, y no te enviaremos publicidad sin pedirte una autorización aparte para eso.
          </p>
        </>
      ),
    },
    {
      id: "terceros",
      title: "Con quién los compartimos",
      body: (
        <>
          <p>Solo compartimos tus datos con quienes nos ayudan a prestar el servicio, y solo lo necesario para cada tarea:</p>
          <ul>
            <li>
              <strong>Auth0 (Okta):</strong> el inicio de sesión.
            </li>
            <li>
              <strong>Vercel y Neon:</strong> el alojamiento del sitio y la base de datos.
            </li>
            <li>
              <strong>Wompi (Bancolombia):</strong> los pagos en línea.
            </li>
            <li>
              <strong>La transportadora</strong> que lleve tu pedido: nombre, teléfono y dirección de entrega.
            </li>
          </ul>
          <p>
            Algunos de estos proveedores guardan la información en servidores fuera de Colombia, por ejemplo en Estados Unidos. En
            esos casos actúan como encargados: tratan los datos por cuenta nuestra, con medidas de seguridad y bajo sus propias
            políticas de privacidad. También entregaremos datos a una autoridad cuando la ley lo exija.
          </p>
        </>
      ),
    },
    {
      id: "cookies",
      title: "Cookies y almacenamiento en tu navegador",
      body: (
        <p>
          Usamos solo cookies necesarias: las que mantienen tu sesión abierta de forma segura. El carrito se guarda en el
          almacenamiento de tu navegador y no sale de tu equipo hasta que haces el pedido. No usamos cookies de publicidad ni de
          seguimiento. Si borras las cookies o el almacenamiento del navegador, se cierra tu sesión y se vacía el carrito.
        </p>
      ),
    },
    {
      id: "derechos",
      title: "Tus derechos",
      body: (
        <>
          <p>Como titular de tus datos tienes derecho a (art. 8 de la Ley 1581 de 2012):</p>
          <ul>
            <li>Conocer, actualizar y corregir tus datos.</li>
            <li>Pedir prueba de la autorización que nos diste.</li>
            <li>Saber, si lo pides, qué uso le hemos dado a tus datos.</li>
            <li>
              Pedir que eliminemos tus datos o revocar tu autorización, salvo los que debamos conservar por una obligación legal o
              contractual (por ejemplo, los registros contables de tus compras).
            </li>
            <li>Consultar gratis tus datos.</li>
            <li>
              Presentar quejas ante la{" "}
              <a href="https://www.sic.gov.co" target="_blank" rel="noreferrer" className="underline decoration-line hover:decoration-ink">
                Superintendencia de Industria y Comercio
              </a>
              , después de haber hecho tu consulta o reclamo con nosotros.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "como-ejercerlos",
      title: "Cómo ejercer tus derechos",
      body: (
        <>
          <p>
            Escríbenos al correo o WhatsApp de la sección 1 con tu nombre, tu número de identificación, lo que necesitas y el medio por
            el que quieres la respuesta.
          </p>
          <ul>
            <li>
              <strong>Consultas</strong> (saber qué datos tenemos y cómo los usamos): respondemos en máximo 10 días hábiles. Si
              necesitamos más tiempo te avisamos, y en ningún caso pasaremos de 5 días hábiles adicionales.
            </li>
            <li>
              <strong>Reclamos</strong> (corregir, actualizar o eliminar datos, o revocar la autorización): respondemos en máximo 15
              días hábiles, prorrogables hasta por 8 días hábiles más avisándote el motivo.
            </li>
          </ul>
          <p>Puedes actualizar tus datos de entrega en tu próximo pedido.</p>
        </>
      ),
    },
    {
      id: "conservacion",
      title: "Cuánto tiempo los guardamos",
      body: (
        <p>
          Guardamos tus datos mientras tengas una cuenta o una relación comercial con nosotros, y después solo el tiempo que exijan las
          normas contables y tributarias para los registros de tus compras. Cuando ya no sean necesarios, los eliminamos.
        </p>
      ),
    },
    {
      id: "seguridad",
      title: "Seguridad",
      body: (
        <p>
          Protegemos tus datos con conexiones cifradas, acceso restringido al panel de administración y proveedores que cumplen
          estándares de seguridad. Ningún sistema es infalible: si detectamos un incidente que afecte tus datos, te lo informaremos y
          lo reportaremos a la autoridad como lo pide la ley.
        </p>
      ),
    },
    {
      id: "autorizacion",
      title: "Tu autorización",
      body: (
        <p>
          Nos autorizas a tratar tus datos para las finalidades de esta política al marcar la casilla de autorización cuando haces un
          pedido o pides una cotización. Guardamos la fecha en que lo hiciste como prueba. Al crear tu cuenta también aceptas que
          usemos tu nombre y tu correo para administrarla. Consulta además los <LegalLink href="/terminos">Términos y condiciones</LegalLink>.
        </p>
      ),
    },
    {
      id: "vigencia",
      title: "Vigencia",
      body: (
        <p>
          Esta política rige desde el 18 de octubre de 2026. Si la cambiamos de forma importante, lo publicaremos en esta página y, si
          el cambio afecta las finalidades para las que nos diste tus datos, te pediremos una nueva autorización.
        </p>
      ),
    },
  ];

  return (
    <LegalPage
      title="Política de privacidad"
      intro={
        <p>
          Esta es la política de tratamiento de datos personales de Ésman Parfum, según la Ley 1581 de 2012 y sus decretos. Explica qué
          datos recogemos, para qué los usamos y cómo puedes consultarlos, corregirlos o pedir que los eliminemos.
        </p>
      }
      sections={sections}
    />
  );
}
