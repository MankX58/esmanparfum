import nodemailer from "nodemailer";
import { absoluteUrl } from "./site";

// Envío de correos por SMTP (Gmail, Outlook o el correo de tu dominio). Se configura con las
// variables SMTP_* y EMAIL_FROM (ver .env.example). Sin ellas, los correos no se envían y la
// tienda sigue funcionando igual: solo queda un aviso en el registro del servidor.

const port = Number(process.env.SMTP_PORT ?? 465);
const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // 465 = conexión cifrada desde el inicio; 587 = se cifra después (STARTTLS)
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    })
  : null;

export const emailConfigured = () => transport !== null;

// Lo que viene de un cliente (nombres, notas, guías) se escapa antes de ponerlo en el HTML.
export const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type Email = {
  to: string | string[];
  subject: string;
  title: string; // encabezado grande del correo
  paragraphs: string[]; // texto plano: se escapa aquí
  rows?: [string, string][]; // tabla de datos opcional: [etiqueta, valor]
  button?: { label: string; path: string }; // enlace a una página de la tienda
};

// Arma el correo con el estilo de la marca (HTML simple con estilos en línea, que es lo que
// entienden los programas de correo) y una versión en texto plano.
function render({ title, paragraphs, rows, button }: Email) {
  const brand = "#596357";
  const html = `<!doctype html>
<html lang="es"><body style="margin:0;background:#f6f7f4;font-family:Arial,Helvetica,sans-serif;color:#2b302a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f4;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #dde1da">
<tr><td style="background:${brand};padding:20px 28px;color:#f6f7f4;font-size:14px;letter-spacing:6px">VELARE</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:22px;font-weight:normal;color:#2b302a">${escapeHtml(title)}</h1>
${paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#4a5248">${escapeHtml(p)}</p>`).join("")}
${
  rows?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;border-top:1px solid #dde1da">${rows
        .map(
          ([label, value]) =>
            `<tr><td style="padding:10px 0;border-bottom:1px solid #dde1da;font-size:14px;color:#6b7368">${escapeHtml(label)}</td><td align="right" style="padding:10px 0;border-bottom:1px solid #dde1da;font-size:14px;color:#2b302a">${escapeHtml(value)}</td></tr>`,
        )
        .join("")}</table>`
    : ""
}
${
  button
    ? `<p style="margin:22px 0 4px"><a href="${absoluteUrl(button.path)}" style="display:inline-block;background:${brand};color:#f6f7f4;text-decoration:none;padding:12px 22px;font-size:14px">${escapeHtml(button.label)}</a></p>`
    : ""
}
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #dde1da;font-size:12px;color:#8a9187">Recibes este correo por tu compra o cotización en Velare.</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    title,
    "",
    ...paragraphs,
    ...(rows?.length ? ["", ...rows.map(([label, value]) => `${label}: ${value}`)] : []),
    ...(button ? ["", `${button.label}: ${absoluteUrl(button.path)}`] : []),
  ].join("\n");
  return { html, text };
}

// Remitente: el nombre de EMAIL_FROM ("Velare") con la dirección de SMTP_USER. Gmail manda a Spam
// (o rechaza) un correo que dice venir de una dirección distinta a la cuenta con la que se envía,
// así que la dirección siempre es la de la cuenta, aunque EMAIL_FROM diga otra.
function sender() {
  const user = process.env.SMTP_USER ?? "";
  const name = (process.env.EMAIL_FROM ?? "").replace(/<[^>]*>/, "").replace(/"/g, "").trim() || "Velare";
  return { name: name.includes("@") ? "Velare" : name, address: user };
}

// Envía un correo. Nunca lanza error: un correo que falla no debe tumbar un pago ni un pedido.
export async function sendEmail(email: Email) {
  const to = [email.to].flat().filter(Boolean);
  if (to.length === 0) return;
  if (!transport) {
    console.info(`Correo no enviado (falta configurar SMTP): ${email.subject}`);
    return;
  }
  try {
    await transport.sendMail({ from: sender(), to, subject: email.subject, ...render(email) });
  } catch (error) {
    console.error(`No se pudo enviar el correo "${email.subject}":`, error);
  }
}
