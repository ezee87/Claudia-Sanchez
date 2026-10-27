# Kit React/Vite para Eze CMS

Este directorio se copia dentro de una web React/Vite. No depende del código interno del administrador Eze CMS y no utiliza credenciales administrativas.

La guía de trabajo para páginas nuevas es
[`EZE_CMS_INTEGRATION_GUIDE.md`](./EZE_CMS_INTEGRATION_GUIDE.md). Este README
documenta principalmente instalación, protocolo y límites técnicos.

## Contratos verificados

El kit sigue el contrato vigente de `src/lib/siteManifest.ts` y el receptor de preview de `src/App.tsx`:

- Manifiesto `version: 1`.
- `site.key` coincide exactamente con `sites.slug`.
- El mensaje visual usa `type: "EZE_CMS_SELECT_FIELD"` y contiene `site`, `pageRoute`, `sectionKey` y `fieldPath`.
- Las colecciones usan `EZE_CMS_SELECT_COLLECTION` con `collectionPath` y un
  `itemId` opcional. El CMS valida ambos contra `field_schema` y el contenido.
- Tras verificar un guardado, el CMS envía `EZE_CMS_UPDATE_SECTION` con el contenido confirmado. El hook actualiza solamente la sección coincidente sin recargar el iframe ni perder su scroll.
- El CMS compara el origen del mensaje con el origen de la URL de preview, exige sitio y ruta coincidentes, normaliza `sectionKey` a minúsculas y comprueba que `fieldPath` exista.
- La web solo emite mensajes si la URL contiene `cmsPreview=true`, está dentro de un iframe, el referrer pertenece al origen configurado del CMS y existe un `targetOrigin` explícito.
- La web solo acepta actualizaciones del `window.parent`, desde `cmsPreviewOrigin`, en modo preview y cuando coinciden sitio, ruta y sección.

La lectura pública utiliza `get_public_section(site_slug, page_route, section_key)`. La RPC devuelve cero o una fila con `content` y `settings`, y solo expone secciones visibles.

Los grupos compartidos usan `get_public_site_global(site_slug, global_key)`.
La RPC solo devuelve grupos declarados con `published: true`, omite metadatos
internos y no requiere autenticación.

## Instalación

1. Copiar `integration/react-vite` (excepto este `tsconfig.json` si el proyecto ya tiene uno) dentro de `src/integration/eze-cms` de la web.
2. Instalar las dependencias que la web normalmente ya posee:

   ```bash
   npm install react @supabase/supabase-js
   ```

3. Configurar variables públicas de Vite:

   ```dotenv
   VITE_SUPABASE_URL=https://PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_...
   VITE_EZE_CMS_ORIGIN=https://cms.example.com
   ```

`VITE_SUPABASE_ANON_KEY` debe ser la publishable/anon key. Nunca se debe incluir `service_role` ni otra clave secreta en una web pública.

## Configuración por sitio

Editar `cmsConfig.ts` para el proyecto. Para Claudia ya queda declarado `siteSlug: "claudia-sanchez"`; otros sitios reemplazan ese valor sin modificar los componentes.

`cmsPreviewOrigin` es el origen donde se ejecuta el CMS, no la URL de la web ni una ruta. En desarrollo suele ser algo como `http://localhost:5173`; en producción debe ser el origen HTTPS real.

## Conectar la RPC pública

Crear el cliente y el reader una sola vez, fuera de los componentes React:

```ts
import { createCmsClient, createPublicSectionReader } from './integration/eze-cms/cmsClient'
import { cmsConfig } from './integration/eze-cms/cmsConfig'

const client = createCmsClient(cmsConfig)
export const readSection = createPublicSectionReader(client)
```

Para globales:

```ts
import { createPublicGlobalReader } from './integration/eze-cms/cmsClient'

export const readGlobal = createPublicGlobalReader(client)
```

Si la RPC no encuentra una sección visible, el reader devuelve `content: null` y `useCmsSection` conserva el fallback local. `settings` forma parte de la respuesta SQL, pero esta primera versión del hook consume exclusivamente `content`.

## Página y sección editables

`examples/HomePage.tsx` muestra un Hero mínimo. `examples/CompletePage.tsx`
incluye texto, número, imagen, enlaces, navbar compartido y una colección con
fotografías. Las páginas reciben el reader ya configurado:

```tsx
<HomePage readSection={readSection} />
```

`useCmsSection` comienza con el fallback, consulta Supabase y combina objetos recursivamente: los valores remotos presentes ganan y los campos que falten conservan el valor local. Un error deja visible el contenido local y se devuelve en `error` sin romper la página. El hook cancela actualizaciones de estado después del desmontaje.

`CmsEditable` clona el elemento recibido, por lo que no agrega wrappers ni altera su layout. Fuera del preview devuelve exactamente el elemento original. En preview bloquea la navegación y los handlers originales para evitar efectos secundarios, y permite selección con clic, Enter o Espacio.

`CmsEditableCollection` sigue el mismo modelo sin wrappers. Un área sin
`itemId` abre la lista; un elemento con `itemId` abre directamente su
formulario. Los controles interactivos descendientes mantienen su comportamiento
y los componentes anidados no generan selecciones duplicadas.

## React Router

La ruta enviada debe coincidir con `page.route` del manifiesto, sin query ni hash. Puede ser constante por página o derivarse de React Router:

```tsx
import { useLocation } from 'react-router-dom'

function Page() {
  const { pathname } = useLocation()
  return <CmsEditable config={cmsConfig} pageRoute={pathname} sectionKey="hero" fieldPath="title"><h1>...</h1></CmsEditable>
}
```

React Router no es dependencia del kit.

## Relación con el manifiesto

Cada página del código corresponde a una entrada de `pages`. Cada sección consumida por el hook corresponde a una entrada de `sections` y cada `CmsEditable.fieldPath` debe aparecer exactamente en `fields[].path`.

Los manifiestos están en `examples/home.manifest.example.json` y
`examples/complete.manifest.example.json`. Son documentación reutilizable: no
modifican el manifiesto real de Claudia.

Reglas verificadas del contrato actual:

- `page.key`, `page.slug`, `section.key`, `section.type` y `field.key` aceptan letras, números, `_` y `-`, comenzando con letra o número.
- `page.route` es una ruta local absoluta sin query ni hash.
- Los `section.key` no se repiten dentro de una página.
- Los `field.key` y `field.path` no se repiten dentro de una sección.
- `field.type` admite `string`, `number`, `image` o `link`. Una imagen se almacena en `sections.content` como una URL pública permanente del bucket `page-images`; no es una URL firmada ni temporal.
- Un campo `link` se almacena como `{ "label": string, "href": string }`. El destino admite anclas, rutas internas, HTTP/HTTPS, `mailto:` y `tel:`; no se normaliza y rechaza protocolos peligrosos.
- Los campos `image` requieren un valor string en `initialContent`. `required` es opcional, vale `false` por defecto y, cuando es `true`, exige un valor inicial no vacío e impide eliminar la imagen desde el CMS.
- `field.path` usa segmentos separados por puntos y admite índices de arrays.
- `initialContent` aporta valores iniciales; el sincronizador conserva contenido editorial existente y solo completa campos nuevos ausentes.

Una web no necesita resolver rutas de Storage: consume la URL guardada directamente. Debe envolver el elemento visual con el mismo `fieldPath` declarado:

```tsx
<CmsEditable config={cmsConfig} pageRoute="/" sectionKey="hero" fieldPath="image">
  <img src={hero.content.image} alt="" />
</CmsEditable>
```

Para un enlace se declara y selecciona la ruta del objeto completo. El elemento
conserva sus atributos y navegación fuera del preview; dentro del preview
`CmsEditable` intercepta la interacción para seleccionar el campo:

```tsx
<CmsEditable config={cmsConfig} pageRoute="/" sectionKey="hero" fieldPath="cta">
  <a href={hero.content.cta.href} target="_blank" rel="noreferrer">
    {hero.content.cta.label}
  </a>
</CmsEditable>
```

## Colecciones repetibles

Un campo `type: "collection"` declara `itemFields` de tipo `string`, `number` o
`image`, además de `minItems` y `maxItems` opcionales. Su valor es un array de
objetos dentro de `sections.content`; cada objeto lleva un `_id` estable y único.
El hook ya trata los arrays remotos como valores completos, por lo que no requiere
adaptaciones. Las webs deben renderizar cada elemento usando `_id` como `key` de
React. Las reglas completas están resumidas en la guía del kit y existe un
ejemplo aislado en `examples/collection.manifest.example.json`.

## Probar el editor visual

1. Crear el cliente y `createPublicSectionReader` con la configuración del sitio.
2. Sincronizar un manifiesto válido desde Eze CMS.
3. Configurar `sites.preview_url` hacia la web.
4. Configurar `VITE_EZE_CMS_ORIGIN` con el origen exacto del administrador (o varios, separados por coma).
5. Abrir la página desde el preview del CMS; este agrega `cmsPreview=true`.
6. Seleccionar título, descripción y botón, editar y confirmar que Supabase persista el campo.
7. Abrir la web directamente, sin `cmsPreview=true`, y comprobar que enlaces y eventos se comporten normalmente.

## Limitaciones conocidas

- El kit lee secciones y emite selecciones. Las escrituras continúan siendo responsabilidad del CMS autenticado.
- La combinación profunda trata arrays y valores `null` remotos como valores completos; no mezcla arrays por índice.
- `document.referrer` debe conservarse para autorizar el preview. Una política `Referrer-Policy: no-referrer` desactiva intencionalmente la selección visual.
- No se ha afirmado ni probado funcionamiento end-to-end en Claudia u otro sitio externo.
