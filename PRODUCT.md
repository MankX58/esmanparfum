# Producto

Datos estables del negocio para tomar decisiones de diseño. Lo marcado como (inferido) no lo confirmó el dueño.

## Platform

web

## Stack

Next.js (App Router), React, TypeScript, Tailwind CSS, Neon (PostgreSQL), Auth0, Vercel, Vercel Blob, Sileo.

## Users

- **Compradores:** personas en Colombia que llegan desde WhatsApp, Instagram, TikTok o Facebook, casi siempre en el teléfono. (inferido de los canales de venta del Excel)
- **Administrador:** el dueño, que registra compras, ventas, gastos y confirma pagos.

## Product Purpose

Tienda online de perfumes y lociones internacionales. Muchas ventas son bajo pedido: el cliente paga con Wompi, el dueño compra al proveedor y envía.

## Positioning

Boutique de perfumería internacional: premium, elegante, moderna, limpia y minimalista. No debe parecer una plantilla.

## Operating Context

- Pago en línea con Wompi (tarjeta, PSE, Nequi, Bancolombia). El pedido se confirma solo cuando Wompi aprueba el pago.
- Sin dominio propio: `<proyecto>.vercel.app`.
- Sin correos transaccionales: el estado del pedido se ve en la web y se avisa por WhatsApp.

## Capabilities and Constraints

- El catálogo actual no tiene fotos, descripciones ni notas olfativas; se añadirán desde el panel.
- Los pedidos guardan precio, costo y total del momento de la venta.
- El código debe ser simple y entendible para alguien con nivel básico o intermedio de React.

## Brand Commitments

- Nombre: Velare.
- Estética pedida: premium, refinada, con microinteracciones sutiles y sin saturar de animaciones.

## Evidence on Hand

El Excel de contabilidad (25 productos, compras, ventas, clientes). No hay logo, fotos ni textos de marca todavía.

## Product Principles

Funcionalidad, luego seguridad, mantenibilidad, experiencia de uso y diseño.

## Accessibility & Inclusion

Contraste AA, foco visible con teclado, respeto de la preferencia de menos movimiento, objetivos táctiles de 44px.
