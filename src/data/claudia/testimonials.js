// Testimonios ilustrativos: personas, imágenes y experiencias ficticias creadas para esta demo.
// No son clientes reales de Claudia. La cifra "500+" es la que Claudia comunica públicamente
// y no equivale a una cantidad de testimonios verificados.
const BASE = '/assets/claudia-sanchez/testimonials';

export const testimonials = {
  eyebrow: 'VOCES DE EXPERIENCIA',
  title: 'Cada carrera tiene su historia. Cada siguiente paso, su propio camino.',
  stat: { value: '500+', label: 'ejecutivos acompañados' },
  disclaimer: 'Testimonios ilustrativos · Personas y experiencias ficticias creadas para esta demo.',
  items: [
    {
      name: 'Alejandro R.',
      role: 'Director Comercial · 52 años',
      image: `${BASE}/Alejandro.png`,
      quote:
        '«Después de 25 años en el mundo corporativo, sabía que quería un cambio, pero no tenía claro hacia dónde. Lo más valioso fue dejar de pensar únicamente en mi próximo puesto y empezar a construir una estrategia para los siguientes años de mi carrera».',
    },
    {
      name: 'Mariana G.',
      role: 'VP de Recursos Humanos · 47 años',
      image: `${BASE}/Mariana.png`,
      quote:
        '«Tenía una trayectoria sólida, pero me costaba identificar qué quería para mi siguiente etapa. El proceso me ayudó a ordenar mis prioridades, reconocer nuevas posibilidades y tomar decisiones con mucha más claridad».',
    },
    {
      name: 'Ricardo M.',
      role: 'Exdirector General · 58 años',
      image: `${BASE}/Ricardo.png`,
      quote:
        '«Salir de una posición ejecutiva después de tantos años cambia mucho más que tu situación laboral. Necesitaba volver a reconocer mi valor profesional fuera de un cargo y encontrar una nueva forma de aprovechar mi experiencia».',
    },
    {
      name: 'Patricia L.',
      role: 'Directora de Finanzas · 49 años',
      image: `${BASE}/Patricia.png`,
      quote:
        '«No estaba buscando cambiar de empleo inmediatamente. Quería prepararme para tener opciones. Hoy tengo una visión mucho más clara de los caminos que puedo explorar y de las decisiones que necesito tomar».',
    },
    {
      name: 'Fernando C.',
      role: 'Ejecutivo de Operaciones · 54 años',
      image: `${BASE}/Fernando.png`,
      quote:
        '«Había pasado meses concentrado en actualizar mi CV y contactar reclutadores. Lo que realmente necesitaba era definir qué buscaba, cómo posicionarme y dónde tenía sentido enfocar mis esfuerzos».',
    },
    {
      name: 'Gabriela T.',
      role: 'Consultora y exdirectiva · 56 años',
      image: `${BASE}/Gabriela.png`,
      quote:
        '«Durante años asocié mi carrera con el crecimiento dentro de una empresa. Descubrir que podía construir una etapa combinando consultoría, proyectos y nuevas formas de aportar valor cambió mi perspectiva».',
    },
  ],
};
