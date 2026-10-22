# Contrato obligatorio: editabilidad completa con Eze CMS

## Prioridad y fuente de verdad

Esta especificación complementa y, en caso de conflicto, prevalece sobre el archivo 07. La integración **ya está en** `src/integration/eze-cms/` dentro del proyecto de Claudia. No asumir que existe `cms-integration-kit/` ni duplicar la integración. Antes de crear páginas, inspeccionar y leer todos los archivos relevantes del directorio real, su README si existe, tipos, hooks, cliente, manifest y cualquier documentación local. Comprobar las capacidades implementadas, no suponerlas. Si faltan instrucciones necesarias, explicitarlo.

## Definición de terminado

La página no está terminada por verse correcta o por tener `useCmsSection` importado. Cada campo visible de contenido debe poder editarse mediante el flujo documentado del CMS, con declaración correcta en el manifiesto y funcionamiento de preview/selección si el kit lo soporta. Realizar una matriz página > sección > campo > tipo > fuente > estado y verificar cobertura completa. Distinguir: (a) editable desde CMS ya soportado; (b) preparado en frontend/manifiesto pero requiere capacidad adicional del CMS; (c) no implementado. No presentar (b) como (a).

## Campos individuales

Hacer editables: títulos, subtítulos, eyebrow, párrafos, destacados, listas, nombres y cargos, etiquetas, textos de botones, URL/destinos, textos alternativos, pies de imagen, imágenes, portadas, fecha editorial donde corresponda y texto enriquecido de artículos. Las URL deben permitir enlaces internos, externos, WhatsApp y Calendly; validarlas para evitar esquemas peligrosos. El fallback local debe mantener la página funcional si el CMS está vacío.

## Recursos visuales

Reutilizar por ahora archivos locales existentes (`claudia-hero`, testimonios y demás assets). Sin embargo, no fijar imágenes solo en imports: definir para cada imagen un campo CMS con su referencia/URL y `alt` editable. Renderizar con fallback local cuando falte imagen remota. Si el CMS no ofrece upload, distinguir entre editar una URL de imagen y subir/reemplazar un archivo: NO afirmar que existe subida si no existe. No inventar backend ni almacenamiento.

## Colecciones repetibles: requerimiento funcional

Los siguientes conjuntos deben estar modelados como colecciones de elementos, con identidad estable y, cuando el CMS lo permita, alta, baja, edición y orden:
- Servicios de Personas y Empresas: nombre, descripción, contenido, etiqueta, CTA y destino por elemento.
- Testimonios por página: cita, autor, cargo, imagen, ALT, orden, visibilidad, reutilización entre páginas si está soportada.
- Artículos: portada, ALT, título, fecha, slug, cuerpo enriquecido y estado/publicación si existe soporte. Listado y detalle deben leer de una sola fuente; Inicio muestra los tres más recientes por fecha.
- Tarjetas de desafíos, pasos, credenciales y demás bloques repetidos: texto, orden y visibilidad.

**No simular CRUD:** si el contrato actual solo permite campos de secciones y no colecciones dinámicas, no sustituir silenciosamente el requisito por arrays hardcodeados o N campos fijos. Primero determinar si el kit permite arrays/JSON u otra estructura documentada. Si sí, implementarla respetando el contrato. Si no, preparar una capa de presentación desacoplada y manifest compatible hasta donde se pueda, informar el bloqueo concreto y el cambio mínimo que haría falta en el CMS. No modificar Supabase, SQL, RPC, políticas, ni el CMS externo sin autorización.

## Rutas y vínculos

Preservar `siteSlug: cla udia-sanchez` SIN espacio: `claudia-sanchez`. Registrar `/`, `/personas`, `/empresas`, `/contacto`, `/gracias`, `/articulos`, `/articulos/:slug` según la sintaxis real del manifiesto. Mantener `/disena-tu-futuro` y sus claves existentes sin pérdida de contenido. Revisar y corregir rutas antiguas `/newsletter`. Las consultas por servicio deben tener CTA/destino editables y fallback real a `/contacto` con contexto del servicio.

## Pruebas obligatorias

1. Para cada sección nueva, confirmar lectura del CMS, fallback y selección/edición en preview cuando corresponda.
2. Probar cambio de título, párrafo, CTA label, CTA URL, imagen y ALT.
3. Probar servicios y testimonios: alta, baja, reordenamiento, solo si el CMS realmente soporta esas operaciones. De lo contrario, registrar bloqueo explícito.
4. Probar artículos: listado y detalle consistentes, slug único, orden por fecha, portada y cuerpo; no inventar los 18 textos ausentes.
5. Verificar que ninguna imagen importante, link o colección quede solo hardcodeada sin manifest.
6. Ejecutar build/tests y verificar que la landing existente no sufra regresiones.

## Entrega

Incluir matriz de cobertura CMS y reporte de capacidades reales del kit. Separar claramente **implementado y verificado**, **preparado pero no comprobable**, **requiere ampliación del CMS**. No hacer commit, push ni deploy.
