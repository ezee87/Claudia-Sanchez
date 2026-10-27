// Recomendaciones reales aprobadas por Claudia para la landing /diseno-de-carrera; las citas son textuales y no se editan.
const BASE = '/assets/claudia-sanchez/testimonials';

// Las tres tarjetas enlazan a la página general de recomendaciones, no a los perfiles de los autores.
export const LINKEDIN_RECOMMENDATIONS_URL = 'https://www.linkedin.com/in/claudiasanchezurencio/details/recommendations/?detailScreenTabIndex=0';
export const LINKEDIN_SOURCE_LABEL = 'RECOMENDACIÓN PÚBLICA EN LINKEDIN';

export const careerTestimonials = {
  eyebrow: 'EXPERIENCIAS REALES',
  title: 'Decisiones importantes. Experiencias que hablan por sí solas.',
  subtitle: 'He acompañado a profesionales con trayectoria a ganar claridad, explorar nuevas posibilidades y avanzar hacia su siguiente etapa.',
  // Cierre bajo las tarjetas, antes del CTA de reserva.
  closing: '¿Y si lo que sigue empieza hoy?',
  items: [
    {
      _id: 'aldo-barrios',
      author: 'Aldo Barrios',
      role: 'Managing Director',
      quote: 'I had the chance to work with Claudia, and she was a fantastic partner in clarifying my next career steps. Her blend of clarity and constructive challenge helped turn future thinking into action.',
      image: `${BASE}/aldo-barrios.jpg`,
      alt: 'Retrato de Aldo Barrios',
      lang: 'en',
    },
    {
      _id: 'jose-herrera',
      author: 'José Herrera',
      role: 'Director General',
      quote: 'La transición profesional en si es un gran desafío, el cual, puede ser abrumador en muchas ocasiones y para ello es necesario ordenar tu pensamiento, así como tener mucha claridad de cuales son tus fortalezas y debilidades. En ese sentido, Claudia es la persona ideal para acompañarte.',
      image: `${BASE}/jose-herrera.jpg`,
      alt: 'Retrato de José Herrera',
      lang: 'es',
    },
    {
      _id: 'manuel-mirabent',
      author: 'Manuel Mirabent',
      role: 'Head of Marketing | Marketing Director',
      quote: 'Claudia ha sido mi coach durante los últimos meses, y puedo recomendarla ampliamente en dos aspectos. Primero, si buscas orientación en tu desarrollo profesional dentro de tu empresa actual o en la exploración de nuevos retos y segundo, si deseas clarificar tu visión a futuro y definir lo que realmente necesitas para sentirte realizado.',
      image: `${BASE}/manuel-mirabent.jpg`,
      alt: 'Retrato de Manuel Mirabent',
      lang: 'es',
    },
  ],
};
