# Implementación web institucional — Claudia Sanchez Urencio

## Tu tarea

Actuá como desarrollador frontend senior, diseñador web senior y especialista en UX/UI, accesibilidad y SEO técnico. Trabajá **en el proyecto React/Vite autónomo de Claudia que está abierto en este workspace**. Implementá y diseñá todas las páginas institucionales pendientes utilizando los archivos de especificación adjuntos como fuente de verdad. No diseñes una nueva marca desde cero: **extraé y reutilizá el lenguaje visual, las animaciones, tipografías, paleta, patrones responsive, componentes y assets de la landing ya existente** `/disena-tu-futuro`.

**Primero inspeccioná el repositorio**, incluidas las skills disponibles/instaladas y sus instrucciones aplicables, package.json, router, CSS, assets, la landing, manifiesto CMS y la integración existente. Si hay una skill de frontend, diseño, animaciones, React, accesibilidad o testing, utilizala cuando sea pertinente; no supongas nombres ni que están instaladas.

## Archivos de especificación — leer todos antes de modificar

1. `01-ARQUITECTURA-Y-DISENO.md`: rutas, menú, sistema visual, comportamiento y restricciones.
2. `02-COPY-INICIO.md`: contenido exacto de Inicio.
3. `03-COPY-PERSONAS.md`: contenido exacto de Para personas.
4. `04-COPY-EMPRESAS.md`: contenido exacto de Para empresas.
5. `05-COPY-CONTACTO-GRACIAS.md`: contacto, formulario y reserva.
6. `06-COPY-ARTICULOS.md`: listado, artículos individuales e importación.
7. `07-CMS-SEO-Y-VALIDACION.md`: reglas de Eze CMS, SEO, QA y entrega.
8. `08-CMS-EDITABILIDAD-TOTAL.md`: contrato prioritario de edición de imágenes, links y colecciones; leer antes de implementar.

## Reglas de máxima prioridad

- **Nombre público EXACTO:** `Claudia Sanchez Urencio` en toda la web (navegación, hero, biografía, firma, footer, metadatos, ALT, etc.). No usar `Claudia Sánchez` ni `Claudia Sanchez` como marca pública. Mantener sin cambio el slug técnico `claudia-sanchez` del CMS y los nombres internos necesarios para conservar compatibilidad.
- **No modificar el diseño ni el funcionamiento de la landing** `/disena-tu-futuro` salvo el nombre público de Claudia cuando aparezca incompleto, y ajustes estrictamente necesarios para navegación común, enlaces y CMS que no alteren su apariencia o flujo. No alterar la metodología L.I.F.E., Calendly, sus animaciones ni el contenido del programa.
- **Todas las páginas y secciones nuevas deben ser editables desde Eze CMS** y declaradas en el manifiesto. Respetar la integración real existente y su API; no inventar firmas, eventos, hooks ni formatos. Usar fallback local con el copy exacto de estas especificaciones. Mantener el modo de selección del editor en iframe si existe.
- No inventar testimonios, resultados, cargos, fechas, títulos de artículos, imágenes de artículos ni servicios confirmados. Los servicios marcados como provisionales son placeholders editoriales.
- Usar fotos y recursos **ya presentes** en el repositorio, incluidos `claudia-hero` y assets de testimonios si existen. Se pueden reutilizar temporalmente; no buscar ni descargar imágenes, ni generar nuevas, ni reemplazar con fotos de personas desconocidas. Si no existe un recurso, preferir una composición tipográfica/geométrica consistente.
- No agregar una suscripción, envío de emails ni funcionalidad newsletter. La sección se llama **Artículos**.
- Mantener una acción principal por sección; **excepción deliberada**: cada tarjeta de servicio en `/personas` y `/empresas` tiene su propio botón. No introducir botones adicionales para decorar.
- Todo el copy público del sitio está en español neutral con **tú**. Las instrucciones de desarrollo pueden usar voseo.
- No hacer commit, push ni deploy. No tocar otros repositorios ni el proyecto demo original. No modificar backend, SQL, políticas RLS, datos productivos ni configuración remota de Supabase.

## Flujo de trabajo

1. Auditar estructura actual, recursos, dependencias, CMS, rutas y skills. Identificar qué ya está hecho y qué falta.
2. Presentar internamente un plan breve y luego implementar sin bloquearte por preguntas menores; respetar las decisiones y placeholders indicados.
3. Construir componentes compartidos, páginas, responsive, microinteracciones y animaciones coherentes con la landing.
4. Integrar contenido editable + manifiesto de **cada** nueva página/sección/campo.
5. Resolver rutas, navegación, enlaces, formulario con manejo seguro de estados y rutas de artículos.
6. Ejecutar build, lint/tests disponibles y verificar rutas, mobile, accesibilidad básica y fallback sin CMS.
7. Informar: archivos modificados, rutas listas, estado CMS, qué quedó como placeholder, qué falta conectar (contacto/Calendly/WhatsApp/artículos), pruebas ejecutadas y cualquier impedimento real.

**Importante:** la integración existente está en `src/integration/eze-cms/`. Leer sus archivos e instrucciones primero y aplicar el contrato real; no dar por hecho que está operativo. No dejar la web rota por ausencia de variables de entorno: usar fallbacks y avisar.
