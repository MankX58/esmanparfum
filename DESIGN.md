# Diseño de Ésman Parfum

Reglas visuales del proyecto. Los valores viven en [src/app/globals.css](src/app/globals.css); este archivo explica cómo usarlos. Si cambias un valor allí, actualiza esto.

## Idea

Una vitrina fría y limpia, no un salón dorado. Porcelana casi blanca, un solo verde salvia apagado (`#596357`) y tipografía de caja de perfume. Nada de crema con serif y dorado, ni de negro con dorado: es lo que usa todo el mundo en esta categoría.

Un solo tema, claro. Las fotos de producto suelen venir sobre blanco y el panel se usa de día.

## Color

Solo existen los colores definidos en `globals.css`; la paleta por defecto de Tailwind está desactivada.

| Uso | Clase |
|---|---|
| Fondo de página | `bg-paper` |
| Tablas, campos, superficies | `bg-surface` |
| Rellenos suaves, esqueletos | `bg-mist` |
| Bordes y divisores | `border-line`, `divide-line` |
| Texto principal, secundario, terciario | `text-ink`, `text-ink-soft`, `text-ink-faint` |
| Marca: botones, cabecera del panel, zonas verdes | `bg-brand`, `hover:bg-brand-strong` |
| Texto sobre verde | `text-on-brand`, `text-on-brand-soft` |
| Estados | `text-ok bg-ok-soft`, `text-warn bg-warn-soft`, `text-danger bg-danger-soft` |

- El verde salvia `#596357` es el único color de marca. No se añade un segundo acento. Toda la paleta (neutros, texto) comparte su tono, con muy poca saturación.
- Como el verde es oscuro, el texto que va encima es claro (`text-on-brand`, y `text-on-brand-soft` para lo secundario). El texto oscuro (`text-ink`) no se lee sobre él.
- Sobre fondos claros, el verde sirve para marcas y rellenos (`bg-brand`): barras, pasos cumplidos, el contador del carrito. `on-brand` es claro: nunca se usa como color sobre fondo claro.
- El foco del teclado usa `ink`; dentro de una zona verde pasa a claro.
- `text-ink-faint` no va sobre `bg-mist`: no alcanza el contraste mínimo (4,5:1).
- Los contrastes de la paleta se comprobaron uno por uno (texto ≥ 4,5:1). Si cambias un color, vuelve a comprobarlos.

## Tipografía

- **Jost** (`font-display`): títulos, la marca y la marca del perfume en las etiquetas.
- **Geist** (`font-sans`): todo lo demás. Los números de tablas llevan `tabular-nums`.
- La marca se escribe siempre con el componente `Wordmark`.
- El símbolo (icono de la pestaña, del teléfono y de la imagen al compartir) es el monograma caligráfico de los archivos de `public/esman-parfum-logos/` (iconos `icono-app-*`); el logotipo completo sale del componente [logo.tsx](src/components/logo.tsx). El lema es "Perfumes para ser recordado".
- Títulos grandes en peso ligero (`font-light`) y `tracking-tight`. Máximo `text-7xl`.
- Sin rótulos pequeños en mayúsculas encima de los títulos. Las mayúsculas espaciadas se reservan para la marca del perfume y las etiquetas de estado.

## Forma

Todo es de esquinas rectas: botones, tablas, campos, etiquetas. La única excepción son los avisos de Sileo, que traen su propia forma.

Sin sombras por ahora: la jerarquía se marca con bordes de 1px y espacio.

## Movimiento

Escala de transitions.dev, definida en `globals.css`. Cada valor se elige por lo que hace la animación:

| Qué | Cómo |
|---|---|
| Hover y cambios de color | `transition duration-(--duration-quick) ease-smooth-out` |
| Resaltar un elemento de un grupo | los demás bajan de opacidad mientras el cursor está sobre uno (navegación del panel, tramos de una gráfica). Solo en equipos con cursor |
| Botón presionado | `active:scale-98` |
| Texto importante que aparece | `motion-safe:animate-unveil`, escalonado con `--duration-micro` |
| Contenido que reemplaza a un esqueleto | `motion-safe:animate-settle` |
| Esqueleto de carga | `motion-safe:animate-skeleton` |
| Bloque que entra al hacer scroll | clase `reveal` (solo CSS; sin soporte o con menos movimiento, queda visible) |
| Cajas de la portada | `motion-safe:animate-deal`, cada una con su giro `--tilt` |
| Titular de la portada | cada palabra sube desde detrás de una máscara (`motion-safe:animate-rise`), con 55 ms entre palabras |
| Bruma de la portada | dos manchas de luz que se desplazan muy despacio tras las cajas (`motion-safe:animate-mist`). Es el único movimiento continuo de fondo; no se repite en otras zonas |
| Destello de una caja | una franja de luz cruza la etiqueta del perfume al señalarla; con `data-sheen` en el contenedor también pasa una vez al cargar (portada y página de producto) |
| De la lista a la página de un perfume | elemento compartido: la caja lleva `<ViewTransition name={transitionName(id)} share="morph">` en la tarjeta y en la página, y el navegador la mueve de un sitio al otro en 400 ms |
| Abanico al bajar | clase `fan`: las cajas de la portada se abren con el scroll. Cada una indica su lado con `--fan` |
| Línea que se dibuja | clase `draw`: la línea de cada paso de "Comprar es sencillo" crece al asomar |
| Cinta de marcas | `motion-safe:animate-marquee`; una sola por página y se detiene al señalarla |
| Contador del carrito | `motion-safe:animate-pop` |
| Abrir menú o modal / cerrarlo | `--duration-fast` / `--duration-quick` (cerrar siempre es más rápido) |
| Explicación plegable que se abre | `group-open:motion-safe:animate-disclose` |

- Toda animación lleva `motion-safe:` para respetar a quien pide menos movimiento.
- Solo se anima lo que comunica algo: un cambio de estado, una respuesta a una acción o el orden de lectura.
- Un escalonado completo no pasa de 300 ms.

## Componentes

- **Botones y enlaces:** `buttonStyles` y `linkStyles` de [button.ts](src/components/button.ts). Variante `onBrand` dentro de zonas verdes.
- **Etiqueta de producto:** en el panel, nombre arriba y debajo la marca en Jost con mayúsculas espaciadas. En la tienda es `ProductLabel` de [product-tile.tsx](src/components/store/product-tile.tsx): una caja 4:5 como el frente de la caja del perfume, que hace de imagen mientras no haya foto. Cada marca tiene siempre el mismo tono (salvia, niebla, casi negro o porcelana).
- **Fotos de producto:** cuando un producto tiene fotos, `ProductLabel` muestra la primera, la tarjeta escribe la marca y el nombre debajo, y la página del producto usa `Gallery` de [gallery.tsx](src/components/store/gallery.tsx): una foto grande y miniaturas para cambiarla. Las fotos se suben en el panel (Productos → Fotos) y siempre van en proporción 4:5.
- **Rejillas de producto:** `ProductCard` dentro de un contenedor `group/grid`; al señalar una tarjeta sube un poco y las demás se atenúan.
- **Carrito:** `useCart` de [cart.ts](src/lib/cart.ts). Vive en el navegador y solo guarda ids y cantidades; los precios siempre vienen del servidor.
- **Avisos:** `sileo.success(...)`, `sileo.error(...)` desde componentes de cliente. El `Toaster` está en el layout raíz: salen arriba al centro, duran 4 segundos, con fondo casi negro (el color del texto) y los colores suaves definidos en `globals.css`. Los errores de formulario van junto al campo, no en un aviso.
- **Iconos:** `@phosphor-icons/react`, siempre en peso `light`. Un icono sin texto lleva `aria-label` en su enlace o botón. El contador del carrito es un cuadro verde con número claro.
- **Formularios:** `Field` + `inputStyles` de [field.tsx](src/components/field.tsx): etiqueta arriba, ayuda o error debajo. Se conectan al servidor con `useServerForm`, que conserva lo escrito si hay errores.
- **Navegación del panel:** [admin-nav.tsx](src/components/admin-nav.tsx) dentro de [admin-shell.tsx](src/components/admin-shell.tsx). Las secciones van agrupadas por lo que se hace en ellas (Vender, Inventario, Dinero). Desde 1280px es una barra lateral verde con iconos y el nombre de cada grupo; por debajo, una cabecera con las secciones en una fila que se desliza.
- **Encabezado de página:** `PageHeader` con el enlace para volver, el título, una frase que dice para qué sirve la página (`description`), la acción principal y una línea de datos (`Fact`).
- **Cifras con explicación:** en el panel ningún número va solo. `SummaryLine` de [summary-line.tsx](src/components/summary-line.tsx) muestra el nombre, el valor y debajo de dónde sale (`hint`). Cuando varias líneas forman una cuenta llevan su signo (`sign`: +, −, =) y el resultado final va más grande, como en Resumen y Caja.
- **Explicación de columnas:** `Glossary` de [glossary.tsx](src/components/glossary.tsx), un `<details>` plegable encima de cada tabla que dice qué es cada columna o estado. Los nombres evitan la jerga: "Ganancia sobre el costo" en vez de "markup".
- **Buscar y filtrar:** `FilterBar` de [filter-bar.tsx](src/components/filter-bar.tsx). Guarda lo elegido en la dirección (`?q=...`) y la página filtra en la base de datos.
- **Eliminar:** `ConfirmButton` pregunta antes de ejecutar; nunca un borrado de un solo clic.
- **Valores que cambian en vivo:** el número vuelve a entrar con `motion-safe:animate-swap`.
- **Gráficas:** `MoneyBars` de [money-bars.tsx](src/components/money-bars.tsx). Barras delgadas en una misma escala, 2px entre segmentos, leyenda con valores y detalle al pasar el cursor. Los colores `chart-cost`, `chart-inventory` y `chart-profit` están comprobados para daltonismo y solo se usan en marcas de gráficas. La cifra principal de un resumen va en Geist, no en Jost.
- **Gráficas y cifras animadas del Resumen:** componentes de [Arc UI](https://uiarc.dev) copiados en `src/components/arc/` (contador, barras, rosca y medidor; dependen del paquete `motion`). Se usan siempre a través de [arc-charts.tsx](src/components/arc-charts.tsx), que les pone el tema de Ésman Parfum ([theme.css](src/components/arc/theme.css): colores de la marca, esquinas rectas, Geist), los textos en español y el formato de pesos. Los cuatro colores de las partes de una rosca están comprobados para daltonismo. Para añadir otro componente de Arc: copiar su código a esa carpeta sin su `foundation.css` (quita el foco del teclado en toda la página) y envolverlo en `arc-charts.tsx`.
- **Avance de un pedido:** [order-progress.tsx](src/components/order-progress.tsx). `OrderProgress` es el recorrido completo (vertical en el teléfono, horizontal desde pantallas medianas) con una frase de qué pasa ahora, distinta para cliente y para panel. `OrderStatusBadge` es la versión corta para listas: nombre del estado y barrita de cinco tramos. Un pedido avanza con un solo botón por paso (caja "Qué sigue" en el panel; "Ya pagué" y "Ya lo recibí" en la tienda); no hay selector de estado. Cada frase dice a quién le toca actuar.
- **Estados:** cada pantalla con datos tiene carga (`loading.tsx`), vacío y error (`error.tsx`).

## Panel y tienda

- **Panel:** tablas y controles estándar, densidad media, sin adornos. La marca aparece solo en color, tipografía y la etiqueta de producto.
- **Tienda:** más aire, composición asimétrica, fotos reales de producto. Sin capturas falsas ni ilustraciones inventadas.

## Texto

Español claro y directo. Sin rayas largas, sin palabras de relleno ("eleva", "descubre la experiencia"). Los botones nombran su acción.

## Accesibilidad y comodidad

- Todo lo que se toca mide al menos 24px de alto; botones y campos, 44px. Los enlaces de texto llevan `py-2` para ampliar su zona táctil.
- Los campos usan letra de 16px en el teléfono (`text-base sm:text-sm`): con menos, iOS hace zoom al tocarlos.
- Cada página tiene un solo `h1` y un contenedor `id="contenido"`, destino del enlace "Saltar al contenido".
- Un icono sin texto lleva `aria-label`; un campo sin etiqueta visible, también.
- Las constantes de estilo que usa un componente de servidor no pueden vivir en un archivo con "use client" (ver [nav-styles.ts](src/components/store/nav-styles.ts)).
- Revisar siempre en 320, 768 y 1920 px de ancho.
