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

Importar esta carpeta como la raíz del proyecto. `vercel.json` incluye el fallback SPA requerido para abrir o recargar cualquier ruta directamente. No se requiere ninguna variable de entorno.

## Portabilidad

La carpeta no utiliza imports, aliases, paquetes enlazados ni configuraciones externas. Puede copiarse a otra ubicación omitiendo `node_modules/` y `dist/`; luego se ejecuta `npm install` y `npm run build` desde la nueva ubicación.

## Eze CMS

Eze CMS todavía no está integrado. La estructura mantiene páginas y rutas independientes para facilitar una integración posterior con `siteSlug: "claudia-sanchez"`.
