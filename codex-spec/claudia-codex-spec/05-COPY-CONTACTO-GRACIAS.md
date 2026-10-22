# Copy exacto — Contacto `/contacto` y Gracias `/gracias`

## Contacto — 01 Presentación (`intro`)

**Título:** Conversemos sobre lo que necesitas.

Cada persona y cada organización enfrenta desafíos diferentes. Me gustaría conocer tu situación y explorar cómo puedo acompañarte.

Completa el formulario y cuéntame brevemente qué estás buscando. Me pondré en contacto contigo para continuar la conversación.

## Contacto — 02 Formulario (`formulario`)

**Campos visibles:**

- `Nombre completo *` — placeholder `Tu nombre` — obligatorio.
- `Correo electrónico *` — placeholder `nombre@correo.com` — obligatorio, validación de email.
- `¿Qué tipo de consulta deseas realizar? *` — radio: `Servicios para personas`, `Servicios para empresas`, `Otra consulta`. Obligatorio. Default `Servicios para personas` si no hay query param.
- `Empresa` — placeholder `Nombre de la organización` — mostrar **solo** si tipo es empresas; opcional.
- `¿En qué puedo ayudarte? *` — placeholder `Cuéntame brevemente qué necesitas...` — obligatorio, textarea.
- **Botón:** `Enviar consulta`.

Preseleccionar el tipo según `?tipo=persona|empresa`; el parámetro opcional `?servicio=...` puede incorporarse al contexto del formulario, sin introducir campos innecesarios. No agregar teléfono obligatorio. Proteger contra envíos repetidos y mostrar estados loading, error y éxito. **No simular envío exitoso.** Si no existe backend de formularios, no conectar a endpoints inventados ni exponer claves; dejar integración pendiente con indicación clara de que todavía no está operativo.

**Mensaje de éxito (solo tras respuesta de envío real):**

**Título:** ¡Gracias por escribirme!

Recibí tu mensaje. Me pondré en contacto contigo lo antes posible.

**Mensaje de error:** No fue posible enviar tu mensaje. Inténtalo nuevamente en unos momentos.

## Contacto — 03 Información alternativa (`contacto-directo`)

**Título:** ¿Prefieres escribir directamente?

También puedes contactarme por correo electrónico.

**Correo:** [PENDIENTE DE CONFIRMAR — no mostrar email falso].

**LinkedIn:** Claudia Sanchez Urencio.

No publicar número de WhatsApp ni dirección sin confirmación. Si falta el correo, ocultar ese dato y mantener enlace real de LinkedIn si ya está disponible en el proyecto.

---

# Gracias `/gracias`

**Contexto:** esta ruta corresponde **exclusivamente** al flujo de reserva de Calendly de la landing `/disena-tu-futuro`. No es la confirmación del formulario de contacto general.

## Gracias — 01 Mensaje (`confirmacion`)

**Título:** ¡Gracias por agendar tu conversación!

Tu reserva se realizó correctamente.

Este es el primer paso para explorar cómo quieres construir tu siguiente etapa profesional y personal.

Durante nuestra conversación podremos conocer tu situación actual, hablar sobre tus objetivos y explorar cómo puedo acompañarte.

**Texto destacado:** Revisa tu correo electrónico: recibirás los detalles de la reunión y el enlace para conectarte.

Nos vemos pronto.

**Firma:** Claudia Sanchez Urencio.

**CONDICIÓN FUNCIONAL OBLIGATORIA:** mostrar las afirmaciones de reserva confirmada únicamente cuando exista señal verificable de confirmación de Calendly en el flujo real. Si alguien abre `/gracias` directamente sin confirmación, mostrar una vista neutral como `Esta página aparece después de completar una reserva. Si todavía no agendaste una conversación, podés regresar al programa.` (adaptar al tú en la UI) y botón a `/disena-tu-futuro`. Si no se puede verificar confirmación, no fingirla; reportar el pendiente técnico.

## Gracias — 02 Próximos pasos (`proximos-pasos`)

**Revisa tu correo**

Encontrarás la confirmación y los detalles de tu reunión.

**Reserva un espacio en tu agenda**

Ten presente el día y la hora seleccionados para la conversación.

**Piensa en lo que te gustaría conversar**

No necesitas preparar nada formal. Puedes llegar con tus preguntas, inquietudes o ideas.

## Gracias — 03 Acción final (`volver`)

**Botón/enlace único:** Volver al inicio → `/`.

No incluir testimonios, servicios ni otra agenda. Verificar antes que Calendly envía emails; si no, adaptar los textos dependientes del correo y avisar.
