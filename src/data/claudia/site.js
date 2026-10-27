// Copy de la landing /diseno-de-carrera (docs: rediseño integral de la landing, cinco secciones).
// Los textos de varios párrafos se guardan en un único string separado por línea en blanco ("\n\n");
// un "\n" simple es un salto de línea dentro del mismo párrafo.
export const site = {
  meta: {
    title: 'Diseño de Carrera | Claudia Sánchez Urencio',
    description:
      'Programa de acompañamiento estratégico para ejecutivos con experiencia que quieren definir su siguiente etapa profesional con claridad, dirección y un plan de acción.',
  },

  brand: 'Claudia Sánchez Urencio',

  // Orden definitivo de la navegación; cada id corresponde a una sección existente.
  nav: [
    { id: 'situaciones', label: 'Tu siguiente movimiento' },
    { id: 'testimonios', label: 'Testimonios' },
    { id: 'enfoque', label: 'Enfoque' },
    { id: 'sobre-mi', label: 'Sobre mí' },
  ],

  hero: {
    eyebrow: 'Claudia Sánchez Urencio · EXECUTIVE CAREER COACH & ADVISOR',
    title: 'No solo diseñes tu carrera.',
    highlightedTitle: 'Diseña lo que sigue.',
    subtitle:
      'Anticipa tu siguiente etapa profesional con una estrategia que conecte tu experiencia, tus prioridades y las posibilidades que quieres construir para los próximos años.',
    complement: 'CAREER LONGEVITY · ESTRATEGIA DE CARRERA EJECUTIVA',
  },

  situations: {
    eyebrow: 'EL SIGUIENTE MOVIMIENTO',
    title: 'Has construido una carrera. ¿Qué quieres construir ahora?',
    intro:
      'Una carrera exitosa también merece un plan para lo que viene.\nTal vez quieras seguir creciendo, replantear tu camino o abrir nuevas posibilidades antes de necesitar un cambio.',
    items: [
      {
        _id: 'anticipar-futuro',
        number: '01',
        label: 'ANTICIPAR TU FUTURO',
        text: 'Tu carrera va bien, pero quieres anticipar tu siguiente etapa y tomar decisiones antes de que las circunstancias lo hagan por ti.',
      },
      {
        _id: 'repensar-camino',
        number: '02',
        label: 'REPENSAR TU CAMINO',
        text: 'Llevas años creciendo en una misma dirección y te preguntas si ese camino es el que quieres seguir durante los próximos años.',
      },
      {
        _id: 'ampliar-opciones',
        number: '03',
        label: 'AMPLIAR TUS OPCIONES',
        text: 'Quieres explorar una ruta paralela en consultoría, consejos, docencia o un proyecto propio, aprovechando la experiencia que ya tienes.',
      },
    ],
    closing: 'No necesitas esperar una transición para empezar a diseñar lo que sigue.',
  },

  approach: {
    eyebrow: 'CÓMO TRABAJO',
    title: 'Primero claridad. Después, una estrategia para avanzar.',
    intro:
      'Diseño de Carrera te ayuda a mirar más allá de tu próximo puesto, explorar escenarios y elegir una dirección alineada con la vida que quieres construir.\n\nA través del coaching y la planificación estratégica, transformarás esa visión en una hoja de ruta concreta para tus próximos años.',
    steps: [
      {
        _id: 'claridad',
        number: '01',
        label: 'CLARIDAD',
        text: 'Reconocer tus prioridades y definir qué quieres construir en tu siguiente etapa profesional.',
      },
      {
        _id: 'estrategia',
        number: '02',
        label: 'ESTRATEGIA',
        text: 'Evaluar escenarios y elegir una dirección que integre tu carrera y tu vida personal.',
      },
      {
        _id: 'movimiento',
        number: '03',
        label: 'MOVIMIENTO',
        text: 'Convertir esa dirección en una hoja de ruta con decisiones y próximos pasos concretos.',
      },
    ],
  },

  // Modelo L.I.F.E. integrado en «Mi enfoque» (bloque claro tras «Cómo trabajo»): `title` es el H3 y `intro` la descripción breve.
  life: {
    title: 'Una mirada integral a tu carrera.',
    intro:
      'El Modelo L.I.F.E. integra seis dimensiones de tu vida: identidad, salud, finanzas, relaciones, carrera y legado. Porque planificar tu futuro profesional también implica decidir cómo quieres vivirlo.',
    // Las dimensiones no son etapas ni una secuencia: sin numeración. El texto breve solo se muestra al seleccionar.
    dimensions: [
      { _id: 'identidad', id: 'identidad', label: 'IDENTIDAD', text: 'Quién eres más allá de un cargo y cómo quieres definir esta etapa.' },
      { _id: 'salud', id: 'salud', label: 'SALUD', text: 'Tu energía y bienestar al pensar decisiones sostenibles.' },
      { _id: 'finanzas', id: 'finanzas', label: 'FINANZAS', text: 'Los recursos y condiciones que influyen en tus opciones.' },
      { _id: 'relaciones', id: 'relaciones', label: 'RELACIONES', text: 'Las personas y conexiones que forman parte de tus próximos movimientos.' },
      { _id: 'carrera', id: 'carrera', label: 'CARRERA', text: 'Tu experiencia, posicionamiento y oportunidades posibles.' },
      { _id: 'legado', id: 'legado', label: 'LEGADO', text: 'Lo que quieres aportar y construir con los años que vienen.' },
    ],
    closing:
      'No se trata solo del próximo puesto.\nSe trata de construir una etapa profesional que tenga sentido para ti.',
  },

  about: {
    eyebrow: 'SOBRE MÍ',
    title: 'Conozco el mundo corporativo. También lo que viene después.',
    paragraphs: [
      'Soy Claudia Sánchez Urencio. Durante más de 20 años he trabajado con organizaciones y líderes en procesos de cambio y transformación, ocupando posiciones de liderazgo en Recursos Humanos en compañías como Diageo y Kraft Foods.',
      'Mi trayectoria incluye responsabilidades regionales y experiencia acompañando a ejecutivos en México, Latinoamérica, Estados Unidos y España. Conozco de cerca las decisiones, los desafíos y las oportunidades que aparecen en distintas etapas de una carrera ejecutiva.',
      'También he rediseñado mi propia carrera. Hoy combino esa experiencia corporativa con el coaching y la planificación estratégica para ayudar a otros ejecutivos a anticipar su futuro y construir su siguiente etapa profesional.',
    ],
    facts: [
      { _id: 'trayectoria', value: '20+', label: 'AÑOS DE TRAYECTORIA PROFESIONAL' },
      // Cifra que Claudia comunica públicamente (ver src/data/claudia/testimonials.js y la demo original).
      { _id: 'ejecutivos', value: '500+', label: 'EJECUTIVOS ACOMPAÑADOS' },
    ],
  },

  // Bloque de reserva integrado al final de «Sobre mí».
  closing: {
    eyebrow: 'TU SIGUIENTE MOVIMIENTO',
    title: 'Tu siguiente etapa comienza con una conversación.',
    text: 'Conversemos sobre el momento profesional que estás viviendo y las posibilidades que quieres explorar para tu futuro.',
  },

  footer: {
    line: 'Executive Career Coach & Advisor',
    description: 'Acompaño a ejecutivos con experiencia a diseñar su siguiente etapa profesional con claridad y estrategia.',
    copyright: '© 2026',
  },

  // Retrato proporcionado para el concepto. Reemplazar solo con un asset autorizado para publicación.
  portrait: {
    src: '/assets/claudia-sanchez/claudia-hero.png',
    alt: 'Retrato de Claudia Sánchez Urencio',
    width: 960,
    height: 1200,
    placeholderLabel: 'FOTOGRAFÍA A INCORPORAR',
  },
};
