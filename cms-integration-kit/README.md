# Kit React/Vite para Eze CMS

Este directorio se copia dentro de una web React/Vite. No depende del código interno del administrador Eze CMS y no utiliza credenciales administrativas.

## Contratos verificados

El kit sigue el contrato vigente de `src/lib/siteManifest.ts` y el receptor de preview de `src/App.tsx`:

- Manifiesto `version: 1`.
- `site.key` coincide exactamente con `sites.slug`.
- El mensaje visual usa `type: "EZE_CMS_SELECT_FIELD"` y contiene `site`, `pageRoute`, `sectionKey` y `fieldPath`.
- El CMS compara el origen del mensaje con el origen de la URL de preview, exige sitio y ruta coincidentes, normaliza `sectionKey` a minúsculas y comprueba que `fieldPath` exista.
- La web solo emite mensajes si la URL contiene `cmsPreview=true`, está dentro de un iframe, el referrer pertenece al origen configurado del CMS y existe un `targetOrigin` explícito.

La lectura pública utiliza `get_public_section(site_slug, page_route, section_key)`. La RPC devuelve cero o una fila con `content` y `settings`, y solo expone secciones visibles.

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

Si la RPC no encuentra una sección visible, el reader devuelve `content: null` y `useCmsSection` conserva el fallback local. `settings` forma parte de la respuesta SQL, pero esta primera versión del hook consume exclusivamente `content`.

## Página y sección editables

`examples/HomePage.tsx` muestra Inicio con un Hero, fallback local y campos visualmente seleccionables. La página recibe el reader ya configurado:

```tsx
<HomePage readSection={readSection} />
```

`useCmsSection` comienza con el fallback, consulta Supabase y combina objetos recursivamente: los valores remotos presentes ganan y los campos que falten conservan el valor local. Un error deja visible el contenido local y se devuelve en `error` sin romper la página. El hook cancela actualizaciones de estado después del desmontaje.

`CmsEditable` clona el elemento recibido, por lo que no agrega wrappers ni altera su layout. Fuera del preview devuelve exactamente el elemento original. En preview bloquea la navegación y los handlers originales para evitar efectos secundarios, y permite selección con clic, Enter o Espacio.

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

El ejemplo completo está en `examples/home.manifest.example.json`. Es documentación reutilizable: no modifica el manifiesto real de Claudia.

Reglas verificadas del contrato actual:

- `page.key`, `page.slug`, `section.key`, `section.type` y `field.key` aceptan letras, números, `_` y `-`, comenzando con letra o número.
- `page.route` es una ruta local absoluta sin query ni hash.
- Los `section.key` no se repiten dentro de una página.
- Los `field.key` y `field.path` no se repiten dentro de una sección.
- `field.type` actualmente solo admite `string` o `number`.
- `field.path` usa segmentos separados por puntos y admite índices de arrays.
- `initialContent` aporta valores iniciales; el sincronizador conserva contenido editorial existente y solo completa campos nuevos ausentes.

## Probar el editor visual

1. Crear el cliente y `createPublicSectionReader` con la configuración del sitio.
2. Sincronizar un manifiesto válido desde Eze CMS.
3. Configurar `sites.preview_url` hacia la web.
4. Configurar `VITE_EZE_CMS_ORIGIN` con el origen exacto del administrador.
5. Abrir la página desde el preview del CMS; este agrega `cmsPreview=true`.
6. Seleccionar título, descripción y botón, editar y confirmar que Supabase persista el campo.
7. Abrir la web directamente, sin `cmsPreview=true`, y comprobar que enlaces y eventos se comporten normalmente.

## Limitaciones conocidas

- El kit lee secciones y emite selecciones. Las escrituras continúan siendo responsabilidad del CMS autenticado.
- La combinación profunda trata arrays y valores `null` remotos como valores completos; no mezcla arrays por índice.
- `document.referrer` debe conservarse para autorizar el preview. Una política `Referrer-Policy: no-referrer` desactiva intencionalmente la selección visual.
- No se ha afirmado ni probado funcionamiento end-to-end en Claudia u otro sitio externo.
