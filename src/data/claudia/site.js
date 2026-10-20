// Copy de la página de Claudia Sánchez (docs/claudia/01-COPY-WEB.md).
// Texto propuesto, aún no aprobado por Claudia. Las definiciones L.I.F.E. y las cifras
// de la sección "Sobre mí" deben validarse antes de una publicación final.
export const site = {
  meta: {
    title: 'Claudia Sánchez · Executive Career Coach & Advisor',
    description:
      'Claudia Sánchez acompaña a directores, VPs y ejecutivos C-Level de 40+ a definir su siguiente movimiento profesional con claridad, estrategia y un plan de acción concreto.',
  },

  brand: 'Claudia Sánchez',

  nav: [
    { id: 'enfoque', label: 'Enfoque' },
    { id: 'testimonios', label: 'Testimonios' },
    { id: 'life', label: 'Modelo L.I.F.E.' },
    { id: 'sobre-mi', label: 'Sobre mí' },
  ],

  hero: {
    eyebrow: 'CLAUDIA SÁNCHEZ · EXECUTIVE CAREER COACH & ADVISOR',
    // El H1 se compone por líneas para el reveal tipográfico; `accentFrom` marca desde qué línea se enfatiza.
    titleLines: ['No solo diseñes', 'tu carrera.', 'Diseña lo', 'que sigue.'],
    accentFrom: 2,
    subtitle:
      'Acompaño a directores, VPs y ejecutivos C-Level de 40+ a definir su siguiente movimiento profesional con claridad, estrategia y un plan de acción concreto.',
    complement: 'Career Longevity · Estrategia de carrera ejecutiva',
  },

  situations: {
    eyebrow: 'EL SIGUIENTE MOVIMIENTO',
    title: 'Has construido una carrera. ¿Qué quieres construir ahora?',
    intro:
      'Después de años construyendo tu trayectoria, el siguiente movimiento no siempre significa subir otro escalón. Puede significar crecer, cambiar de dirección o abrir nuevas posibilidades con la experiencia que ya tienes.',
    items: [
      {
        number: '01',
        label: 'SEGUIR CRECIENDO',
        text: 'Quieres asumir nuevos desafíos dentro del mundo corporativo, con una dirección más clara.',
      },
      {
        number: '02',
        label: 'PREPARAR UNA TRANSICIÓN',
        text: 'Estás considerando un cambio de empresa, rol, industria o país y necesitas ordenar tus opciones.',
      },
      {
        number: '03',
        label: 'AMPLIAR TUS OPCIONES',
        text: 'Quieres explorar consultoría, advisory o nuevas formas de aportar valor desde tu experiencia.',
      },
    ],
    closing: 'No necesitas esperar una transición para empezar a diseñar lo que sigue.',
  },

  approach: {
    eyebrow: 'CÓMO TRABAJO',
    title: 'Primero claridad. Después, una estrategia para avanzar.',
    intro:
      'Antes del CV, LinkedIn o la búsqueda de oportunidades, trabajamos sobre tu experiencia, tus fortalezas y lo que quieres construir. Con esa dirección, las herramientas dejan de ser el punto de partida y pasan a servir a una estrategia.',
    steps: [
      {
        number: '01',
        label: 'CLARIDAD',
        text: 'Reconocer tu trayectoria, tus prioridades y aquello que quieres para los próximos años.',
      },
      {
        number: '02',
        label: 'ESTRATEGIA',
        text: 'Explorar opciones, definir tu posicionamiento y tomar decisiones con criterio.',
      },
      {
        number: '03',
        label: 'MOVIMIENTO',
        text: 'Convertir la dirección elegida en conversaciones, herramientas y próximos pasos concretos.',
      },
    ],
  },

  life: {
    eyebrow: 'MODELO L.I.F.E.',
    title: 'Una carrera sostenible necesita más que un buen puesto.',
    intro:
      'Tu siguiente etapa no se decide de manera aislada. Las decisiones profesionales conviven con tu identidad, tu bienestar, tus recursos, tus relaciones y aquello que quieres dejar construido.',
    support: 'Seis dimensiones para mirar la carrera con mayor perspectiva.',
    // Las dimensiones no son etapas ni una secuencia: sin numeración ni expansión del acrónimo.
    dimensions: [
      { id: 'identidad', label: 'IDENTIDAD', text: 'Quién eres más allá de un cargo y cómo quieres definir esta etapa.' },
      { id: 'salud', label: 'SALUD', text: 'Tu energía y bienestar al pensar decisiones sostenibles.' },
      { id: 'finanzas', label: 'FINANZAS', text: 'Los recursos y condiciones que influyen en tus opciones.' },
      { id: 'relaciones', label: 'RELACIONES', text: 'Las personas y conexiones que forman parte de tus próximos movimientos.' },
      { id: 'carrera', label: 'CARRERA', text: 'Tu experiencia, posicionamiento y oportunidades posibles.' },
      { id: 'legado', label: 'LEGADO', text: 'Lo que quieres aportar y construir con los años que vienen.' },
    ],
    closing:
      'No se trata solo de llegar al siguiente rol. Se trata de decidir cómo quieres vivir y sostener tu carrera.',
  },

  about: {
    eyebrow: 'SOBRE MÍ',
    title: 'Conozco el mundo corporativo. También lo que viene después.',
    paragraphs: [
      'Soy Claudia Sánchez. Durante más de 20 años he trabajado con organizaciones y líderes en procesos de cambio y transformación.',
      'Mi trayectoria incluye liderazgo en Recursos Humanos en compañías como Diageo y Kraft Foods, responsabilidades regionales en Latinoamérica y experiencias profesionales en distintos países.',
      'También he rediseñado mi propia carrera. Hoy acompaño a ejecutivos senior a tomar decisiones sobre lo que sigue, combinando experiencia corporativa, coaching y una mirada práctica y humana.',
    ],
    facts: [
      { value: '20+', label: 'años de trayectoria profesional' },
      { value: '500+', label: 'ejecutivos acompañados' },
    ],
  },

  closing: {
    eyebrow: 'TU SIGUIENTE MOVIMIENTO',
    title: '¿Qué quieres construir con los próximos años de tu carrera?',
    text: 'Si estás evaluando un cambio, explorando nuevas opciones o buscando mayor claridad sobre tu siguiente etapa, podemos comenzar con una conversación.',
  },

  footer: {
    line: 'Claudia Sánchez · Executive Career Coach & Advisor',
    description: 'Hoy acompaño a ejecutivos senior a tomar decisiones sobre lo que sigue, combinando experiencia corporativa, coaching y una mirada práctica y humana.',
    copyright: '© 2026',
  },

  // Retrato proporcionado para el concepto. Reemplazar solo con un asset autorizado para publicación.
  portrait: {
    src: '/assets/claudia-sanchez/claudia-hero.png',
    alt: 'Retrato de Claudia Sánchez',
    width: 960,
    height: 1200,
    placeholderLabel: 'FOTOGRAFÍA A INCORPORAR',
  },
};
