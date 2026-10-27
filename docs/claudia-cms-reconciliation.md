# Reconciliación de contenido · Claudia Sánchez Urencio ↔ Eze CMS

Fase 1 — diagnóstico. **No se modificó código, manifiesto, CMS ni Supabase.** No se ejecutó SQL ni sincronizaciones.

- Sitio: `claudia-sanchez` · UUID `1875d747-0758-4c09-b5b3-935a6ace0249`
- Fecha del relevamiento: 27/10/2026
- Fuentes revisadas: código React actual (`src/`), manifiesto [claudia-sanchez.manifest.json](../src/integration/eze-cms/claudia-sanchez.manifest.json), generador [editorial-manifest.mjs](../scripts/editorial-manifest.mjs), kit de integración (`src/integration/eze-cms/`), proyecto `CMS_Ezequiel` (migraciones `001`–`008`, `ManifestSyncPanel`, `App.tsx`, `CollectionEditor`) y contenido público de Supabase.

---

## 0. Resumen ejecutivo

1. **Hoy React muestra cosas distintas según el entorno.** `useCmsSection` y `useCmsGlobal` usan **solo el fallback local en desarrollo** (`localOnly = import.meta.env.DEV`, [useCmsSection.ts:53](../src/integration/eze-cms/useCmsSection.ts#L53)) y, **en producción, el contenido remoto prevalece** sobre el local. La versión aprobada (fuente de verdad) es la del render local; producción muestra hoy contenido antiguo de Supabase en la mayoría de las páginas institucionales (por ejemplo, testimonios de Lucía López Sarre y Fabián Fuentes en Inicio, o el hero anterior de Empresas).
2. **La landing no está conectada a sus datos.** React lee `/diseno-de-carrera`, pero en Supabase la página sigue en la ruta **`/disena-tu-futuro`**. Por eso la landing siempre usa los datos locales y los clics de edición del CMS no encuentran la página (`message.pageRoute !== route`).
3. **`/comunidad-y-experiencias` no existe en Supabase** (las 4 secciones devuelven vacío), y el global `institutional-navbar` publicado no tiene el campo `community`.
4. **El manifiesto está desactualizado para la landing**: el hero declara `titleLines`/`accentFrom`/`subtitle`, que React ya no usa, y no declara `title`, `highlightedTitle`, `description`, `ctaLink` ni `portrait`. Contiene la sección `impact`, que no se renderiza, y no incluye los testimonios reales de la landing. El generador tiene errores que reintroducen estos problemas cada vez que se ejecuta (§4.3).
5. **`sync_site_manifest` no corrige nada de esto por sí sola.** Solo crea páginas, secciones y rutas de campos ausentes, y reemplaza `name`, `route`, `slug` y `field_schema`. **Nunca reemplaza valores existentes ni extiende arrays.** Hay **45 campos de primer nivel y 8 colecciones** institucionales con valores obsoletos que exigen una actualización explícita de valores (§6.2).
6. **Los cuatro bloques de testimonios son independientes** y deben seguir siéndolo (colecciones por sección; el CMS no admite colecciones globales). Uno de ellos, el de la landing, está **100 % hardcodeado**, y en Supabase hay en su lugar una colección obsoleta de testimonios ficticios que incluye un elemento de prueba (`Jorge / HH / Test`) (§5).

| Métrica | Valor |
|---|---|
| Campos de primer nivel conectados en código (leídos del hook CMS y renderizados) | **220** |
| … de ellos, con datos en Supabase en la ruta que React consulta | **152** |
| … conectados en código pero sin datos alcanzables (landing 56 + Comunidad 12) | **68** |
| Contenidos visibles hardcodeados (no editables) | **72** (71 valores + 1 colección de 3 testimonios con 18 valores) |
| Lógicas de compatibilidad que enmascaran contenido remoto | **10** |
| Colecciones visibles | **16** |
| Colecciones que requieren cambios | **15** (8 ACTUALIZAR, 2 CREAR por sync, 5 de la landing) |

---

## 1. Alcance, fuente de verdad y método

**Fuente de verdad.** Es el render local de React: los fallbacks efectivos y los literales en JSX. El fallback efectivo institucional se arma en [content.js](../src/components/institutional/content.js) así:

- `content.json` se combina con `careerContent.js` **reemplazando secciones completas** en todas las rutas excepto `/personas`.
- Después, en `/personas › servicios`, `PERSONAS_WHATSAPP_HREFS` sobrescribe los `href` de `item-2` e `item-1`.

Consecuencias de esa combinación:

- En `/`, las secciones `navbar`, `hero`, `servicios`, `enfoque` y `seo` vienen de `careerContent.js`; `sobre-mi`, `testimonios`, `articulos`, `contacto` y `footer` vienen de `content.json`.
- En `/empresas`, `experiencia` y `proceso` vienen de `content.json`; el resto, de `careerContent.js`. `testimonios` sale de `businessTestimonials.js`.
- `/comunidad-y-experiencias` viene íntegramente de `careerContent.js`.

La landing arma sus fallbacks dentro de cada componente, a partir de `site.js`, `careerTestimonials.js` y `booking.js`. Las secciones `site-header`, `site-footer`, `situations`, `life` y `closing` agregan claves que no existen en `site.js`.

**Supabase.** Solo se hicieron lecturas con la clave pública de `.env.local`:

- `get_public_section` para las 72 combinaciones de ruta y sección del manifiesto, más claves heredadas.
- `get_public_site_global` para los dos globales.
- `get_published_articles`, solo para contarlos: hay 18 publicados, que no se tocan.

La lectura directa de `sites`, `pages`, `sections` y `site_globals` devuelve `permission denied`, así que **no se pudieron verificar** las claves (`pages.key`), las posiciones, la visibilidad ni el `field_schema` almacenado. Tampoco se conoce la definición de `get_public_section`: no está entre las migraciones del repositorio. La comparación se hizo en tres vías (React, manifiesto y Supabase) para cada ruta de campo.

---

## 2. Inventario por página y sección

Convenciones de las tablas:

- **C**: campo conectado (se lee del hook CMS y se renderiza). Las colecciones aparecen como `campo[]`.
- **H**: contenido hardcodeado, con referencia a §3.2.
- **Estado DB**: lo que devuelve hoy Supabase para esa sección.

Los valores definitivos de los campos conectados son los del fallback efectivo (§1). Los que difieren de Supabase se transcriben completos en §6.

### 2.1 Globales institucionales — [Layout.jsx](../src/components/institutional/Layout.jsx)

Se usan en todas las rutas salvo `/diseno-de-carrera`.

| Bloque | Grupo CMS | Campos conectados | Hardcodeado | Estado DB |
|---|---|---|---|---|
| Skip link | `institutional-navbar` | `skipLabel` | — | publicado |
| Header / menú | `institutional-navbar` | `brand`, `home`, `about`, `servicesLabel`, `people`, `business`, `community`, `articles`, `contact`, `openLabel`, `closeLabel` (links: `label` + `href`) | aria `Principal` | publicado, **sin `community`**; `brand`, `people` y `business` con valores antiguos |
| Footer | `institutional-footer` | `brand`, `line`, `linkedin` (link; se renderiza solo el ícono y el `label` va en el aria) | H01 «Menú», H02 «Todos los derechos reservados.», año dinámico | publicado; `brand` sin acento |

Además, `institutional-footer.line` se reutiliza como firma en el detalle de artículo y `brand` funciona como fallback del autor.

**Duplicado:** la página `/` también tiene las secciones `navbar` y `footer`, con el mismo contenido. React **no las lee** (usa los globales). Ver §4.4.

### 2.2 Inicio `/` — [HomePage.jsx](../src/pages/HomePage/HomePage.jsx)

| # | Sección (key) | Componente | Campos conectados | Colecciones | Imágenes | Enlaces/botones | Hardcodeado | Estado DB |
|---|---|---|---|---|---|---|---|---|
| 1 | `hero` | `Hero` | `title` (dividido en 3 líneas por regex), `paragraph1`, `cta`, `image`, `alt` (aria-label) | — | `image` (fondo) | `cta` | — · `eyebrow` declarado pero **no se renderiza** | valores antiguos + `paragraph2` heredado |
| 2 | `sobre-mi` | `Trajectory` | `title`, `paragraph1`–`paragraph5` | `credentials[]` declarada, **no se renderiza** | logos Diageo/Kraft (H07, H08) | — | H03–H11 (métrica 20+, logos y líneas de experiencia) | casi igual (`paragraph1` sin acento) |
| 3 | `servicios` | `Services` | `title`, `cta` | `items[]` (máx. 3) | — | `items[].href`, `cta` | H12 «Áreas de trabajo», H13 «Explorar ↗», H14–H15 cierre | **2 ítems antiguos** (`item-1`, `item-2`) |
| 4 | `enfoque` | `Approach` | `title` (3 líneas), `paragraph1`, `paragraph2`, `highlight` | `steps[]` (máx. 3, íconos por índice) | íconos SVG (diseño) | — | H16 «Career Longevity · Mi enfoque» | valores antiguos; **sin `steps`**; `paragraph3`/`paragraph4` heredados **que se renderizan en producción** |
| 5 | `testimonios` | `Testimonials` + `TestimonialCard` | `title`, `paragraph1` (una oración por línea), `closingEyebrow`, `closingTitle`, `closingDescription`, `closingLink` | `items[]` (§5, bloque A) | `items[].image` | `items[].linkedinUrl`, `closingLink` | H17 «Recomendaciones» | **3 testimonios distintos**; sin campos de cierre |
| 6 | `articulos` | `Articles` + `ArticleCards` | `title`, `paragraph1`, `paragraph2`, `cta` | artículos del módulo de artículos (no se tocan) | portadas de artículos | `cta`, tarjetas | H18 «Ideas y perspectivas», H19–H25 (estados de tarjetas) | igual |
| 7 | `contacto` | `Contact` | `eyebrow` (marca lateral), `image`, `title`, `paragraph1`, `paragraph2`, `cta` | — | `image` (fondo; **compartida** con Personas y Comunidad) | `cta` | — | sin `eyebrow` ni `image` |
| — | `seo` | `Seo` | `title`, `description` | — | — | — | robots `noindex` | valores antiguos |

### 2.3 Personas `/personas` — [PersonasPage.jsx](../src/pages/PersonasPage/PersonasPage.jsx)

| # | Sección | Componente | Campos conectados | Colecciones | Enlaces | Hardcodeado | Estado DB |
|---|---|---|---|---|---|---|---|
| 1 | `hero` | `Hero` | `eyebrow`, `title` (separa título y afirmación en el primer «. »), `paragraph1`, `paragraph2`, `cta` | — | `cta` | — | **igual** |
| 2 | `situaciones` | `Section` | `title`, `paragraph1` | `items[]` (4) | — | — | 4 descripciones antiguas |
| 3 | `servicios` | `Services` | `title` | `items[]` (3; `item-3` con estilo oscuro según `_id`) | `items[].href` (2 WhatsApp + `/diseno-de-carrera`) | H28 «Programa» | ítems antiguos, orden `item-1,2,3` y hrefs a `/contacto` |
| 4 | `enfoque` | `Approach` | `title`, `paragraph3` (encabezado), `paragraph1`/`paragraph2`/`paragraph4` (pasos 01/02/03) | — | — | H29 «CÓMO TRABAJAMOS», H30–H32 títulos de pasos | `paragraph4` antiguo |
| 5 | `testimonios` | `Testimonials` + `TestimonialCard` | `title`, `paragraph1` (salto de línea insertado por regex) | `items[]` (§5, bloque B) | URL fija de recomendaciones (H27) | H33 «TESTIMONIOS», H26 etiqueta de fuente | 2 de 3 testimonios distintos; imágenes vacías |
| 6 | `contacto` | `Contact` | `title` (2 líneas), `paragraph1`, `paragraph2`, `cta` | — | `cta` | H34 «CHARLEMOS»; fondo tomado de `/ › contacto.image` | igual |
| — | `seo` | `Seo` | `title`, `description` | — | — | — | `title` sin acento |

### 2.4 Empresas `/empresas` — [EmpresasPage.jsx](../src/pages/EmpresasPage/EmpresasPage.jsx)

| # | Sección | Componente | Campos conectados | Colecciones | Enlaces | Hardcodeado | Estado DB |
|---|---|---|---|---|---|---|---|
| 1 | `hero` | `Section` (hero oscuro) | `eyebrow`, `title`, `paragraph1`, `paragraph2`, `cta` | — | `cta` | — | **todo antiguo** |
| 2 | `desafios` | `Section` | `title`, `paragraph1` | `items[]` (2) | — | — | antiguo; 4 ítems `item-1..4` |
| 3 | `servicios` | `Services` | `eyebrow`, `title` | `items[]` (2; `description` se divide en destinatarios y lista «Incluye…») | `items[].href` (WhatsApp) | H35–H36 etiquetas EQUIPOS/TRANSICIONES (por `_id`), H37 «Qué incluye» | antiguo; 3 ítems `item-1..3`; sin `eyebrow` |
| 4 | `experiencia` | `Section` | `title`, `paragraph1`–`3`, `highlight` | — | — | — | **igual** |
| 5 | `proceso` | `Section` | `eyebrow`, `title` | `items[]` (4) | — | — | igual, sin `eyebrow` |
| 6 | `testimonios` | `Testimonials` + `TestimonialCard` | `title`, `paragraph1` | `items[]` (§5, bloque C) | URL fija (H27) | H38 «TESTIMONIOS», H39 iniciales «RS», H40 «Extracto de recomendación», H41 idioma `en` (por autor), H26 | antiguo, con ids `item-1..3` |
| 7 | `contacto` | `Section` (oscuro) | `title`, `paragraph1`, `cta` | — | `cta` | — | antiguo + `paragraph2` heredado (no se renderiza) |
| — | `seo` | `Seo` | `title`, `description` | — | — | — | antiguo |

### 2.5 Comunidad y Experiencias `/comunidad-y-experiencias` — [ComunidadPage.jsx](../src/pages/ComunidadPage/ComunidadPage.jsx)

| # | Sección | Campos conectados | Colecciones | Hardcodeado | Estado DB |
|---|---|---|---|---|---|
| 1 | `hero` | `eyebrow`, `title` (dividido por regex), `paragraph1`, `paragraph2`, `cta` | — | — | **no existe** |
| 2 | `experiencias` | `title` | `items[]` (2; `description` se agrupa en introducción, modalidades, temas y notas; `href` de WhatsApp) | H42 «LAS EXPERIENCIAS», H43 «Modalidades», H44 «Qué trabaja» | **no existe** |
| 3 | `contacto` | `title`, `paragraph1`, `cta` (fondo de `/ › contacto.image`) | — | — | **no existe** |
| — | `seo` | `title`, `description` | — | — | **no existe** |

### 2.6 Contacto `/contacto` — [ContactoPage.jsx](../src/pages/ContactoPage/ContactoPage.jsx) y [ContactForm.jsx](../src/components/institutional/ContactForm.jsx)

| # | Sección | Campos conectados | Hardcodeado | Estado DB |
|---|---|---|---|---|
| 1 | `intro` | `title`, `paragraph1`, `paragraph2` (una oración por línea) | H45 eyebrow «Contacto» (fallback `c.eyebrow \|\| 'Contacto'`) | igual |
| 2 | `formulario` | 17 etiquetas, placeholders y estados (`nameLabel` … `successText`) | H46 mensaje de envío no disponible; **`pending` declarado pero sin uso** | igual |
| 2 | `contacto-directo` | `title`, `paragraph1`, `email` (link), `linkedin.href` | H47 «Correo electrónico», H48 «Escribirme por WhatsApp», H49 URL de WhatsApp, H50 «LinkedIn»; **`linkedin.label` no se renderiza** | `paragraph1` antiguo, sin `email` |
| — | `seo` | `title`, `description` | — | antiguo |

### 2.7 Artículos `/articulos` y `/articulos/:slug` — [Pages.jsx](../src/components/institutional/Pages.jsx) y [articles.jsx](../src/components/institutional/articles.jsx)

| Ruta | Sección | Campos conectados | Hardcodeado | Estado DB |
|---|---|---|---|---|
| `/articulos` | `intro` | `title`, `eyebrow`, `subtitle` (2 líneas), `paragraph1` | — | igual |
| `/articulos` | (listado) | Artículos del módulo de artículos (18 publicados). `listado` (`empty`, `readLabel`, `items[]`) **ya no se lee** | H19–H25 | igual |
| `/articulos/:slug` | `encabezado` | `collection` | H51 «Volver a artículos» | igual |
| `/articulos/:slug` | `contenido` | — (`unavailable` sin uso) | H52–H55 estados de carga, error e inexistente | igual |
| `/articulos/:slug` | `pie-articulo` | `signature`, `back` | H56 «Ver publicación original en LinkedIn ↗», H57 «Continuá leyendo» | firma sin acento |
| ambas | `seo` | `title`, `description` (en el detalle, solo sin artículo cargado) | H58 sufijo « \| Claudia Sánchez Urencio» y JSON-LD | sin acento |

### 2.8 Gracias `/gracias` y 404

| Ruta | Sección | Campos conectados | Estado DB |
|---|---|---|---|
| `/gracias` | `neutral` | `title`, `paragraph1`, `cta` | `paragraph1` y `cta` antiguos (apunta a `/disena-tu-futuro`) |
| `/gracias` | `confirmacion`, `proximos-pasos[]`, `volver` | preparados, **no se renderizan** (decisión documentada) | presentes; `signature` sin acento |
| `/gracias` | `seo` | `title`, `description` | `title` sin acento |
| `/404` | `intro`, `seo` | `eyebrow`, `title`, `paragraph1`, `cta`, `seo` | `seo.title` sin acento |

### 2.9 Landing `/diseno-de-carrera` — [ClaudiaSite.jsx](../src/components/claudia/ClaudiaSite.jsx)

Toda la landing lee la ruta CMS `/diseno-de-carrera` ([ClaudiaCms.jsx:7](../src/integration/eze-cms/ClaudiaCms.jsx#L7)), y en esa ruta **no hay datos**: Supabase los tiene en `/disena-tu-futuro`. Al contenido remoto se le aplica `publicName()`, que normaliza «Claudia Sánchez» a «Claudia Sánchez Urencio».

| # | Sección (key) | Componente | Campos conectados (claves que lee React) | Colecciones | Enlaces | Hardcodeado |
|---|---|---|---|---|---|---|
| — | `site-header` | `SiteHeader` | `brandLink`, `navLink0`–`navLink3` (fallback de `site.nav`), `ctaLink` (fallback «Reservar» → Calendly); el texto al pie del menú móvil = `situations.closing` | — | ancla y Calendly | H59 skip link, H62 «Índice», H63 «Inicio» |
| 1 | `hero` | `Hero` | `eyebrow` (dividido por « · »), `title`, `highlightedTitle`, `description`, `ctaLabel`, `ctaLink`, `complement`, `portrait` | — | Calendly | H64 alt del retrato |
| 2 | `situations` | `Situations` | `eyebrow`, `title`, `intro` (`\n` = línea), `closing`, `ctaLabel`, `ctaLink` | `items[]` (3; `number`, `label`, `text`) | Calendly | — |
| 3 | *(sin sección CMS)* | `CareerTestimonials` | — | — | URL de recomendaciones, Calendly | **H65–H72: sección completa** (§5, bloque D) |
| 4 | `approach` | `Approach` | `eyebrow`, `title`, `intro` (`\n\n` = párrafo) | `steps[]` (3) | — | — |
| 4b | `life` | `LifeModel` + `LifeDiagram` | `title`, `intro`, `instruction`, `hubLabel`, `closing` (`\n` = línea) | `dimensions[]` (6) | — | — |
| 5 | `about` | `About` | `eyebrow`, `title`, `paragraphs.0`–`.2`; retrato = `hero.portrait` (compartido) | `facts[]` (2) | — | — |
| 5b | `closing` | `About` (bloque de reserva) | `eyebrow`, `title`, `text`, `ctaLabel`, `ctaLink` | — | Calendly | — |
| — | `site-footer` | `SiteFooter` | `brand`, `line`, `description`, `copyright`, `exploreHeading`, `connectHeading`, `homeLink`, `navLink0`–`navLink3`, `linkedinLink`, `calendlyLink` | — | LinkedIn y Calendly | — |
| — | *(sin sección CMS)* | `ClaudiaSite` | — | — | — | H60–H61 meta title y description |

El componente `Testimonials.jsx` (testimonios ilustrativos) **no se renderiza**. Su sección `testimonials` sigue en Supabase.

### 2.10 Redirecciones

`/disena-tu-futuro` redirige a `/diseno-de-carrera` (React y `vercel.json`); `/newsletter` y `/newsletter/:slug` redirigen a `/articulos`. Sin contenido propio.

---

## 3. Estado de editabilidad

### 3.1 Conteo por página

| Página | Campos conectados | Colecciones conectadas | ¿Datos alcanzables en Supabase? |
|---|---|---|---|
| Globales | 15 | 0 | sí (falta `community`) |
| `/` | 38 | 3 | sí |
| `/personas` | 24 | 3 | sí |
| `/empresas` | 27 | 4 | sí |
| `/comunidad-y-experiencias` | 12 | 1 | **no** |
| `/contacto` | 26 | 0 | sí |
| `/articulos` + detalle | 11 | 0 (artículos aparte) | sí |
| `/gracias` + `/404` | 11 | 0 | sí |
| `/diseno-de-carrera` | 56 | 4 (+1 hardcodeada) | **no** (ruta distinta) |
| **Total** | **220** | **15** | 152 campos alcanzables |

El conteo incluye las colecciones como un campo y cuenta los links (`label` + `href`) como un campo. No incluye los campos preparados que no se renderizan (§6.4).

### 3.2 Contenido hardcodeado (72)

| ID | Ubicación | Valor actual exacto | Propuesta |
|---|---|---|---|
| H01 | Footer institucional | `Menú` | CREAR `institutional-footer.menuLabel` |
| H02 | Footer institucional | `Todos los derechos reservados.` | CREAR `institutional-footer.rightsText` |
| H03 | `/` Trayectoria (mobile) | `Experiencia corporativa` | CREAR `sobre-mi.experienceHeading` |
| H04 | `/` Trayectoria | `20` + `+` (mobile y desktop) | CREAR `sobre-mi.metricValue` = `20`, `sobre-mi.metricSuffix` = `+` |
| H05 | `/` Trayectoria (mobile) | `Años de experiencia corporativa` | CREAR `sobre-mi.metricLabelMobile` |
| H06 | `/` Trayectoria (desktop) | `años de experiencia` ⏎ `corporativa` | CREAR `sobre-mi.metricLabel` = `años de experiencia\ncorporativa` |
| H07 | `/` Trayectoria | logo `/assets/claudia-sanchez/testimonials/diageo-crop.png`, alt `Diageo` | CREAR `sobre-mi.primaryLogo` (image) + `primaryLogoAlt` |
| H08 | `/` Trayectoria | logo `/assets/claudia-sanchez/testimonials/kraft.png`, alt `Kraft Foods` | CREAR `sobre-mi.secondaryLogo` (image) + `secondaryLogoAlt` |
| H09 | `/` Trayectoria (mobile) | `Liderazgo en Recursos Humanos` | CREAR `sobre-mi.roleLine` |
| H10 | `/` Trayectoria (mobile) | `Responsabilidades regionales en América Latina` | CREAR `sobre-mi.regionLine` |
| H11 | `/` Trayectoria (desktop) | `Responsabilidades regionales` ⏎ `América Latina` | CREAR `sobre-mi.regionLineDesktop` = `Responsabilidades regionales\nAmérica Latina` |
| H12 | `/` Servicios | `Áreas de trabajo` | CREAR `servicios.eyebrow` |
| H13 | `/` Servicios (tarjeta) | `Explorar` + ` ↗` | CREAR `servicios.cardLinkLabel` = `Explorar` |
| H14 | `/` Servicios (cierre) | `Cada desafío merece una conversación diferente.` | CREAR `servicios.closingTitle` |
| H15 | `/` Servicios (cierre) | `Conversemos sobre lo que necesitás y exploremos cómo puedo acompañarte.` | CREAR `servicios.closingText` |
| H16 | `/` Enfoque | `Career Longevity · Mi enfoque` | CREAR `enfoque.eyebrow` |
| H17 | `/` Testimonios | `Recomendaciones` | CREAR `testimonios.eyebrow` |
| H18 | `/` Artículos | `Ideas y perspectivas` | CREAR `articulos.eyebrow` |
| H19 | Tarjetas de artículo | `Leer artículo` + ` →` | Conectar `/articulos › listado.readLabel` (mismo texto) |
| H20 | Tarjetas de artículo | `Cargando artículos…` | CREAR `listado.loading` |
| H21 | Tarjetas de artículo | `No pudimos cargar los artículos.` | CREAR `listado.error` |
| H22 | Tarjetas de artículo | `No hay artículos publicados por el momento.` | Conectar `listado.empty` y ACTUALIZAR su valor (hoy: `Los artículos estarán disponibles próximamente.`) |
| H23 | Paginador | `Mostrando {n} de {total} artículos` | CREAR `listado.countTemplate` |
| H24 | Paginador | `Mostrar más artículos` | CREAR `listado.moreLabel` |
| H25 | Paginador | `Mostrar menos` | CREAR `listado.lessLabel` |
| H26 | Tarjeta de testimonio (Personas, Empresas) | `RECOMENDACIÓN PÚBLICA EN LINKEDIN` | CREAR itemField `sourceLabel` (igual que en Inicio) |
| H27 | Tarjeta de testimonio (Personas, Empresas) | `https://www.linkedin.com/in/claudiasanchezurencio/details/recommendations/?detailScreenTabIndex=0` | CREAR itemField `linkedinUrl` (igual que en Inicio) |
| H28 | `/personas` Servicios | `Programa` | CREAR `servicios.programLabel` |
| H29 | `/personas` Enfoque | `CÓMO TRABAJAMOS` | CREAR `enfoque.eyebrow` |
| H30 | `/personas` Enfoque, paso 01 | `Comprender tu momento` | CREAR `enfoque.step1Title` |
| H31 | `/personas` Enfoque, paso 02 | `Explorar nuevas perspectivas` | CREAR `enfoque.step2Title` |
| H32 | `/personas` Enfoque, paso 03 | `Construir una estrategia` | CREAR `enfoque.step3Title` |
| H33 | `/personas` Testimonios | `TESTIMONIOS` | CREAR `testimonios.eyebrow` |
| H34 | `/personas` Contacto | `CHARLEMOS` | CREAR `contacto.eyebrow` |
| H35 | `/empresas` Servicios | `EQUIPOS` (por `_id` `equipos-culturas`) | CREAR itemField `tag` |
| H36 | `/empresas` Servicios | `TRANSICIONES` (por `_id` `executive-longevity`) | CREAR itemField `tag` |
| H37 | `/empresas` Servicios | `Qué incluye` | CREAR `servicios.includedHeading` |
| H38 | `/empresas` Testimonios | `TESTIMONIOS` | CREAR `testimonios.eyebrow` |
| H39 | `/empresas` Testimonios | iniciales `RS` (por autor Ricardo Schmidt) | CREAR itemField `initials` |
| H40 | `/empresas` Testimonios | `Extracto de recomendación` (por autora Ana Cristina) | CREAR itemField `note` |
| H41 | `/empresas` Testimonios | `lang="en"` para Pedro, `es` para el resto (por autor) | CREAR itemField `lang` |
| H42 | `/comunidad-y-experiencias` | `LAS EXPERIENCIAS` | CREAR `experiencias.eyebrow` |
| H43 | `/comunidad-y-experiencias` | `Modalidades` | CREAR `experiencias.modalitiesHeading` |
| H44 | `/comunidad-y-experiencias` | `Qué trabaja` | CREAR `experiencias.topicsHeading` |
| H45 | `/contacto` Intro | `Contacto` | CREAR `intro.eyebrow` |
| H46 | `/contacto` Formulario | `El envío todavía no está disponible. Tus datos se conservan; mientras tanto puedes escribirme por correo electrónico o LinkedIn.` | Conectar `formulario.pending` y ACTUALIZAR su valor (hoy: `El formulario todavía no está operativo. Puedes contactarme a través de LinkedIn.`) |
| H47 | `/contacto` Canales | `Correo electrónico` | CREAR `contacto-directo.emailChannelLabel` |
| H48 | `/contacto` Canales | `Escribirme por WhatsApp` | CREAR `contacto-directo.whatsapp` (link): label |
| H49 | `/contacto` Canales | `WHATSAPP_URLS.contacto` ([whatsapp.js](../src/data/institutional/whatsapp.js)) | CREAR `contacto-directo.whatsapp` (link): href |
| H50 | `/contacto` Canales | `LinkedIn` | Conectar `contacto-directo.linkedin.label` (ACTUALIZAR su valor, §6.2) |
| H51 | Detalle de artículo | `Volver a artículos` (con ←) | CREAR `encabezado.backLabel` |
| H52 | Detalle de artículo | `Cargando artículo…` | CREAR `contenido.loading` |
| H53 | Detalle de artículo | `No pudimos cargar el artículo.` | CREAR `contenido.error` |
| H54 | Detalle de artículo | `Artículo inexistente` | CREAR `contenido.missingTitle` |
| H55 | Detalle de artículo | `El artículo que buscás no está publicado o no existe.` | Conectar `contenido.unavailable` y ACTUALIZAR su valor (hoy: `Este artículo todavía no está disponible.`) |
| H56 | Detalle de artículo | `Ver publicación original en LinkedIn` + ` ↗` | CREAR `pie-articulo.sourceLabel` |
| H57 | Detalle de artículo | `Continuá leyendo` | CREAR `pie-articulo.relatedTitle` |
| H58 | `Seo` | sufijo ` \| Claudia Sánchez Urencio` y autor JSON-LD | **Mantener en código** (técnico) |
| H59 | Landing | `Saltar al contenido` | CREAR `site-header.skipLabel` |
| H60 | Landing (meta) | `Diseño de Carrera \| Claudia Sánchez Urencio` | CREAR sección `seo.title` |
| H61 | Landing (meta) | `Programa de acompañamiento estratégico para ejecutivos con experiencia que quieren definir su siguiente etapa profesional con claridad, dirección y un plan de acción.` | CREAR sección `seo.description` |
| H62 | Landing, menú móvil | `Índice` | CREAR `site-header.menuEyebrow` |
| H63 | Landing, menú móvil | `Inicio` | CREAR `site-header.menuHomeLabel` |
| H64 | Landing, retrato | `Retrato de Claudia Sánchez Urencio` | CREAR `hero.portraitAlt` |
| H65 | Landing, testimonios | `EXPERIENCIAS REALES` | CREAR sección `career-testimonials.eyebrow` |
| H66 | Landing, testimonios | `Decisiones importantes. Experiencias que hablan por sí solas.` | `career-testimonials.title` |
| H67 | Landing, testimonios | `He acompañado a profesionales con trayectoria a ganar claridad, explorar nuevas posibilidades y avanzar hacia su siguiente etapa.` | `career-testimonials.subtitle` |
| H68 | Landing, testimonios | `¿Y si lo que sigue empieza hoy?` | `career-testimonials.closing` |
| H69 | Landing, testimonios | colección de 3 testimonios ([careerTestimonials.js](../src/data/claudia/careerTestimonials.js)) | `career-testimonials.items[]` (§5) |
| H70 | Landing, testimonios | `RECOMENDACIÓN PÚBLICA EN LINKEDIN` | itemField `sourceLabel` |
| H71 | Landing, testimonios | URL de recomendaciones | itemField `linkedinUrl` |
| H72 | Landing, testimonios | CTA `Reservar una sesión estratégica` → Calendly | `career-testimonials.ctaLink` (link) |

Las cadenas de accesibilidad (`aria-label` como «Principal», «Abrir menú» o «Pilares de Career Longevity», y los `sr-only` del tipo «(se abre en una pestaña nueva)») no se cuentan. Se recomienda mantenerlas en código.

### 3.3 Lógicas de compatibilidad que ocultan contenido remoto

Hoy evitan que algunos valores antiguos de Supabase se vean en producción. **Deben quedar como están hasta que Supabase tenga los valores definitivos**; después conviene retirarlas en un cambio aparte.

| ID | Lógica | Archivo |
|---|---|---|
| L01 | Si `hero.paragraph2` existe o `paragraph1` es el texto heredado, se fuerza `HERO_DESCRIPTION` | [HomePage.jsx:46](../src/pages/HomePage/HomePage.jsx#L46) |
| L02 | Si la imagen termina en `/claudia-hero.png`, se sustituye por `claudia-bg-hero.png` | [HomePage.jsx:48](../src/pages/HomePage/HomePage.jsx#L48) |
| L03 | Si hay menos de 3 servicios remotos, se usan el título local y se completan los ítems locales | [HomePage.jsx:110](../src/pages/HomePage/HomePage.jsx#L110) |
| L04 | La descripción heredada de `comunidad` se reemplaza por `COMMUNITY_DESCRIPTION` | [HomePage.jsx:120](../src/pages/HomePage/HomePage.jsx#L120) |
| L05 | `resolveApproachSteps` completa hasta 3 pasos con los locales | [HomePage.jsx:144](../src/pages/HomePage/HomePage.jsx#L144) |
| L06 | `resolveBusinessTestimonials` descarta la versión «pendientes de verificación» | [EmpresasPage/content.js:19](../src/pages/EmpresasPage/content.js#L19) |
| L07 | `publicName()` reescribe el nombre en todo el contenido remoto de la landing | [ClaudiaCms.jsx:9](../src/integration/eze-cms/ClaudiaCms.jsx#L9) |
| L08 | Los retratos de testimonios se resuelven por autor cuando `image` viene vacío (Inicio, Personas, Empresas) | HomePage / PersonasPage / EmpresasPage |
| L09 | `PERSONAS_WHATSAPP_HREFS` sobrescribe hrefs **solo en el fallback local** (el valor remoto gana en producción) | [content.js:9](../src/components/institutional/content.js#L9) |
| L10 | `_id` tomado por `name` para la colección ilustrativa (`Testimonials.jsx`, sin uso) | [Testimonials.jsx](../src/components/claudia/Testimonials.jsx) |

---

## 4. Diferencias respecto del manifiesto

### 4.1 Páginas institucionales

En las páginas institucionales y en los globales, `initialContent` coincide con el fallback efectivo en **todos los campos excepto dos**:

| Ruta | Campo | Manifiesto | React |
|---|---|---|---|
| `/personas` | `servicios.items[item-2].href` | `/contacto?tipo=persona&servicio=transicion-carrera` | `WHATSAPP_URLS.transicionCarrera` |
| `/personas` | `servicios.items[item-1].href` | `/contacto?tipo=persona&servicio=coaching-ejecutivo` | `WHATSAPP_URLS.nextLevelLeader` |

La causa es que el generador no aplica `PERSONAS_WHATSAPP_HREFS`.

### 4.2 Landing `/diseno-de-carrera` (desactualizada)

| Sección | Problema |
|---|---|
| página | `key: diseno-de-carrera`, `slug: disena-tu-futuro` (el slug es el de la página antigua). La página de Supabase está en `/disena-tu-futuro` con una `key` que no se puede verificar (el manifiesto antiguo del CMS usaba `carrera`) |
| `hero` | Declara `titleLines.0-3`, `accentFrom` y `subtitle`, que React no usa. **Faltan** `title`, `highlightedTitle`, `description`, `ctaLabel`, `ctaLink` y `portrait`. `complement` difiere en mayúsculas |
| `situations` | `intro` y `items` (ids `seguir-creciendo`, `preparar-transicion`) están desactualizados. Faltan `ctaLabel` y `ctaLink` |
| `impact` | Declarada (encuesta 100 %/80 %/77 %/60 %), **no se renderiza y no existe en Supabase** |
| `approach` | `intro` y los 3 `steps[].text` están desactualizados |
| `life` | `title`, `intro` y `closing` están desactualizados. `eyebrow` y `support` no se usan. Faltan `instruction` y `hubLabel` |
| `about` | `paragraphs.0-2` están desactualizados. `facts` tiene 1 ítem (React tiene 2) y la etiqueta en minúsculas |
| `closing` | `title` y `text` están desactualizados. Faltan `ctaLabel` y `ctaLink` |
| `site-header` | `navLink0-3` = Enfoque / Testimonios / **Modelo L.I.F.E. (`#life`)** / Sobre mí. React: **Tu siguiente movimiento (`#situaciones`)** / Testimonios / Enfoque (`#enfoque`) / Sobre mí. El ancla `#life` ya no existe. `nav` y `ctaLabel` sobran |
| `site-footer` | Mismos `navLink0-3` antiguos. `description` está desactualizada. `nav`, `linkedinLabel` y `calendlyLabel` sobran |
| testimonios reales | **No existe ninguna sección** para `CareerTestimonials` |
| `seo` | No existe (los meta están hardcodeados) |

### 4.3 Errores del generador [editorial-manifest.mjs](../scripts/editorial-manifest.mjs)

Hay que corregirlos antes de regenerar el manifiesto:

1. Inserta siempre la sección `impact` (línea 30) y elimina `testimonials`, pero no agrega la sección de testimonios reales.
2. Copia `site.hero` tal cual, que trae `subtitle` y no tiene `description`, `ctaLabel`, `ctaLink` ni `portrait`. No refleja los fallbacks que arman los componentes.
3. Busca la clave `footer` en lugar de `site-footer`, así que el footer de la landing nunca se actualiza.
4. No agrega `instruction` ni `hubLabel` (life), `ctaLabel`/`ctaLink` (situations, closing) ni `navLinkN` efectivos.
5. No aplica `PERSONAS_WHATSAPP_HREFS`.
6. Publica `navbar` y `footer` como secciones de `/` además de los globales.
7. Conserva `slug: disena-tu-futuro` para la página nueva.

Recomendación: que **los componentes y el generador importen los mismos objetos de fallback** desde un único módulo, y una prueba que compare `initialContent` con el fallback de **cada** sección renderizada, incluida la landing.

### 4.4 Conflictos de claves y contenido duplicado

| ID | Tipo | Detalle | Tratamiento |
|---|---|---|---|
| K1 | Clave de página | La landing (`diseno-de-carrera`) probablemente no coincide con la `key` almacenada. `sync_site_manifest` **crearía una página nueva** en lugar de mover la ruta | Decisión D2 (§8) |
| K2 | Slug | La página nueva heredaría `slug: disena-tu-futuro`, igual al de la antigua: posible violación de unicidad | Usar `slug: diseno-de-carrera` |
| K3 | Clave de sección | `testimonials` (ilustrativos, en Supabase) frente a los testimonios reales | Usar una clave **nueva**, `career-testimonials`; **no reutilizar** `testimonials` |
| K4 | Duplicado | Las secciones `/ › navbar` y `/ › footer` duplican los globales `institutional-navbar` y `institutional-footer`, que son los que se leen | Quitarlas del manifiesto. En Supabase quedan como OBSOLETO |
| K5 | Semántica duplicada | `ctaLabel` y `ctaLink.label` en hero, situations, closing y header | Declarar `ctaLink` (link) como campo editable. `ctaLabel` queda como OBSOLETO cuando `ctaLink` exista |
| K6 | Clave distinta | `site.hero.subtitle` frente a la clave CMS `description` | Mantener `description` (la que lee el componente) |
| K7 | Estructura distinta | `nav[]` (Supabase y manifiesto) frente a `navLink0-3` (lo que lee React) | Mantener `navLinkN`. `nav` queda como OBSOLETO |
| K8 | Edición mixta | Situations, Approach, LifeDiagram y About editan ítems de colección con rutas indexadas (`items.0.label`) | Funciona en el editor contextual, pero conviene envolver con `ClaudiaEditableCollection` (etapa 2) |
| K9 | `_id` con semántica | `item-3` (estilo del programa en Personas), `item-1`/`item-2` (WhatsApp en Personas), `equipos-culturas`/`executive-longevity` (etiquetas), `comunidad` (L04) | Conservar exactamente los `_id` de React en toda actualización |
| K10 | Manifiesto ajeno | [CMS_Ezequiel/manifests/claudia-sanchez.json](../../CMS_Ezequiel/manifests/claudia-sanchez.json) es un esqueleto antiguo (`carrera` → `/disena-tu-futuro`, `/newsletter`) | **No sincronizarlo nunca**. Marcarlo como histórico |
| D1 | Duplicado | Aldo Barrios (Inicio y landing), Eduardo Díaz Cortazar (Inicio y Personas) y Manuel Mirabent (Personas y landing) | §5 |
| D2 | Duplicado | Etiqueta y URL de Calendly en 6 lugares de la landing; URL de LinkedIn en el footer global, contacto directo y el footer de la landing | Aceptable: cada uno es un campo editable propio |
| D3 | Compartido | `/ › contacto.image` se usa como fondo en Inicio, Personas y Comunidad | Documentar en el CMS: editarla cambia tres páginas |
| D4 | Duplicado en código | `HERO_DESCRIPTION` y `COMMUNITY_DESCRIPTION` copian valores del CMS | Retirar después de la etapa 4 |

---

## 5. Los cuatro bloques de testimonios

| | A · Inicio | B · Personas | C · Empresas | D · Diseño de Carrera |
|---|---|---|---|---|
| Ubicación CMS | `/ › testimonios.items` | `/personas › testimonios.items` | `/empresas › testimonios.items` | **ninguna** (hardcodeado) |
| Componente | `Testimonials` + `TestimonialCard` | `Testimonials` + `TestimonialCard` | `Testimonials` + `TestimonialCard` (+ iniciales, nota, idioma) | `CareerTestimonials` (propio) |
| Orden en React (el índice 0 es la tarjeta destacada) | `item-1` Aldo Barrios · `item-2` Dulce Cano · `item-3` Eduardo Díaz Cortazar | `item-1` Manuel Mirabent · `item-2` Ovidio Uribe · `item-3` Eduardo Díaz Cortazar | `ana-cristina` · `pedro-fondevila` · `ricardo-schmidt` | `aldo-barrios` · `jose-herrera` · `manuel-mirabent` |
| Campos por ítem | `_id`, `visible`, `author`, `role`, `quote`, `image`, `alt`, `sourceLabel`, `linkedinUrl` | `_id`, `visible`, `author`, `role`, `quote`, `image`, `alt` | igual que B | `_id`, `author`, `role`, `quote`, `image`, `alt`, `lang` (sin `visible`) |
| Campos de sección | `title`, `paragraph1`, `closingEyebrow`, `closingTitle`, `closingDescription`, `closingLink` + H17 | `title`, `paragraph1` + H33 | `title`, `paragraph1` + H38 | todo hardcodeado (H65–H72) |
| En Supabase hoy | Lucía López Sarre · Fabián Fuentes · Pedro Fondevila (imágenes vacías, sin campos de cierre) | Santiago Porrero · Ovidio Uribe · Alejandra García Ruiz | `item-1` Pedro (otra cita, en español) · `item-2` Ana («Subdirectora…», «En Marzo…») · `item-3` Ricardo («…en DON SATUR SRL») | en `/disena-tu-futuro › testimonials`: 6 testimonios **ficticios** (`Ricardo M.` … `Gabriela T.`) + **`Jorge / HH / Test`**, más `stat` y `disclaimer` |
| ¿Se ve en producción? | sí, el contenido antiguo | sí, el contenido antiguo | sí, el contenido antiguo (L06 no lo filtra porque el título es otro) | no (React no lee esa sección) |

**Personas repetidas en varios bloques** (mismos textos en todos):

- **Aldo Barrios** (A y D): misma cita, cargo y foto. Alt: `Aldo Barrios` en A y `Retrato de Aldo Barrios` en D. En D lleva `lang: en`.
- **Eduardo Díaz Cortazar** (A y B): misma cita, cargo y foto. Alt: `Eduardo Díaz Cortazar` en A y `Retrato de Eduardo Díaz Cortazar` en B.
- **Manuel Mirabent** (B y D): idéntico, incluido el alt.

**Tratamiento propuesto:**

1. **Cuatro colecciones independientes**, una por sección. Motivos: el CMS no admite colecciones en globales ([site-globals.md](../../CMS_Ezequiel/docs/site-globals.md)); cada bloque tiene su propio orden, su tarjeta destacada y diferencias de alt e idioma que hay que conservar, y las actualizaciones atómicas de colección dependen de la página y la sección.
2. **Un mismo esquema de ítem para los cuatro bloques**, como campos opcionales, para que el editor sea uniforme: `author`, `role`, `quote`, `image`, `alt`, `lang`, `sourceLabel`, `linkedinUrl`, `initials`, `note`, `visible`. Los campos que un bloque no usa quedan vacíos y el render actual no cambia.
3. **Bloque D**: CREAR la sección nueva `career-testimonials` en la página de la landing, con `eyebrow`, `title`, `subtitle`, `closing`, `ctaLink` e `items[]`, usando los `_id` de React (`aldo-barrios`, `jose-herrera`, `manuel-mirabent`). La sección `testimonials` existente queda como **OBSOLETO**: no se reutiliza, no se borra y no se publica.
4. **Bloques A, B y C**: ACTUALIZAR la colección completa con los valores de React, en el orden y con los `_id` de React. En C, agregar `initials` (`RS` en Ricardo), `note` (`Extracto de recomendación` en Ana) y `lang` (`en` en Pedro, `es` en Ana y Ricardo) **en el mismo cambio** en que el código pase a leer esos campos. Mientras tanto, conservar la lógica por autor.
5. Documentar en el CMS que editar una cita repetida exige hacerlo en cada bloque donde aparece.

> **Para confirmar (D1 en §8):** [EMPRESAS-REDISENO.md](EMPRESAS-REDISENO.md) dice «Pedro a la izquierda», pero el render actual pone **Ana Cristina en primer lugar** (tarjeta destacada), porque `businessTestimonials.js` la ubica primero. Según la regla de fuente de verdad, el orden propuesto es Ana, Pedro, Ricardo.

---

## 6. Propuesta de sincronización

### 6.1 CREAR

**a) Lo crea `sync_site_manifest` porque no existe en Supabase** (el valor sale de `initialContent`, que debe ser idéntico al fallback):

| Ruta | Sección | Campo | Valor que aportará `initialContent` |
|---|---|---|---|
| / | testimonios | closingEyebrow | `MÁS EXPERIENCIAS COMPARTIDAS` |
| / | testimonios | closingTitle | `Más de 50 recomendaciones públicas en LinkedIn.` |
| / | testimonios | closingDescription | `Conoce otras experiencias de profesionales que han trabajado conmigo.` |
| / | testimonios | closingLink | `{ label: "Ver todas las recomendaciones ↗", href: "https://www.linkedin.com/in/claudiasanchezurencio/details/recommendations/?detailScreenTabIndex=0" }` |
| / | enfoque | steps[] | `anticipacion` · `estrategia` · `ecosistema` (colección completa) |
| / | contacto | eyebrow | `Comencemos` |
| / | contacto | image | `/assets/claudia-sanchez/claudia-bg-contacto.png` |
| /empresas | servicios | eyebrow | `ACOMPAÑAMIENTO ORGANIZACIONAL` |
| /empresas | proceso | eyebrow | `CÓMO TRABAJAMOS` |
| /contacto | contacto-directo | email | `{ label: "clausurencio@gmail.com", href: "mailto:clausurencio@gmail.com" }` |
| GLOBAL | institutional-navbar | community | `{ label: "Comunidad y Experiencias", href: "/comunidad-y-experiencias" }` |
| /comunidad-y-experiencias | (página) | `hero`, `experiencias` (+ `items[]` `lifeplacement`, `conscious-leadership`), `contacto`, `seo` | contenido completo de `careerContent.js` |

**b) Campos nuevos para el contenido hardcodeado:** son los 59 campos y 6 tipos de itemField de §3.2 (todos salvo H58 y los 5 que reutilizan campos existentes: H19, H22, H46, H50 y H55), con un valor inicial **idéntico** al literal actual.

**c) Declaraciones que faltan en el manifiesto de la landing:** `hero.title`, `hero.highlightedTitle`, `hero.description`, `hero.ctaLink`, `hero.portrait`, `situations.ctaLink`, `life.instruction`, `life.hubLabel`, `closing.ctaLink`, y las secciones nuevas `career-testimonials` y `seo`. Los campos `ctaLink` deben tener como valor inicial el link efectivo actual, **no `null`**, porque el tipo `link` exige un objeto: `{ label: "Reservar una sesión estratégica", href: "https://calendly.com/claudiasanchezurencio/45min" }`. En el header, el label es `Reservar`. En el footer: `homeLink` = `{ "Inicio", "/" }`, `linkedinLink` = `{ "LinkedIn", "https://www.linkedin.com/in/careertransitioncoachclau/" }` y `calendlyLink` = `{ "Calendly", Calendly }`.

### 6.2 ACTUALIZAR — valores existentes que difieren del render de React

`sync_site_manifest` **no los modifica**: requieren el procedimiento de la etapa 4.

**Campos de primer nivel (45):**

| Ruta | Sección | Campo | Valor actual en Supabase | Valor definitivo (React) |
|---|---|---|---|---|
| / | hero | eyebrow | `Claudia Sanchez Urencio` | `Claudia Sánchez Urencio` |
| / | hero | paragraph1 | `Acompaño a líderes, ejecutivos y organizaciones en momentos de desarrollo, transformación y cambio.` | `Acompaño a líderes, ejecutivos y organizaciones a reconocer nuevas posibilidades, tomar mejores decisiones y avanzar con claridad, combinando más de 20 años de experiencia corporativa con una mirada estratégica y humana.` |
| / | hero | image | `/assets/claudia-sanchez/claudia-hero.png` | `/assets/claudia-sanchez/claudia-bg-hero.png` |
| / | hero | alt | `Claudia Sanchez Urencio` | `Claudia Sánchez Urencio` |
| / | sobre-mi | paragraph1 | `Soy Claudia Sanchez Urencio, coach ejecutiva y especialista en desarrollo de liderazgo y estrategia de carrera.` | `Soy Claudia Sánchez Urencio, coach ejecutiva y especialista en desarrollo de liderazgo y estrategia de carrera.` |
| / | servicios | title | `Dos formas de acompañar el desarrollo y la transformación.` | `Tres formas de construir la siguiente etapa con estrategia.` |
| / | enfoque | title | `Comprender el contexto. Encontrar claridad. Transformarla en acción.` | `Anticipar. Diseñar. Ejecutar.` |
| / | enfoque | paragraph1 | `Cada persona, equipo y organización tiene una historia, desafíos y objetivos diferentes.` | `Career Longevity parte de una idea sencilla: las decisiones importantes de carrera no deberían comenzar cuando las opciones ya se redujeron.` |
| / | enfoque | paragraph2 | `Por eso, mi enfoque comienza por escuchar y comprender el contexto antes de proponer soluciones.` | `Trabajamos con claridad, escenarios de futuro y un ecosistema de especialistas para construir una One-Page Strategy y un plan de ejecución.` |
| / | enfoque | highlight | `Porque el desarrollo y la transformación requieren algo más que buenas ideas: necesitan claridad, compromiso y acción.` | `No se trata de improvisar el siguiente movimiento, sino de prepararlo con perspectiva y método.` |
| / | seo | title | `Inicio \| Claudia Sanchez Urencio` | `Career Longevity \| Claudia Sánchez Urencio` |
| / | seo | description | `Acompaño a líderes, ejecutivos y organizaciones en momentos de desarrollo, transformación y cambio.` | `Estrategia de carrera para líderes senior que quieren anticipar y diseñar su siguiente etapa.` |
| /personas | enfoque | paragraph4 | `El objetivo no es darte respuestas predeterminadas, sino ayudarte a tomar decisiones más conscientes y avanzar con mayor seguridad.` | `Transformamos tus reflexiones en decisiones y acciones concretas, para que avances con mayor claridad, confianza y seguridad.` |
| /personas | seo | title | `Para personas \| Claudia Sanchez Urencio` | `Para personas \| Claudia Sánchez Urencio` |
| /empresas | hero | eyebrow | `Para empresas` | `Empresas` |
| /empresas | hero | title | `El desarrollo de tus líderes impulsa la evolución de tu organización.` | `Cuidar a las personas también protege la continuidad de la organización.` |
| /empresas | hero | paragraph1 | `Acompaño a empresas y equipos de liderazgo a fortalecer sus capacidades, afrontar procesos de cambio y transformar los desafíos del negocio en oportunidades de desarrollo.` | `Acompaño a equipos y líderes senior durante reorganizaciones, cambios de liderazgo y transiciones profesionales.` |
| /empresas | hero | paragraph2 | `Combino experiencia corporativa, coaching ejecutivo y una mirada estratégica de las personas y las organizaciones.` | `Intervenciones claras, confidenciales y alineadas con el contexto de la organización.` |
| /empresas | hero | cta.label | `Explora los servicios` | `Explora las soluciones` |
| /empresas | desafios | title | `Los desafíos del negocio también son desafíos de liderazgo.` | `Momentos que requieren una intervención con método.` |
| /empresas | desafios | paragraph1 | `Las organizaciones evolucionan constantemente. Nuevas responsabilidades, cambios de dirección y equipos con distintas necesidades exigen líderes capaces de adaptarse, tomar decisiones y desarrollar a las personas.` | `La fricción entre equipos y la salida de un líder senior afectan relaciones, conocimiento y reputación.` |
| /empresas | servicios | title | `Soluciones de desarrollo adaptadas a tu organización` | `Soluciones para equipos y transiciones ejecutivas` |
| /empresas | testimonios | title | `Experiencias de liderazgo y transformación` | `Experiencias de quienes han trabajado conmigo` |
| /empresas | testimonios | paragraph1 | `Conoce algunas experiencias de profesionales que han trabajado conmigo en el desarrollo de líderes, equipos y proyectos organizacionales.` | `Conocé cómo el acompañamiento a líderes y equipos se traduce en nuevas perspectivas, desarrollo y cambios dentro de las organizaciones.` |
| /empresas | contacto | title | `Hablemos de los desafíos de tu organización.` | `Diseñemos una intervención acorde con tu organización.` |
| /empresas | contacto | paragraph1 | `Si buscas fortalecer el liderazgo, desarrollar a tus equipos o acompañar un proceso de transformación, podemos comenzar por conocer las necesidades de tu empresa.` | `Comparte el contexto y el momento que necesitan acompañar.` |
| /empresas | contacto | cta.label | `Conversemos` | `Solicitar información` |
| /empresas | contacto | cta.href | `/contacto?tipo=empresa` | `/contacto` |
| /empresas | seo | title | `Para empresas \| Claudia Sanchez Urencio` | `Soluciones para empresas \| Claudia Sánchez Urencio` |
| /empresas | seo | description | `Acompaño a empresas y equipos de liderazgo a fortalecer sus capacidades, afrontar procesos de cambio y transformar los desafíos del negocio en oportunidades de desarrollo.` | `Equipos y Culturas Fascinantes y Executive Longevity Program para organizaciones y líderes senior.` |
| /contacto | contacto-directo | paragraph1 | `También puedes contactarme por correo electrónico.` | `También puedes contactarme por correo electrónico, WhatsApp o LinkedIn.` |
| /contacto | contacto-directo | linkedin.label | `Claudia Sanchez Urencio` | `LinkedIn` |
| /contacto | seo | title | `Contacto \| Claudia Sanchez Urencio` | `Contacto \| Claudia Sánchez Urencio` |
| /contacto | seo | description | `Cada persona y cada organización enfrenta desafíos diferentes. Me gustaría conocer tu situación y explorar cómo puedo acompañarte.` | `Contacta a Claudia Sánchez Urencio por formulario, correo electrónico o WhatsApp.` |
| /gracias | neutral | paragraph1 | `Esta página aparece después de completar una reserva. Si todavía no has agendado una conversación, puedes regresar al programa.` | `Esta página aparece después de completar una reserva. Si todavía no has agendado, puedes regresar al programa.` |
| /gracias | neutral | cta.label | `Volver al programa` | `Volver a Diseño de Carrera` |
| /gracias | neutral | cta.href | `/disena-tu-futuro` | `/diseno-de-carrera` |
| /gracias | confirmacion | signature | `Claudia Sanchez Urencio` | `Claudia Sánchez Urencio` |
| /gracias | seo | title | `Gracias \| Claudia Sanchez Urencio` | `Gracias \| Claudia Sánchez Urencio` |
| /articulos | seo | title | `Artículos \| Claudia Sanchez Urencio` | `Artículos \| Claudia Sánchez Urencio` |
| /articulos/:slug | pie-articulo | signature | `Por Claudia Sanchez Urencio` | `Por Claudia Sánchez Urencio` |
| /articulos/:slug | seo | title | `Artículo \| Claudia Sanchez Urencio` | `Artículo \| Claudia Sánchez Urencio` |
| /404 | seo | title | `Página no encontrada \| Claudia Sanchez Urencio` | `Página no encontrada \| Claudia Sánchez Urencio` |
| GLOBAL | institutional-navbar | brand.label | `Claudia Sanchez Urencio` | `Claudia Sánchez Urencio` |
| GLOBAL | institutional-navbar | people.label | `Para personas` | `Personas` |
| GLOBAL | institutional-navbar | business.label | `Para empresas` | `Empresas` |
| GLOBAL | institutional-footer | brand | `Claudia Sanchez Urencio` | `Claudia Sánchez Urencio` |

(Las filas de `cta`/`linkedin` cuentan como un único campo link cuando difieren `label` y `href`. Por eso hay 45 campos en 47 filas.)

Además, para conectar los hardcodeados con los campos existentes hay que actualizar estos valores: `/articulos › listado.empty` (H22), `/contacto › formulario.pending` (H46) y `/articulos/:slug › contenido.unavailable` (H55).

**Colecciones (8): reemplazar el array completo** por el de React, con sus `_id` y su orden:

| Ruta | Sección | Colección | Orden / `_id` en Supabase | Orden / `_id` en React | Diferencias |
|---|---|---|---|---|---|
| / | servicios | items | `item-1 \| item-2` | `personas \| empresas \| comunidad` | todos los textos (2 antiguos, falta Comunidad) |
| / | testimonios | items | `item-1 \| item-2 \| item-3` | igual | personas, citas, cargos, imágenes y alts distintos. Faltan `sourceLabel` y `linkedinUrl` |
| /personas | situaciones | items | `item-1..4` | igual | las 4 descripciones |
| /personas | servicios | items | `item-1 \| item-2 \| item-3` | `item-3 \| item-2 \| item-1` | título, descripción, subtítulo, label y href en los 3 ítems. El orden está invertido |
| /personas | testimonios | items | `item-1..3` | igual | `item-1` y `item-3` son otras personas. Imágenes y alts vacíos en los 3 |
| /empresas | desafios | items | `item-1..4` | `friccion \| salida` | todo (4 desafíos antiguos frente a 2) |
| /empresas | servicios | items | `item-1..3` | `equipos-culturas \| executive-longevity` | todo (3 servicios antiguos frente a 2) |
| /empresas | testimonios | items | `item-1..3` | `ana-cristina \| pedro-fondevila \| ricardo-schmidt` | ids, orden, cita de Pedro (inglés en React), cargos, mayúsculas, imágenes y alts |

Diferencias campo a campo dentro de las colecciones con los mismos `_id`:

| Ruta | Sección | Elemento.campo | Supabase | React |
|---|---|---|---|---|
| / | testimonios | items[item-1].author | `Lucía López Sarre` | `Aldo Barrios` |
| / | testimonios | items[item-1].role | `Marketing Director.` | `Managing Director` |
| / | testimonios | items[item-1].quote | `Su metodología también marca una diferencia: es clara, profunda y totalmente accionable. No se queda en la teoría; te impulsa, te estructura y te hace avanzar.` | `I had the chance to work with Claudia, and she was a fantastic partner in clarifying my next career steps. Her blend of clarity and constructive challenge helped turn future thinking into action.` |
| / | testimonios | items[item-1].image / alt | `` / `` | `/assets/claudia-sanchez/testimonials/aldo-barrios.jpg` / `Aldo Barrios` |
| / | testimonios | items[item-2].author | `Fabián Fuentes` | `Dulce Cano` |
| / | testimonios | items[item-2].role | `` | `Customer Marketing Director` |
| / | testimonios | items[item-2].quote | `Lo que distingue a Claudia no es solo su experiencia en desarrollo de talento y liderazgo — que es amplia — sino su capacidad de hacer las preguntas correctas en el momento correcto, y de acompañar sin imponer.` | `During my recent career transition she played a key role to improve my empowerment, recognize my unique ser of talents, reconnect with my purpose and set my long term vision.` |
| / | testimonios | items[item-2].image / alt | `` / `` | `/assets/claudia-sanchez/testimonials/dulce-cano.jpg` / `Dulce Cano` |
| / | testimonios | items[item-3].author | `Pedro Fondevila` | `Eduardo Díaz Cortazar` |
| / | testimonios | items[item-3].role | `` | `Exlíder corporativo y emprendedor` |
| / | testimonios | items[item-3].quote | `Claudia me ha ayudado, aprovechando su experiencia profesional, a transformar mi equipo en un equipo de alto rendimiento.` | `Claudia es un gran coach con alta empatía y capacidad de escucha, pero sobre todo con un auténtico interés por ayudar a los demás en el logro de sus metas.` |
| / | testimonios | items[item-3].image / alt | `` / `` | `/assets/claudia-sanchez/testimonials/eduardo-diaz.jpg` / `Eduardo Díaz Cortazar` |
| /personas | situaciones | items[item-1].description | `Quieres explorar nuevas oportunidades, cambiar de dirección o prepararte para una transición después de una trayectoria consolidada.` | `Quieres explorar nuevas oportunidades, cambiar de dirección o prepararte para una transición profesional después de una trayectoria consolidada.` |
| /personas | situaciones | items[item-2].description | `Buscas desarrollar nuevas capacidades, ganar perspectiva y afrontar con mayor seguridad los desafíos de tu rol.` | `Buscas desarrollar nuevas capacidades, ampliar tu perspectiva y afrontar con mayor seguridad los desafíos y responsabilidades de tu rol profesional.` |
| /personas | situaciones | items[item-3].description | `Te encuentras frente a diferentes posibilidades y quieres evaluar tus opciones con una mirada estratégica.` | `Te encuentras frente a diferentes posibilidades profesionales y quieres evaluar tus opciones con mayor claridad, perspectiva y una mirada estratégica.` |
| /personas | situaciones | items[item-4].description | `Has construido una carrera importante y quieres definir cómo seguir creciendo, contribuyendo y disfrutando los próximos años.` | `Has construido una carrera importante y quieres definir cómo seguir creciendo, contribuyendo y disfrutando de los próximos años de tu vida profesional.` |
| /personas | servicios | items[item-3].title | `Diseña tu futuro` | `Diseño de Carrera` |
| /personas | servicios | items[item-3].description | `Un programa orientado a ejecutivos con experiencia que buscan diseñar los próximos años de su vida y carrera, integrando sus prioridades personales, motivaciones, estrategia profesional y posicionamiento.\n\nA través de la metodología L.I.F.E., el proceso propone una mirada integral para construir una nueva etapa con mayor claridad y propósito.` | `Para ejecutivos con experiencia que quieren anticipar su siguiente etapa, explorar nuevas posibilidades y construir una carrera alineada con sus prioridades personales.\n\nIntegra la metodología LIFE, planeación estratégica y un ecosistema de especialistas para evaluar escenarios de futuro y diseñar una hoja de ruta de largo plazo.` |
| /personas | servicios | items[item-3].subtitle | `Tu siguiente etapa profesional merece una estrategia propia.` | `Planeación estratégica de carrera para anticipar tus próximos años.` |
| /personas | servicios | items[item-3].label | `Descubre Diseña tu futuro` | `Conocer Diseño de Carrera` |
| /personas | servicios | items[item-3].href | `/disena-tu-futuro` | `/diseno-de-carrera` |
| /personas | servicios | items[item-2].title | `Transición y estrategia de carrera` | `Transición de Carrera` |
| /personas | servicios | items[item-2].description | `Acompañamiento para profesionales que están evaluando un cambio, explorando nuevas oportunidades o preparándose para una transición laboral.\n\nEl objetivo es reconocer fortalezas, definir una dirección profesional y desarrollar una estrategia que permita avanzar con mayor claridad y confianza.` | `Para ejecutivos con trayectoria que necesitan afrontar una salida laboral, evaluar nuevas oportunidades o reposicionarse en el mercado con claridad y estrategia.\n\nCombina coaching, mentoría, Head Hunter internacional y herramientas de posicionamiento profesional para construir una oferta de valor y una estrategia de búsqueda de 90 días.` |
| /personas | servicios | items[item-2].subtitle | `` | `Tu siguiente movimiento, decidido con estrategia y ejecutado con método.` |
| /personas | servicios | items[item-2].label | `Consultar por este servicio` | `Consultar por Transición de Carrera` |
| /personas | servicios | items[item-2].href | `/contacto?tipo=persona&servicio=transicion-carrera` | `https://api.whatsapp.com/send?phone=16892306889&text=Hola%20Claudia%2C%20estuve%20viendo%20tu%20programa%20de%20Transici%C3%B3n%20de%20Carrera%20y%20me%20gustar%C3%ADa%20conocer%20un%20poco%20m%C3%A1s%20sobre%20c%C3%B3mo%20funciona.` |
| /personas | servicios | items[item-1].title | `Coaching ejecutivo y desarrollo de liderazgo` | `Next Level Leader` |
| /personas | servicios | items[item-1].description | `Un espacio de acompañamiento para líderes que buscan ampliar su perspectiva, fortalecer sus capacidades y afrontar con mayor claridad los desafíos de su posición.\n\nEl proceso puede abordar la toma de decisiones, el desarrollo de habilidades de liderazgo, la comunicación y el crecimiento profesional.` | `Para ejecutivos que buscan avanzar hacia una posición de mayor liderazgo o consolidarse en un nuevo rol, fortaleciendo su posicionamiento y sus capacidades directivas.\n\nCombina mentoría individual, evaluación Leadership Circle Profile 360 y herramientas de integración y liderazgo para desarrollar un plan de acción de 90 días.` |
| /personas | servicios | items[item-1].subtitle | `` | `Eleva tu carrera: posiciónate para el siguiente nivel, o consolídate en él.` |
| /personas | servicios | items[item-1].label | `Consultar por coaching ejecutivo` | `Consultar por Next Level Leader` |
| /personas | servicios | items[item-1].href | `/contacto?tipo=persona&servicio=coaching-ejecutivo` | `https://api.whatsapp.com/send?phone=16892306889&text=Hola%20Claudia%2C%20me%20interes%C3%B3%20tu%20programa%20Next%20Level%20Leader%20y%20quisiera%20saber%20un%20poco%20m%C3%A1s%20sobre%20c%C3%B3mo%20podr%C3%ADa%20ayudarme%20en%20mi%20desarrollo%20profesional.` |
| /personas | testimonios | items[item-1].author | `Santiago Porrero` | `Manuel Mirabent` |
| /personas | testimonios | items[item-1].role | `Independent Consultant & Investor at EAP` | `Head of Marketing \| Marketing Director` |
| /personas | testimonios | items[item-1].quote | `El proceso me ayudó no solo a fortalecer mi CV, sino también a tener mayor claridad sobre lo que estoy buscando, cómo plantearlo y, sobre todo, cómo comunicar de manera efectiva mi experiencia y propuesta de valor.` | `Claudia ha sido mi coach durante los últimos meses, y puedo recomendarla ampliamente en dos aspectos. Primero, si buscas orientación en tu desarrollo profesional dentro de tu empresa actual o en la exploración de nuevos retos y segundo, si deseas clarificar tu visión a futuro y definir lo que realmente necesitas para sentirte realizado.` |
| /personas | testimonios | items[item-1].image / alt | `` / `` | `/assets/claudia-sanchez/testimonials/manuel-mirabent.jpg` / `Retrato de Manuel Mirabent` |
| /personas | testimonios | items[item-2].image / alt | `` / `` | `/assets/claudia-sanchez/testimonials/ovidio-urbe.jpg` / `Retrato de Ovidio Uribe` |
| /personas | testimonios | items[item-3].author | `Alejandra García Ruiz` | `Eduardo Díaz Cortazar` |
| /personas | testimonios | items[item-3].role | `Strategic Revenue Management` | `Exlíder corporativo y emprendedor` |
| /personas | testimonios | items[item-3].quote | `El proceso con Claudia me ayudó a ordenar mis ideas, entender qué quería lograr, tener conversaciones valiosas dentro de la compañía.` | `Claudia es un gran coach con alta empatía y capacidad de escucha, pero sobre todo con un auténtico interés por ayudar a los demás en el logro de sus metas.` |
| /personas | testimonios | items[item-3].image / alt | `` / `` | `/assets/claudia-sanchez/testimonials/eduardo-diaz.jpg` / `Retrato de Eduardo Díaz Cortazar` |

En `/empresas` (desafíos, servicios y testimonios) los `_id` no coinciden, así que se reemplaza el array completo por el de `careerContent.js` y `businessTestimonials.js`.

**Landing:** su tratamiento depende de la decisión D2 (§8). Si se reutiliza la página existente (opción A), hay que ACTUALIZAR estos valores en `/disena-tu-futuro` **antes** de mover la ruta:

| Sección | Campo | Supabase (`/disena-tu-futuro`) | React (definitivo) |
|---|---|---|---|
| hero | eyebrow | `CLAUDIA SÁNCHEZ · EXECUTIVE CAREER COACH & ADVISOR` | `Claudia Sánchez Urencio · EXECUTIVE CAREER COACH & ADVISOR` |
| hero | description | `Acompaño a directores, VPs y ejecutivos C-Level de 40+ a definir su siguiente movimiento profesional con claridad, estrategia y un plan de acción concreto.` | `Anticipa tu siguiente etapa profesional con una estrategia que conecte tu experiencia, tus prioridades y las posibilidades que quieres construir para los próximos años.` |
| hero | complement | `Career Longevity · Estrategia de carrera ejecutiva` | `CAREER LONGEVITY · ESTRATEGIA DE CARRERA EJECUTIVA` |
| hero | portrait | imagen subida a `page-images/…/portrait/d24b05a9-….png` | `/assets/claudia-sanchez/claudia-hero.png` (decisión D3) |
| situations | intro | `Después de años construyendo tu trayectoria, el siguiente movimiento no siempre significa subir otro escalón. Puede significar crecer, cambiar de dirección o abrir nuevas posibilidades con la experiencia que ya tienes.` | `Una carrera exitosa también merece un plan para lo que viene.\nTal vez quieras seguir creciendo, replantear tu camino o abrir nuevas posibilidades antes de necesitar un cambio.` |
| situations | items[] | 3 ítems sin `_id` (SEGUIR CRECIENDO, PREPARAR UNA TRANSICIÓN, AMPLIAR TUS OPCIONES) | `anticipar-futuro`, `repensar-camino`, `ampliar-opciones` ([site.js](../src/data/claudia/site.js)) |
| approach | intro | `Antes del CV, LinkedIn o la búsqueda de oportunidades, trabajamos sobre tu experiencia, tus fortalezas y lo que quieres construir. Con esa dirección, las herramientas dejan de ser el punto de partida y pasan a servir a una estrategia.` | `Diseño de Carrera te ayuda a mirar más allá de tu próximo puesto, explorar escenarios y elegir una dirección alineada con la vida que quieres construir.\n\nA través del coaching y la planificación estratégica, transformarás esa visión en una hoja de ruta concreta para tus próximos años.` |
| approach | steps[] | 3 ítems sin `_id`, textos antiguos | `claridad`, `estrategia`, `movimiento` (textos de `site.js`) |
| life | title | `Una carrera sostenible necesita más que un buen puesto.` | `Una mirada integral a tu carrera.` |
| life | intro | `Tu siguiente etapa no se decide de manera aislada. Las decisiones profesionales conviven con tu identidad, tu bienestar, tus recursos, tus relaciones y aquello que quieres dejar construido.` | `El Modelo L.I.F.E. integra seis dimensiones de tu vida: identidad, salud, finanzas, relaciones, carrera y legado. Porque planificar tu futuro profesional también implica decidir cómo quieres vivirlo.` |
| life | closing | `No se trata solo de llegar al siguiente rol. Se trata de decidir cómo quieres vivir y sostener tu carrera.` | `No se trata solo del próximo puesto.\nSe trata de construir una etapa profesional que tenga sentido para ti.` |
| life | dimensions[] | mismos textos, **sin `_id`** | mismos textos con `_id` (`identidad` … `legado`) |
| about | paragraphs.0 | `Soy Claudia Sánchez. Durante más de 20 años he trabajado con organizaciones y líderes en procesos de cambio y transformación.` | `Soy Claudia Sánchez Urencio. Durante más de 20 años he trabajado con organizaciones y líderes en procesos de cambio y transformación, ocupando posiciones de liderazgo en Recursos Humanos en compañías como Diageo y Kraft Foods.` |
| about | paragraphs.1 | `Mi trayectoria incluye liderazgo en Recursos Humanos en compañías como Diageo y Kraft Foods, responsabilidades regionales en Latinoamérica y experiencias profesionales en distintos países.` | `Mi trayectoria incluye responsabilidades regionales y experiencia acompañando a ejecutivos en México, Latinoamérica, Estados Unidos y España. Conozco de cerca las decisiones, los desafíos y las oportunidades que aparecen en distintas etapas de una carrera ejecutiva.` |
| about | paragraphs.2 | `También he rediseñado mi propia carrera. Hoy acompaño a ejecutivos senior a tomar decisiones sobre lo que sigue, combinando experiencia corporativa, coaching y una mirada práctica y humana.` | `También he rediseñado mi propia carrera. Hoy combino esa experiencia corporativa con el coaching y la planificación estratégica para ayudar a otros ejecutivos a anticipar su futuro y construir su siguiente etapa profesional.` |
| about | facts[] | sin `_id`: `20+` / `años de trayectoria profesional`; `500+` / `ejecutivos acompañados` | `trayectoria`: `20+` / `AÑOS DE TRAYECTORIA PROFESIONAL`; `ejecutivos`: `500+` / `EJECUTIVOS ACOMPAÑADOS` |
| closing | title | `¿Qué quieres construir con los próximos años de tu carrera?` | `Tu siguiente etapa comienza con una conversación.` |
| closing | text | `Si estás evaluando un cambio, explorando nuevas opciones o buscando mayor claridad sobre tu siguiente etapa, podemos comenzar con una conversación.` | `Conversemos sobre el momento profesional que estás viviendo y las posibilidades que quieres explorar para tu futuro.` |
| site-header | brandLink.label | `Claudia Sanchez Urencio` | `Claudia Sánchez Urencio` |
| site-header y site-footer | navLink0 | `Enfoque` → `#enfoque` | `Tu siguiente movimiento` → `#situaciones` |
| site-header y site-footer | navLink1 | `Testimonios` → `#testimonios` | igual |
| site-header y site-footer | navLink2 | `Modelo L.I.F.E.` → `#life` | `Enfoque` → `#enfoque` |
| site-header y site-footer | navLink3 | `Sobre mí` → `#sobre-mi` | igual |
| site-footer | brand | `Claudia Sánchez` | `Claudia Sánchez Urencio` |
| site-footer | description | `Hoy acompaño a ejecutivos senior a tomar decisiones sobre lo que sigue, combinando experiencia corporativa, coaching y una mirada práctica y humana.` | `Acompaño a ejecutivos con experiencia a diseñar su siguiente etapa profesional con claridad y estrategia.` |

`hero.title`, `highlightedTitle`, `ctaLabel`, `ctaLink`, `life.instruction`, `life.hubLabel` y los links de Calendly y LinkedIn ya coinciden en Supabase.

### 6.3 CONSERVAR

- Todo lo que ya coincide: `/personas › hero` y `contacto`; `/empresas › experiencia` y `proceso` (incluida su colección); `/contacto › intro` y `formulario` (17 campos); `/articulos › intro`; `/articulos/:slug › encabezado`; `/404 › intro`; los globales `home`, `about`, `servicesLabel`, `articles`, `contact`, `openLabel`, `closeLabel`, `skipLabel`, `line` y `linkedin`; `/ › articulos` y `/ › sobre-mi` (salvo `paragraph1`).
- `/ › sobre-mi.credentials[]`: oculta a propósito (`visible: 0`, `status: pendiente`).
- `/gracias › confirmacion`, `proximos-pasos[]` y `volver`: preparados y desactivados a propósito.
- **Módulo de artículos (18 publicados)** y `/articulos › listado.items` (vacío): no se tocan.
- Todo lo de otros sitios (Panthera): todas las operaciones quedan acotadas al `site_id` de Claudia.

### 6.4 OBSOLETO (no eliminar sin autorización)

| Ubicación | Campo / sección | Motivo |
|---|---|---|
| `/ › hero` | `eyebrow` | declarado, no se renderiza |
| `/ › hero` | `paragraph2` (solo en Supabase) | heredado; hoy dispara L01 |
| `/ › enfoque` | `paragraph3`, `paragraph4` (solo en Supabase) | heredados. **Se renderizan en producción** porque `Approach` muestra cualquier `paragraph1-4` presente ([HomePage.jsx:154](../src/pages/HomePage/HomePage.jsx#L154)). Ver R7 |
| `/ › navbar`, `/ › footer` | secciones completas | duplican los globales; React no las lee |
| `/empresas › contacto` | `paragraph2` (solo en Supabase) | no se renderiza (`Section` usa las claves locales) |
| `/articulos › listado` | `items[]` | los artículos vienen del módulo de artículos |
| `/disena-tu-futuro` | página completa (si se elige la opción B) | reemplazada por `/diseno-de-carrera` |
| `/disena-tu-futuro › testimonials` | sección completa (6 ficticios + `Jorge / HH / Test`, `stat`, `disclaimer`) | el componente ya no se usa. **Contiene datos de prueba** |
| landing `hero` | `titleLines.0-3`, `accentFrom`, `subtitle` (manifiesto) | esquema anterior |
| landing `life` | `eyebrow`, `support`, `ctaLabel`, `ctaLink` | no se renderizan |
| landing `site-header` | `nav[]`, `ctaLabel`, `brand` | reemplazados por `navLinkN`, `ctaLink` y `brandLink` |
| landing `site-footer` | `nav[]`, `linkedinLabel`, `calendlyLabel` | reemplazados por links |
| landing `hero`, `situations`, `closing` | `ctaLabel` | redundante con `ctaLink` (mantener mientras React lo use como fallback) |
| landing `impact` | sección (solo en el manifiesto) | no se renderiza: **no crearla** |
| página `/newsletter` (si existe) | página | redirige a `/articulos` |
| `CMS_Ezequiel/manifests/claudia-sanchez.json` | archivo | esqueleto antiguo, no usar |

---

## 7. Riesgos de sobrescritura

| ID | Riesgo | Mitigación |
|---|---|---|
| R1 | **Producción y desarrollo muestran contenidos distintos.** Al escribir en Supabase, producción cambia de inmediato: es el objetivo, pero cualquier error se publica sin preview | Hacer el diff antes y después, aplicar en una ventana acordada y verificar con `vite build && vite preview` (que lee el remoto) |
| R2 | `sync_site_manifest` **no actualiza valores existentes ni arrays** (`_eze_jsonb_set_missing`). Sincronizar «creyendo» que corrige deja todo igual | Separar CREAR (sync) de ACTUALIZAR (patch) y verificar con un snapshot posterior |
| R3 | La sync **reemplaza `field_schema` por sección** y, en globales, `_eze.fields`. `get_public_site_global` expone **solo los campos declarados**: si se quita un campo global del manifiesto, desaparece del sitio al instante | No quitar campos de los globales. Revisar el diff de esquema antes de sincronizar |
| R4 | **Landing, clave de página.** Si la `key` no coincide, se crea una página nueva. Con la opción A (mover la ruta), los valores antiguos de `/disena-tu-futuro` (`navLink` con `#life`, testimonios, hero antiguo) **se publican al sincronizar** | Opción A: aplicar el patch **antes** del cambio de ruta. Opción B: página nueva con `initialContent` correcto y `slug` nuevo |
| R5 | `mergeCmsContent` reemplaza los arrays **completos**. Un array remoto incompleto oculta los ítems locales; los itemFields nuevos (`tag`, `initials`, `lang`, `note`) que falten en Supabase no se muestran | Actualizar la colección y el código que lee el campo nuevo en el mismo despliegue, o mantener la lógica por `_id`/autor como fallback |
| R6 | «Asignar identificadores» del CMS genera `_id` nuevos, y el código depende de `_id` concretos (K9) | No usar la asignación automática en la landing. El patch debe escribir los `_id` de React |
| R7 | Campos obsoletos que **siguen renderizándose** (`/ › enfoque.paragraph3/4`) | Sin borrar datos: limitar el render a los párrafos declarados (etapa 2), o vaciarlos con autorización explícita |
| R8 | Campos compartidos: `/ › contacto.image` (3 páginas), `footer.line` (firma de artículos), `hero.portrait` (hero y Sobre mí de la landing) | Documentarlos en el CMS. Probar las tres páginas al cambiarlos |
| R9 | **Imágenes.** El retrato de la landing en Supabase es un archivo subido al bucket; React usa el asset local. El hero de Inicio difiere; las imágenes de testimonios están vacías | D3: comparar visualmente antes de reemplazar. Los archivos del bucket no se borran |
| R10 | Texto: hay que conservar exactamente `\n`, `\n\n`, mayúsculas, `↗`, `«»`, `—` y acentos. El editor contextual del CMS no debe normalizar ni recortar | Generar el patch por código desde los mismos objetos de fallback (sin copiar y pegar) y comparar byte a byte después |
| R11 | Edición concurrente (Claudia editando durante la ventana) | Control optimista por sección (contenido esperado). Abortar si cambió |
| R12 | Alcance: Panthera y los artículos comparten Supabase | El patch acepta solo `site_id = 1875d747-…` y nunca toca `articles` |
| R13 | `get_public_section` no está versionada en el repositorio; se desconoce si filtra por `visible` o `sync_status` | Revisar su definición antes de marcar secciones como retiradas u ocultas |
| R14 | Regenerar el manifiesto con el script actual reintroduce `impact`, el hero antiguo y los hrefs sin WhatsApp, y sobrescribe `docs/CMS-COVERAGE.md` | Corregir el generador primero (etapa 1) |

---

## 8. Plan de implementación por etapas

> Requiere aprobación previa para cada etapa. Ninguna se ejecutó.

### Decisiones previas

- **D1.** Confirmar que la versión aprobada es el **render local** y no la de producción, y el orden de Empresas (Ana, Pedro, Ricardo).
- **D2. Landing.**
  - **Opción B (recomendada):** página nueva `key: diseno-de-carrera`, `slug: diseno-de-carrera`, creada por la sync con `initialContent` ya correcto. Es 100 % aditiva y reversible (basta borrar la página nueva). `/disena-tu-futuro` queda como OBSOLETO.
  - **Opción A:** usar en el manifiesto la `key` existente (se verifica en el panel de sync: si aparece en «routeChanges», coincide), aplicar el patch en la ruta antigua y recién entonces mover la ruta. Conserva una sola página, pero exige actualizar unos 30 valores.
- **D3.** Retrato de la landing: ¿la imagen subida al bucket es la misma que `claudia-hero.png`? Si no lo es, mantener la local (fuente de verdad).
- **D4.** Tratamiento de `/ › enfoque.paragraph3/4`: ajustar el render (recomendado) o vaciar los valores.

### Etapa 0 — Respaldo y línea base (solo lectura)

1. Exportar, como owner, `pages`, `sections` (incluido `field_schema`) y `site_globals` del sitio a un JSON fechado fuera del repositorio. **Esto es el respaldo para revertir.**
2. Volver a tomar el snapshot público (RPC) y el diff de tres vías usado en este informe, para fijar la línea base.
3. Verificar las `pages.key` de `/` y `/disena-tu-futuro`, y la definición de `get_public_section`.

### Etapa 1 — Manifiesto correcto (código; sin tocar Supabase)

1. Crear un módulo único de fallbacks de la landing, importado por los componentes y por el generador.
2. Corregir el generador (§4.3): página `diseno-de-carrera` con slug propio; quitar `impact`; agregar `career-testimonials` y `seo` en la landing; declarar los campos que faltan (§6.1c); aplicar los hrefs de WhatsApp; excluir `/ › navbar` y `/ › footer`; agregar los campos nuevos de §3.2.
3. Agregar una prueba de paridad: `initialContent` igual al fallback efectivo **en cada sección renderizada**.
4. Agregar `scripts/cms-diff.mjs` (solo lectura) para obtener el diff de tres vías en Markdown, como vista previa permanente.

### Etapa 2 — Conectar el contenido hardcodeado (código; mismo render)

1. Reemplazar cada literal H01–H72 por su campo CMS, con un fallback **idéntico** al literal. Como el fallback no cambia, el render tampoco.
2. Conectar `CareerTestimonials` (bloque D) con `useClaudiaCmsSection('career-testimonials', …)` y `validItems`, y envolver las colecciones de la landing con `ClaudiaEditableCollection`.
3. Mantener L01–L09. Ajustar el render de `/ › enfoque` a los párrafos declarados (D4).
4. Verificación: `npm test`, `npm run typecheck`, `npm run build`, y capturas antes y después de cada ruta a 375, 768 y 1440 px. Deben ser idénticas.

### Etapa 3 — Sincronización no destructiva (CREAR)

1. En **Sincronizar manifiesto**, revisar la vista previa (`ManifestSyncPanel`).
   - Esperado: páginas nuevas `Comunidad y Experiencias` y (opción B) `Diseño de Carrera`.
   - Sin `routeChanges` en `/`.
   - Secciones nuevas: las de Comunidad, `career-testimonials` y `seo`.
   - Si aparece algo distinto, **abortar**.
2. Confirmar la sincronización.
3. Volver a tomar el snapshot y el diff. Esperado: §6.1a resuelto, Comunidad y la landing correctas (opción B) y solo quedan las filas de §6.2.

### Etapa 4 — Actualización de valores (ACTUALIZAR) con vista previa y reversión

`sync_site_manifest` no puede hacerlo. Propuesta:

1. **Patch generado por código** (`reconciliation-patch.json`). Por cada sección incluye `site_id`, `route`, `sectionKey`, el **contenido esperado** (copia exacta de Supabase de la etapa 3) y los cambios (rutas → valor de React; colecciones → array completo). Se genera desde los mismos objetos de fallback de la etapa 1.
2. **Vista previa:** el script imprime el diff campo por campo (antes → después) y se revisa antes de aplicar.
3. **Aplicación**, en orden de preferencia:
   - **(a)** RPC nueva `apply_section_content_patch(p_site_id, p_section_id, p_expected_content, p_new_content)` con `SECURITY DEFINER`, exigencia de owner, control optimista (igual que `update_site_global_field`) y registro en una tabla nueva `section_content_revisions` (contenido anterior, nuevo, usuario y fecha). Requiere una migración que hay que aprobar.
   - **(b)** Sin migración: un panel o script autenticado como owner que lee la fila, compara con el contenido esperado, guarda el respaldo local, actualiza `sections.content` y vuelve a leer para verificar. Para los globales usa `update_site_global_field`, que ya tiene control optimista. Es menos atómico que (a).
   - **(c)** Manual desde el editor contextual. No se recomienda: son más de 45 campos y 8 colecciones con textos largos y saltos de línea.
4. **Reversión:** volver a aplicar el respaldo (revisión o JSON de la etapa 0) con el mismo mecanismo, tomando como contenido esperado el contenido parcheado.
5. Con la opción A de la landing, aplicar su bloque de §6.2 **antes** de sincronizar el cambio de ruta.

### Etapa 5 — Verificación y limpieza

1. Diff final: 0 diferencias entre React y Supabase en las secciones renderizadas. Comparar capturas de `vite preview` (que lee el remoto) contra el render de desarrollo.
2. Probar en el iframe del CMS la selección de campos y colecciones, la edición y la actualización en vivo de cada página, incluida la landing con su ruta nueva.
3. En un cambio aparte, retirar L01–L06 y L08–L10, que ya no hacen falta.
4. Revisar la tabla OBSOLETO con Claudia y Ezequiel y decidir explícitamente si se retira algo (la sync no lo hace).

---

## 9. Resumen numérico

| Concepto | Cantidad |
|---|---|
| Campos conectados en código | **220** (152 con datos alcanzables; 68 sin datos: landing 56 y Comunidad 12) |
| Contenido hardcodeado visible | **72** (71 valores + 1 colección de 3 testimonios) · 1 se mantiene en código (H58) |
| Campos nuevos propuestos | **59 campos + 6 tipos de itemField** (`sourceLabel`, `linkedinUrl`, `tag`, `initials`, `note`, `lang`), más **2 secciones nuevas** en la landing (`career-testimonials` y `seo`) y la página Comunidad completa vía sync |
| Campos a ACTUALIZAR (institucional y globales) | **45** de primer nivel + 3 para reconectar los hardcodeados (H22, H46, H55) |
| Campos a ACTUALIZAR en la landing (solo opción A) | **≈30** (en la opción B se crean correctos) |
| Campos que creará la sync en secciones existentes | **10** + 1 colección (`/ › enfoque.steps`) |
| Colecciones visibles | **16** |
| Colecciones que requieren cambios | **15**: 8 ACTUALIZAR (Inicio servicios y testimonios; Personas situaciones, servicios y testimonios; Empresas desafíos, servicios y testimonios), 2 CREAR por sync (`/ › enfoque.steps`, `experiencias.items`) y 5 de la landing (`situations.items`, `approach.steps`, `life.dimensions`, `about.facts` y la nueva `career-testimonials.items`). Solo `/empresas › proceso.items` está correcta |
| Elementos OBSOLETO identificados | **16** (tabla §6.4) |
