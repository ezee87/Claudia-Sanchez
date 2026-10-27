# Eze CMS, SEO, accesibilidad y validación

## Integración Eze CMS — contrato obligatorio

1. Revisar primero la integración existente en `src/integration/eze-cms/`. Identificar configuración real, cliente Supabase, `useCmsSection`, `CmsEditable`, manifiesto, ruta de preview y validación de origin.
2. **Toda página y toda sección nueva debe ser editable** y tener declaración en el manifiesto con `siteSlug: "claudia-sanchez"` (o el nombre de clave exacto que ya use el proyecto). No cambiar ese slug técnico.
3. Definir campos individuales para títulos, párrafos, textos destacados, etiquetas, CTAs, URLs, ALT y contenido de tarjetas/testimonios. En colecciones repetidas, permitir edición de los elementos conforme al contrato real del CMS; no declarar campos que el kit no sabe manejar. Si el CMS no soporta colecciones dinámicas, NO considerar resuelto el requisito de alta/baja/reordenamiento: reportar el bloqueo y preparar la arquitectura de presentación sin simular CRUD. Ver `08-CMS-EDITABILIDAD-TOTAL.md`.
4. Usar copy de los documentos como **fallback local**: ante CMS sin configurar, respuesta vacía o fallo de red, la página sigue siendo usable.
5. Respetar prioridad de los contenidos remotos sobre fallback solo cuando el contenido recibido sea válido. Mantener selección visual de campos en preview (si está soportada), con origen seguro.
6. **No** crear tablas, RPC, políticas RLS, SQL, migraciones, datos de Supabase ni cambios en panel CMS remoto. **No** ejecutar sync/import automáticos. Entregar el manifiesto listo para el proceso de registro manual existente.
7. **No** exponer service-role keys ni secretos; solo variables públicas previstas en kit. No asumir que una variable existente contiene una clave válida.
8. Mantener los registros ya existentes de `/disena-tu-futuro`; no sobrescribir su contenido ni su manifiesto. Si el manifiesto actual tiene `version: 1`, respetar el formato y el versionado documentado; no inventar versionado incompatible.
9. **Destinos de consulta editables** para las tarjetas de servicio. En ausencia de URL real, fallback a contacto con parámetros para tipo y servicio. Evitar links vacíos.
10. Las nuevas rutas `/articulos` y `/articulos/:slug` deben quedar reflejadas donde corresponda en CMS, sin duplicar contenido del antiguo `/newsletter`. La fuente de artículos reales debe ser única. No asumir capacidades de CRUD de colecciones si el kit no las documenta.

## SEO y metadatos

- Nombre público en toda metadata: `Claudia Sánchez Urencio`.
- Title/description únicos por página; canonical si hay dominio configurado; OG/Twitter; `lang="es"`.
- Estructura semántica con un H1 por página y encabezados jerárquicos.
- Sitemap/robots si el proyecto ya los tiene o se pueden generar sin inventar dominio.
- Redirigir rutas antiguas de newsletter a Artículos; evitar enlaces internos rotos.
- No inventar estadísticas de Claudia, credenciales vigentes, certificaciones, testimonios, resultados ni artículos.

## Accesibilidad, performance y UX

- Navegación por teclado, foco visible, labels asociados, contraste WCAG AA donde sea viable, alt descriptivos, estados de error y carga.
- `prefers-reduced-motion`; respetar jerarquía y legibilidad en mobile. Animaciones no deben ocultar contenido si JS falla.
- Imágenes locales optimizadas cuando sea viable; lazy loading debajo del primer viewport; no degradar LCP del hero.
- Menú mobile accesible; scroll a anchors con compensación por header fijo; evitar overflow y saltos de layout.
- Sin dependencias innecesarias, sin assets externos improvisados y sin modificar diseño original de la landing.

## Checklist de pruebas

- `npm install` solo si hace falta y con dependencias justificadas; ejecutar script real de build, lint y tests existentes.
- Probar acceso directo y refresh en `/`, `/personas`, `/empresas`, `/contacto`, `/articulos`, `/articulos/<slug-real>`, `/disena-tu-futuro`, `/gracias` y una ruta inexistente.
- Comprobar enlaces del menú, anclas, tarjetas y CTAs. Sin links `#` falsos.
- Probar formulario con tipos persona/empresa/otro, validaciones, preselección por query, error, loading y confirmación solo si el envío es real.
- Verificar que `/gracias` no confirme una reserva por visita directa; confirmar integración Calendly si existe.
- Verificar que Inicio muestra hasta 3 artículos reales y ordenados por fecha; no hay suscripción.
- Verificar que todas las secciones nuevas están en manifiesto y se pueden editar con el flujo existente o indicar claramente qué parte no puede probarse sin backend.
- Comparar visualmente `/disena-tu-futuro` antes y después: sin regresiones ni cambios involuntarios.
- Revisar mobile 375 px, tablet y desktop; verificar `prefers-reduced-motion`.
- Buscar globalmente cadenas `Claudia Sánchez`, `Claudia Sánchez` como nombre truncado, `Newsletter` en navegación y rutas antiguas, sin alterar referencias técnicas o citas históricas.

## Entrega

Al terminar, dar resumen concreto de páginas y componentes creados, integración CMS y manifiesto, assets reutilizados, tests/build ejecutados, diferencias respecto de specs (si las hay), y pendientes reales: servicios y proceso por confirmar, testimonios por autorizar, datos de contacto, destinos WhatsApp/Calendly, 18 artículos completos/portadas y verificación de reserva. No hacer commit, push ni deploy.
