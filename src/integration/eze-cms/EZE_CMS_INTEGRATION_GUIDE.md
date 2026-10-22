# Guía oficial de integración React/Vite

Guía principal para desarrollar una página nueva con Eze CMS desde el inicio.
El kit no escribe directamente en Supabase: la web lee contenido, informa qué
campo fue seleccionado y recibe actualizaciones confirmadas del CMS.

Para detalles del protocolo y seguridad, consultar `README.md`. El ejemplo
integrado está en `examples/CompletePage.tsx` y
`examples/complete.manifest.example.json`.

## 1. Flujo recomendado

1. Construir la página con contenido local completo y funcional.
2. Separar contenido editorial de estructura, estilos y comportamiento.
3. Definir tipos TypeScript y fallback local para cada sección.
4. Declarar página, secciones y campos en el manifiesto.
5. Leer cada sección con `useCmsSection`.
6. Envolver cada campo simple o enlace con `CmsEditable`.
7. Renderizar colecciones usando `_id` como identidad.
8. Probar navegación, responsive y accesibilidad sin el CMS.
9. Validar y revisar el manifiesto.
10. Sincronizarlo manualmente y probar el preview.

Eze CMS administra valores editoriales; no sustituye componentes, rutas,
estilos ni lógica de aplicación.

## 2. Configuración

Copiar `integration/react-vite` a `src/integration/eze-cms`. Configurar:

```dotenv
VITE_SUPABASE_URL=https://PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_EZE_CMS_ORIGIN=https://cms.example.com
```

Nunca incluir `service_role`. En `cmsConfig.ts`, reemplazar `siteSlug` por el
slug real. `cmsPreviewOrigin` es el origen del CMS, sin ruta, query ni hash.

Crear el cliente y reader una vez:

```ts
import { createCmsClient, createPublicGlobalReader, createPublicSectionReader } from './integration/eze-cms/cmsClient'
import { cmsConfig } from './integration/eze-cms/cmsConfig'

const cmsClient = createCmsClient(cmsConfig)
export const readSection = createPublicSectionReader(cmsClient)
export const readGlobal = createPublicGlobalReader(cmsClient)
```

## Contenido global compartido

Los grupos globales se declaran en `globals` y no dependen de `pageRoute`:

```json
{
  "key": "navbar",
  "name": "Navegación principal",
  "published": true,
  "initialContent": {
    "brand": "Estudio",
    "booking": { "label": "Reservar", "href": "/reservas" }
  },
  "fields": [
    { "key": "brand", "path": "brand", "label": "Marca", "type": "string" },
    { "key": "booking", "path": "booking", "label": "Reserva", "type": "link" }
  ]
}
```

Leer una vez y reutilizar en todas las páginas:

```tsx
const navbar = useCmsGlobal({
  config: cmsConfig,
  groupKey: 'navbar',
  fallback: navbarFallback,
  readGlobal,
})

<CmsEditableGlobal config={cmsConfig} groupKey="navbar" fieldPath="booking">
  <a href={navbar.content.booking.href}>{navbar.content.booking.label}</a>
</CmsEditableGlobal>
```

`published` debe declararse explícitamente. La lectura pública solo devuelve
grupos sincronizados con `published: true`; los registros legacy permanecen
privados. El guardado emite `EZE_CMS_UPDATE_GLOBAL` y actualiza el grupo sin
recargar el iframe ni tocar una sección local.

La primera versión global admite `string`, `number`, `image` y `link`. No admite
`collection` porque las operaciones atómicas y rutas Storage actuales para
colecciones dependen de páginas y secciones.

## 3. Fallback y useCmsSection

El fallback es contenido real incluido en el bundle. Evita páginas vacías
durante la carga, en desarrollo o ante un error. Debe tener la misma forma que
`initialContent`.

```tsx
type HeroContent = {
  title: string
  image: string
  years: number
  cta: { label: string; href: string }
}

const localHero: HeroContent = {
  title: 'Título local',
  image: '/images/hero-local.webp',
  years: 12,
  cta: { label: 'Ver servicios', href: '/servicios' },
}

const hero = useCmsSection({
  config: cmsConfig,
  pageRoute: '/',
  sectionKey: 'hero',
  fallback: localHero,
  readSection,
})
```

Los valores remotos presentes ganan y las propiedades ausentes conservan el
fallback. Los arrays son valores completos y no se mezclan por índice.
`pageRoute` debe coincidir con `page.route`; con React Router puede derivarse de
`useLocation().pathname`.

## 4. Texto y número

El `fieldPath` debe coincidir exactamente con `fields[].path`.

```tsx
<CmsEditable config={cmsConfig} pageRoute="/" sectionKey="hero" fieldPath="title">
  <h1>{hero.content.title}</h1>
</CmsEditable>

<CmsEditable config={cmsConfig} pageRoute="/" sectionKey="hero" fieldPath="years">
  <strong>{hero.content.years} años de experiencia</strong>
</CmsEditable>
```

El manifiesto usa `type: "string"` o `type: "number"`. El componente decide la
presentación.

## 5. Imágenes

Declarar `type: "image"` y conservar una imagen local en el fallback.

```tsx
<CmsEditable config={cmsConfig} pageRoute="/" sectionKey="hero" fieldPath="image">
  <img src={hero.content.image} alt="" width={1600} height={900} sizes="100vw" />
</CmsEditable>
```

El CMS reemplaza el `src`, no la presentación. Conservar dimensiones, `sizes`,
`srcSet`, recorte CSS, lazy loading, breakpoints y accesibilidad. Reutilizar el
Storage existente; no crear otra lógica de subida.

## 6. Enlaces y botones

Un enlace usa `type: "link"` y se guarda junto:

```json
{ "label": "Ver servicios", "href": "/servicios" }
```

Envolver el enlace completo:

```tsx
<CmsEditable config={cmsConfig} pageRoute="/" sectionKey="hero" fieldPath="cta">
  <a href={hero.content.cta.href} className="primary-button">
    {hero.content.cta.label}
  </a>
</CmsEditable>
```

Fuera del preview conserva navegación, React Router, anclas, `target`, `rel` y
eventos. En preview, clic, Enter y Espacio seleccionan sin navegar.

No convertir acciones técnicas en enlaces editoriales. Cerrar un modal, enviar
un formulario, cerrar sesión o cambiar estado local siguen siendo botones y
lógica de la aplicación.

## 7. Navbar desktop y mobile

Ambas variantes deben consumir los mismos objetos, no duplicar campos:

```tsx
function Navigation({ mobile }: { mobile: boolean }) {
  const links = [
    { path: 'services', value: nav.content.services },
    { path: 'contact', value: nav.content.contact },
  ]
  return <nav className={mobile ? 'mobile' : 'desktop'}>
    {links.map(({ path, value }) =>
      <CmsEditable key={path} config={cmsConfig} pageRoute="/" sectionKey="navbar" fieldPath={path}>
        <a href={value.href}>{value.label}</a>
      </CmsEditable>
    )}
  </nav>
}

return <><Navigation mobile={false} /><Navigation mobile /></>
```

Las dos representaciones seleccionan el mismo `fieldPath` y reciben el mismo
valor. La visibilidad responsive pertenece al sitio.

## 8. Colecciones

Cada elemento tiene un `_id` estable y único. `_id` es la `key` de React; nunca
usar el índice. El orden del array determina el orden visual.

```tsx
{content.testimonials.map((item) =>
  <article key={item._id}>
    <img src={item.photo} alt="" width={160} height={160} loading="lazy" />
    <h3>{item.name}</h3>
    <p>{item.quote}</p>
  </article>
)}
```

Agregar, editar, eliminar y reordenar se administra desde el panel de
colecciones. No declarar ni envolver rutas indexadas como
`testimonials.0.name`: son redundantes y pierden significado al reordenar.

Los `itemFields` admiten `string`, `number` e `image`. Una colección con fotos
declara un `itemField` `image`; la web conserva dimensiones, recorte, responsive
y fallback inicial.

Para abrir la colección desde el preview, envolver el área completa con
`CmsEditableCollection`. Omitir `itemId` abre la lista:

```tsx
<CmsEditableCollection
  config={cmsConfig}
  pageRoute="/"
  sectionKey="social-proof"
  collectionPath="testimonials"
>
  <section>{/* título y elementos */}</section>
</CmsEditableCollection>
```

Cada elemento puede declarar su `_id` para abrir directamente el formulario:

```tsx
{content.testimonials.map((item) =>
  <CmsEditableCollection
    key={item._id}
    config={cmsConfig}
    pageRoute="/"
    sectionKey="social-proof"
    collectionPath="testimonials"
    itemId={item._id}
  >
    <article>{/* fotografía, nombre y texto */}</article>
  </CmsEditableCollection>
)}
```

El `collectionPath` debe coincidir exactamente con una colección declarada en
`field_schema`; no se infiere por la sección. El CMS también comprueba que
`itemId` pertenezca a ese array. En preview, un clic sobre el fondo del área
abre la lista y un clic sobre el elemento abre su formulario. Enlaces, botones y
controles interactivos dentro del área no se interceptan. Fuera del preview,
los elementos originales se devuelven sin cambios.

## 9. Manifiesto e initialContent

- `site.key` coincide con el slug del sitio.
- `page.route` coincide con la ruta real.
- `section.key` coincide con `useCmsSection` y `CmsEditable`.
- `field.path` coincide con la ubicación dentro de `initialContent`.
- Keys y paths son identidades estables.

`initialContent` crea datos ausentes y permite renderizar el fallback. No es un
mecanismo para volver a publicar ni reemplazar contenido editorial existente.

## 10. Sincronización segura

- No sincronizar automáticamente al iniciar, compilar o desplegar.
- Revisar y sincronizar manualmente desde el CMS.
- No esperar que `initialContent` sobrescriba contenido publicado.
- No reemplazar arrays publicados por arrays de ejemplo.
- Preparar una migración explícita si cambia la forma de datos existentes.
- No eliminar campos legacy sin comprobar consumidores y compatibilidad.
- Separar cambios estructurales de cambios editoriales.

## 11. Preview

El CMS abre la ruta con `cmsPreview=true`. `CmsEditable` verifica iframe,
referrer y origen antes de enviar `EZE_CMS_SELECT_FIELD`. Tras persistir y
verificar, el CMS envía `EZE_CMS_UPDATE_SECTION` y `useCmsSection` actualiza la
sección sin recargar el iframe.

Probar dentro del CMS y después abrir la URL directamente sin `cmsPreview=true`
para confirmar que navegación y eventos funcionan normalmente.

## 12. Checklist

- [ ] La página funciona con contenido local sin Supabase.
- [ ] Cada sección tiene tipo TypeScript y fallback completo.
- [ ] `siteSlug` y variables públicas corresponden al sitio.
- [ ] No existen secretos en el frontend.
- [ ] Cliente y `readSection` se crean una sola vez.
- [ ] `pageRoute`, `sectionKey` y `fieldPath` coinciden con el manifiesto.
- [ ] Cada campo usa `string`, `number`, `image` o `link` correctamente.
- [ ] Los enlaces envuelven el elemento completo.
- [ ] Las acciones técnicas permanecen como botones.
- [ ] Las imágenes conservan dimensiones y responsive.
- [ ] Las colecciones usan `_id` y no índices.
- [ ] Las áreas contextuales usan el `collectionPath` declarado.
- [ ] Cada elemento contextual pasa su propio `_id` como `itemId`.
- [ ] No hay campos indexados redundantes.
- [ ] Desktop y mobile comparten campos del navbar.
- [ ] Los valores compartidos usan `useCmsGlobal` y `CmsEditableGlobal`.
- [ ] Cada grupo público declara `published: true` de forma consciente.
- [ ] `initialContent` coincide con el fallback.
- [ ] El manifiesto se validó antes de sincronizar.
- [ ] La sincronización será manual.
- [ ] El preview actualiza sin recargar.
- [ ] La navegación funciona fuera del preview.
- [ ] Se probaron carga, error y contenido remoto.

## 13. Referencias

- `examples/CompletePage.tsx`: integración de todos los tipos.
- `examples/complete.manifest.example.json`: manifiesto correspondiente.
- `examples/HomePage.tsx`: ejemplo mínimo.
- `examples/home.manifest.example.json`: manifiesto mínimo.
- `examples/collection.manifest.example.json`: colección aislada.
- `CmsEditableCollection.tsx`: selección contextual de lista o elemento.
- `examples/GlobalSiteExample.tsx`: navbar, footer, contacto, reserva y hero local.
- `examples/global.manifest.example.json`: contrato de globales del ejemplo.
- `README.md`: instalación, protocolo y límites técnicos.
