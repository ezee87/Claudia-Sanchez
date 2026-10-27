# Rediseño de /empresas

Implementación local del 26 de octubre de 2026. Sin commit, push ni publicación en Eze CMS.

## Implementación

- Hero: composición vertical, título serif de ancho controlado, dos párrafos y botón dorado sobre el azul institucional; altura determinada por el contenido.
- Desafíos: encabezado y descripción apilados, dos bloques editoriales con números y divisorias.
- Soluciones: dos tarjetas en escritorio; una columna hasta 1000 px. Frase principal, destinatarios, metodología en lista y botones alineados mediante flexbox, sin alturas fijas.
- Experiencia: se conservan los tres párrafos y el cierre serif con línea dorada, en una sola línea de lectura.
- Proceso: eyebrow «CÓMO TRABAJAMOS», cuatro pasos en cuadrícula 2×2 desde 601 px, números de mayor tamaño y divisorias.
- Testimonios: se reutilizan la tarjeta compartida y el CSS de Recomendaciones de Inicio, también usados en Personas. Fondo lavanda, Pedro a la izquierda, Ana y Ricardo a la derecha; una columna hasta 1000 px. Textos sin truncar, Pedro en inglés, Ana identificada como extracto y Ricardo con avatar «RS». Sin fechas ni cargos inventados.
- Cierre: CTA vertical, azul oscuro y botón dorado. Se conservan los destinos de contacto existentes.
- Footer y navbar: se mantienen los componentes globales, su decoración y su comportamiento. No se introducen animaciones.

## Archivos de esta pasada

- `src/pages/EmpresasPage/EmpresasPage.jsx`: composición específica; reutiliza `Section`, `Seo`, `Field`, `Collection`, `useSection` y `TestimonialCard`.
- `src/pages/EmpresasPage/EmpresasPage.css`: estilos limitados a `.business-page`.
- `src/pages/EmpresasPage/content.js`: separación de la metodología del campo de descripción existente y protección contra testimonios provisionales del CMS.
- `src/components/institutional/TestimonialCard.jsx`: props opcionales `initials`, `note` y `quoteLang`; mantienen la salida anterior si no se utilizan.
- `src/App.jsx`: conecta el componente específico conservando `/empresas`.
- `src/data/institutional/businessTestimonials.js`: recomendaciones originales suministradas.
- `src/data/institutional/careerContent.js`: utiliza las nuevas recomendaciones y añade el eyebrow de soluciones.
- `src/data/institutional/content.json`: testimonios y eyebrow del proceso para Empresas.
- `src/integration/eze-cms/claudia-sanchez.manifest.json` y `docs/CMS-COVERAGE.md`: regenerados localmente.
- `scripts/validate-editorial.mjs` y `scripts/test-editorial.mjs`: expectativa de tres testimonios, renderizado completo y compatibilidad con CMS.

Se preservaron los cambios que ya existían en el directorio. Durante la implementación aparecieron también cambios externos simultáneos en Inicio, Personas y en los enlaces de recomendaciones; no se revirtieron ni se atribuyen a esta pasada.

## Eze CMS: sincronización pendiente

La fuente efectiva combina `content.json` con `careerContent.js`. `businessTestimonials.js` alimenta la sobreescritura local de Empresas. El manifiesto se genera con la misma combinación. El hook existente usa datos locales en desarrollo y la RPC pública más actualizaciones autorizadas del editor en producción.

No se modifica el hook ni se desactiva el contenido remoto. El resolver de Empresas descarta únicamente las secciones antiguas cuyo título contenga «pendientes de verificación» o cuya descripción anuncie «se publicarán cuando». En esos casos utiliza la sección local completa. Las ediciones válidas del CMS conservan precedencia, incluida la visibilidad, orden y baja intencional de elementos.

Revisar y actualizar manualmente en el CMS:

| Sección | Campos |
|---|---|
| `/empresas` → `servicios` | `eyebrow`: ACOMPAÑAMIENTO ORGANIZACIONAL. Mantener los dos programas y sus destinos actuales. |
| `/empresas` → `proceso` | `eyebrow`: CÓMO TRABAJAMOS. Mantener título y cuatro pasos. |
| `/empresas` → `testimonios` | `title`, `paragraph1` y colección `items` del `initialContent` del manifiesto. |

La colección usa los campos ya existentes `_id`, `visible`, `author`, `role`, `quote`, `image` y `alt`. IDs locales: `pedro-fondevila`, `ana-cristina`, `ricardo-schmidt`. Pedro lleva `role` vacío; Ricardo lleva `image` y `alt` vacíos. No se requieren nuevos campos para fecha, idioma, iniciales o extracto. El idioma y la identificación del extracto se aplican en la presentación según el autor, incluso si el CMS cambia el orden o el ID.

La estructura de servicios sigue usando `description`, sin un nuevo esquema: el párrafo iniciado por «Incluye» se presenta como lista a partir de sus separadores de punto y coma, conservando también «Coaching ejecutivo opcional». Un texto remoto sin ese formato se muestra completo como párrafos.

## Validación

- `npm test`: validación del manifiesto, renderizado SSR de once destinos y casos de actualización CMS, incluida la protección contra la presentación provisional.
- `npm run typecheck`: sin errores.
- `npm run build`: exitoso; Vite advierte sobre el tamaño del bundle principal, superior al umbral configurado de 600 kB.
- Chrome: inspección de geometría en 393, 768, 1024, 1366, 1440 y 1600 px. Sin overflow en títulos, textos, listas, enlaces y tarjetas. Proceso 2×2 en tablet/escritorio y una columna en móvil; servicios y testimonios se apilan cuando no hay ancho suficiente.
- Fotografías de Pedro y Ana cargadas; tres recomendaciones presentes; avatar RS y etiqueta de extracto comprobados.
- Consola de Chrome sin errores ni advertencias en la revisión final. Foco de teclado visible (contorno sólido de 2 px) y `prefers-reduced-motion` comprobados: scroll automático y transiciones reducidas.
- Botones de ambos programas alineados en escritorio. Ancla `#servicios` y navegación al contacto verificadas; destinos actuales conservados.
- Navbar y footer globales reutilizados; archivos de sus componentes y estilos sin modificaciones de esta pasada. Se mantiene el comportamiento existente de «Volver al inicio», que desde páginas internas regresa a Inicio.

No se publicó ni se probó persistencia real en Eze CMS. No se enviaron formularios: la página de contacto existente indica que el formulario todavía no está operativo y ofrece canales directos. Tampoco se verificó la entrega de mensajes ni se modificó esa integración.
