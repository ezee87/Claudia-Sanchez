# Claudia Sánchez Web

Proyecto autónomo React/Vite para el sitio institucional de Claudia Sánchez. La landing existente está disponible en `/disena-tu-futuro`; el resto de las rutas contiene páginas provisionales preparadas para desarrollo futuro.

## Requisitos

- Node.js compatible con Vite 8
- npm

## Instalación y desarrollo

```bash
npm install
npm run dev
```

Vite mostrará la URL local en la terminal.

## Build de producción

```bash
npm run build
npm run preview
```

El build se genera en `dist/`.

## Rutas

- `/`
- `/personas`
- `/empresas`
- `/newsletter`
- `/newsletter/:slug`
- `/contacto`
- `/disena-tu-futuro`
- `/gracias`

## Despliegue en Vercel

Importar esta carpeta como la raíz del proyecto. `vercel.json` incluye el fallback SPA requerido para abrir o recargar cualquier ruta directamente.

## Portabilidad

La carpeta no utiliza imports, aliases, paquetes enlazados ni configuraciones externas. Puede copiarse a otra ubicación omitiendo `node_modules/` y `dist/`; luego se ejecuta `npm install` y `npm run build` desde la nueva ubicación.

## Eze CMS

La infraestructura reutilizable se encuentra en `src/integration/eze-cms/` y usa
`siteSlug: "claudia-sanchez"`. Copiar `.env.example` a `.env.local` y completar:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (solo clave pública publishable/anon)
- `VITE_EZE_CMS_ORIGIN` (origen exacto del administrador CMS)

Sin las dos variables de Supabase, la inicialización se omite y el sitio sigue
funcionando con contenido local. El manifiesto inicial de referencia está en
`src/integration/eze-cms/claudia-sanchez.manifest.json`; no debe sincronizarse
hasta que existan secciones reales revisadas.

### Regla para futuras intervenciones

Toda página o sección nueva debe integrar CMS desde el principio: fallback local,
lectura mediante `useCmsSection`, identificadores exactos de página y sección,
campos seleccionables con `CmsEditable` cuando corresponda, declaraciones
coherentes en el manifiesto y valores iniciales iguales al contenido visible. La
página debe seguir funcionando si Supabase no responde. No se debe crear primero
una versión estática para integrar CMS después.

La landing existente `/disena-tu-futuro` queda exceptuada hasta que se solicite
expresamente su adaptación a Eze CMS.
