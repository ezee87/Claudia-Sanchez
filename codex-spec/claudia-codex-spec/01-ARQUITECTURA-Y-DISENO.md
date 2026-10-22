# Arquitectura, navegación y dirección visual

## Rutas públicas

| Ruta | Página | Estado |
|---|---|---|
| `/` | Inicio | Crear |
| `/personas` | Para personas | Crear |
| `/empresas` | Para empresas | Crear |
| `/articulos` | Artículos | Crear; reemplaza ruta anterior `/newsletter` |
| `/articulos/:slug` | Artículo individual | Crear; reemplaza `/newsletter/:slug` |
| `/contacto` | Contacto | Crear |
| `/disena-tu-futuro` | Landing existente | Preservar íntegra salvo nombre público / integración común imprescindible |
| `/gracias` | Confirmación de reserva de la landing | Crear |
| `*` | 404 | Crear vista coherente y enlace a Inicio |

Si existen rutas `/newsletter` y `/newsletter/:slug`, redirigir a las rutas nuevas conservando el slug y evitando duplicados SEO. Si existe alguna ruta demo heredada, no eliminar sin inspección y justificación. Conservar fallback SPA para Vercel y soporte de recarga directa en todas las rutas.

## Menú global

**Marca:** Claudia Sanchez Urencio.

**Inicio** → `/`.
**Sobre mí** → `/#sobre-mi` (desde cualquier ruta, navegar a Inicio y hacer scroll al anchor).
**Servicios** (desplegable): **Para personas** → `/personas`; **Para empresas** → `/empresas`.
**Artículos** → `/articulos`.
**Contacto** → `/contacto`.

No incluir CTA global a Calendly. El calendario del programa se mantiene dentro de `/disena-tu-futuro`. Menú responsive con teclado, foco, escape y cierre al navegar. Footer con marca completa, enlaces y datos solo si están confirmados.

## Dirección visual

La landing `/disena-tu-futuro` es la **fuente de verdad visual**. Inspeccionar variables reales: paleta (probablemente azul marino, dorado y acentos lavanda; confirmar en CSS), fuentes, tamaños, radios, sombras, ancho de contenedores, fondos, bordes, iconografía, transiciones, GSAP o librerías instaladas. Reutilizar sus tokens y recursos reales; no imponer valores genéricos arbitrarios.

Objetivo: web editorial premium, moderna, de coaching ejecutivo y consultoría de liderazgo. Debe transmitir trayectoria corporativa, claridad y cercanía. Jerarquías tipográficas fuertes, buen espacio negativo, composiciones editoriales asimétricas controladas, bloques de contenido con ritmo visual, fotos reales disponibles y tarjetas sobrias. Evitar diseño corporativo anticuado, clichés de coaching, exceso de gradientes, secciones repetidas idénticas, iconos decorativos indiscriminados y botones redundantes.

Las nuevas páginas deben **sentirse parte de la misma marca** que la landing, pero no copiar exactamente su hero en todas. Diseñar una experiencia con identidad y variedad visual. Considerar desktop, tablet y mobile; sin overflow horizontal. Animaciones discretas y fluidas (entradas al scroll, hover, transiciones), coherentes con las ya instaladas; respetar `prefers-reduced-motion`, evitar animaciones que bloqueen lectura o navegación y no animar contenido que afecte la estabilidad visual.

## Assets e imágenes

Usar temporalmente recursos locales existentes: foto `claudia-hero` o equivalente para hero/bio, fotos de testimonios si existen y portadas reales de artículos **solo si están en el proyecto**. Si falta una imagen, usar placeholder visual elegante sin inventar foto ni contenido. Los testimonios pueden representarse tipográficamente sin retrato. No repetir la misma foto de Claudia en todas las secciones sin propósito. Conservar ALT útiles y editables en CMS donde corresponda.

## Reglas de interacción

- Una acción principal por sección; en servicios, una acción por tarjeta.
- En `/personas`: CTA de Coaching ejecutivo y de Transición de carrera → destinos configurables pendientes (WhatsApp o Calendly). No inventar URL ni usar enlaces `#` rotos; implementar configuración editable y fallback seguro a `/contacto` con tipo de consulta preseleccionado.
- En `/empresas`: cada servicio corporativo → destino configurable pendiente; fallback a `/contacto?tipo=empresa&servicio=...`.
- Diseña tu futuro → `/disena-tu-futuro`.
- Formulario de contacto: envío real solo si ya existe integración comprobada; de lo contrario preparar interfaz, validación y estado sin fingir éxito ni almacenar datos de manera insegura. No poner un botón que muestre éxito sin enviar nada.
- Página `/gracias`: nunca afirmar que la reserva está confirmada solo por abrir directamente la URL; ver especificación de confirmación.
