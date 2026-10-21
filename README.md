# Velare

Proyecto web de Velare.

## Descripción

Velare es una tienda online orientada a ofrecer una experiencia de compra clara, rápida y fácil de usar.

## Estado

Proyecto en desarrollo.

## Requisitos

- Git
- Node.js 22 o superior y npm

## Configuración

1. Clona el repositorio:

   ```bash
   git clone https://github.com/MankX58/velare.git
   cd velare-shop
   ```

2. Crea un archivo `.env.local` a partir de `.env.example`.
3. Completa las variables de entorno. En desarrollo, las de Neon deben ser siempre las de la rama `dev`.
4. En Auth0, la aplicación debe tener `http://localhost:3000/auth/callback` en Allowed Callback URLs y `http://localhost:3000` en Allowed Logout URLs.

> Los archivos `.env*` se mantienen fuera del control de versiones para evitar publicar credenciales.

## Desarrollo

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias |
| `npm run dev` | Arranca la app en `http://localhost:3000` |
| `npm run build` | Compila y comprueba los tipos |
| `npm run lint` | Revisa el código |
| `npm test` | Ejecuta las pruebas de las cuentas de dinero e inventario |
| `npm run db:migrate` | Crea o actualiza las tablas con los archivos de `db/migrations` |
| `npm run db:import` | Importa el Excel de `data/CONTABILIDAD 1.xlsx` (solo si la base está vacía) |
| `npm run db:import:reset` | Borra los datos del negocio y vuelve a importar el Excel |
| `npm run db:admin tu@correo.com` | Convierte en administrador a un usuario que ya inició sesión |
| `npm run db:descriptions` | Pone las descripciones de `db/descriptions.json` en los productos que no tienen. Con `-- --todas` reemplaza las de todos |
| `npm run db:productos` | Agrega los perfumes nuevos de `db/new-products.json` (con su descripción). Los SKU que ya existen no se tocan |
| `npm run db:fotos` | Conecta las fotos de `public/productos` (nombradas por SKU: `P001.jpg`, `P001-2.jpg`) con sus productos |

La carpeta `data/` no se sube al repositorio: copia ahí el Excel antes de importar.

## Fotos de producto

Hay dos formas de ponerle fotos a un perfume. Sin fotos, la tienda muestra una etiqueta con su marca y su nombre.

- **Desde el panel:** Productos → abrir un producto → Fotos → "Subir una foto". El navegador reduce la foto antes de enviarla y queda guardada en Vercel Blob. Necesita un almacén de Vercel Blob conectado al proyecto:
  1. En Vercel, abre tu proyecto → Storage → Create Database → Blob. Al crearlo elige acceso **Public**: las fotos de la tienda las ve cualquiera, y un almacén privado las rechaza.
  2. Conéctalo al proyecto: Vercel crea sola la variable `BLOB_STORE_ID` para producción.
  3. En tu computador las subidas necesitan un `BLOB_READ_WRITE_TOKEN` en `.env.local`. Sin él, todo funciona salvo el botón "Subir una foto".
- **Desde una carpeta:** guarda las fotos en `public/productos` con el SKU como nombre (`P001.jpg`, `P001-2.jpg`) y ejecuta `npm run db:fotos`.

## Pagos con Wompi

Los clientes pagan en Wompi (tarjeta, PSE, Nequi o Bancolombia). Con el pago aprobado, el pedido pasa solo a "Pagado, por enviar": no hay que revisar el banco.

1. Crea tu cuenta de comercio en [Wompi](https://comercios.wompi.co) y entra a Desarrolladores.
2. Copia las cuatro llaves en `.env.local` (y en Vercel para producción): `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET` (secreto de integridad) y `WOMPI_EVENTS_SECRET` (secreto de eventos). Para probar, usa las de pruebas (empiezan por `pub_test_`, `prv_test_`...): no mueven dinero real.
3. En Desarrolladores → URL de eventos, registra `https://<proyecto>.vercel.app/api/wompi/eventos`. Cada ambiente (pruebas y producción) tiene su propia URL.
4. Revisa Panel → Ajustes: arriba dice si Wompi está conectado y si está en modo de pruebas.

En tu computador Wompi no puede enviar avisos a `localhost`, pero no hace falta: al volver de Wompi, la página del pedido le pregunta el resultado a Wompi y lo confirma. Si un pago aprobado no se confirmó solo, en Panel → Pedidos se puede confirmar a mano.

## Correos

La tienda envía correos automáticos:

- Al cliente: cuando se confirma su pago (y el pedido pasa a preparación), cuando sale, cuando se entrega y si se cancela un pedido ya pagado. También cuando le respondes una cotización.
- A los administradores: cada vez que alguien pide una cotización.

Se envían por SMTP con un correo que ya tengas. Con Gmail:

1. En tu cuenta de Google activa la verificación en dos pasos.
2. Ve a Cuenta de Google → Seguridad → Contraseñas de aplicaciones y crea una para "Velare".
3. En `.env.local` (y en Vercel) pon `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER` con tu correo, `SMTP_PASSWORD` con la contraseña de aplicación y `EMAIL_FROM=Velare <tu-correo@gmail.com>`.

Panel → Ajustes dice si los correos están activos. Sin esas variables la tienda funciona igual, pero no salen correos. Gmail permite unos 500 correos al día.

## Costos de envío

El cliente elige su municipio en el checkout y paga el envío de su zona (Medellín, Valle de Aburrá, resto de Antioquia, resto de Colombia y zonas de difícil acceso). Los precios se editan en Panel → Ajustes.

Los precios actuales cubren lo que cobra la transportadora en al menos 9 de cada 10 pedidos de un perfume; el seguro y el empaque los asume la tienda, como hacen las tiendas de la competencia. `npm run db:envios -- --cobertura` mide qué parte de los envíos cubren los precios guardados.

`npm run db:envios` calcula, en cambio, un precio por zona que cubre el costo total (flete, seguro y empaque) en el 90 % de los envíos, simulando pedidos con los perfumes del catálogo (peso, caja, tarifa de la transportadora, seguro y empaque). Los supuestos están al comienzo de `scripts/shipping-rates.mjs`: cuando tengas cotizaciones reales, cámbialos y ejecuta `npm run db:envios -- --guardar`. Para producción: `node --env-file=.env.production.local scripts/shipping-rates.mjs --guardar`.

## Publicar en Vercel

1. Importa el repositorio en Vercel. El plan gratuito (Hobby) no permite uso comercial: para vender hace falta el plan Pro.
2. En Settings → Environment Variables, pon las mismas variables de `.env.example` con los valores de producción:
   - `APP_BASE_URL`: `https://<proyecto>.vercel.app`
   - `DATABASE_URL` y `DATABASE_URL_UNPOOLED`: las de la rama `production` de Neon.
   - Las cuatro de Auth0 (usa un `AUTH0_SECRET` distinto al de desarrollo).
   - Las cuatro de Wompi, con las llaves de producción (ver Pagos con Wompi).
3. En Auth0, agrega `https://<proyecto>.vercel.app/auth/callback` a Allowed Callback URLs y `https://<proyecto>.vercel.app` a Allowed Logout URLs.
4. Crea las tablas en la base de producción. Guarda las dos direcciones de la rama `production` en un archivo `.env.production.local` (tampoco se sube al repositorio) y ejecuta:

   ```bash
   node --env-file=.env.production.local scripts/migrate.mjs
   ```

   El mismo patrón sirve para cualquier otro script, por ejemplo `scripts/make-admin.mjs tu@correo.com` después de iniciar sesión por primera vez en producción.
5. Entra al panel y revisa Ajustes: estado de Wompi, WhatsApp, saldo inicial y meta mensual.

Los buscadores encuentran la tienda por `/sitemap.xml` y `/robots.txt`, que se generan solos a partir de `APP_BASE_URL` y de los productos activos.

## Aparecer en Google

El código ya entrega a Google todo lo que pide (título, descripción, mapa del sitio, datos de la tienda y de cada perfume, icono). Falta avisarle que el sitio existe; se hace una sola vez:

1. Entra a [Google Search Console](https://search.google.com/search-console) y añade una propiedad de tipo **Prefijo de la URL** con la dirección de producción.
2. Elige el método de verificación **Etiqueta HTML** y copia solo el valor de `content="..."`.
3. En Vercel, crea la variable `GOOGLE_SITE_VERIFICATION` con ese valor (entorno Production) y vuelve a publicar.
4. De vuelta en Search Console, pulsa **Verificar**.
5. En **Sitemaps**, envía `sitemap.xml`.
6. En **Inspección de URLs**, pega la dirección de la portada y pulsa **Solicitar indexación**.

Google tarda de unos días a unas semanas en mostrar un sitio nuevo. El icono y la imagen que se ve al compartir un enlace salen de `src/components/logo-mark.tsx`.

## Estructura

- `db/migrations/`: las tablas y las vistas `product_stats` (stock, costo promedio, margen y alerta) y `cash_movements` (cada entrada y salida de dinero).
- `scripts/`: migraciones, importación del Excel, rol de administrador, descripciones y fotos.
- `src/lib/`: conexión a la base de datos (`db.ts`), Auth0 (`auth0.ts`), usuario actual y permisos (`auth.ts`), validación de formularios (`form.ts`), cuentas de inventario (`inventory.ts`), resultados y caja (`finance.ts`), periodos (`period.ts`), calculadora de precios (`pricing.ts`) y dirección pública del sitio (`site.ts`).
- `src/proxy.ts`: deja que Auth0 atienda las rutas `/auth/*`.
- `src/app/`: las páginas. La tienda pública está en `src/app/(tienda)` (inicio, `catalogo`, `producto/[slug]`, `carrito`, `checkout`, `pedidos`, `cotizar`). El panel está en `src/app/admin`, con una carpeta por sección (`productos`, `compras`, `pedidos`, `cotizaciones`, `clientes`, `ventas`, `caja`, `precios`, `ajustes`). En cada una, `actions.ts` tiene lo que se ejecuta en el servidor al guardar o eliminar, y siempre empieza comprobando el rol.
- `src/app/robots.ts` y `src/app/sitemap.ts`: lo que leen los buscadores.
- `src/components/`: piezas de interfaz compartidas (botones, campos, tablas, navegación del panel).
- `next.config.ts`: de dónde se aceptan imágenes y las cabeceras de seguridad.
- `DESIGN.md`: las reglas visuales. `PRODUCT.md`: los datos del negocio.

## Contribución

1. Crea una rama para tu cambio.
2. Realiza los cambios y comprueba que funcionan localmente.
3. Abre un pull request describiendo el cambio.

## Licencia

Pendiente de definir.
