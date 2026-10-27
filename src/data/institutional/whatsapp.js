// Número y mensajes de WhatsApp: única fuente para los siete botones.
export const WHATSAPP_PHONE = '16892306889';

export const whatsappUrl = message =>
  `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(message)}`;

export const WHATSAPP_MESSAGES = {
  transicionCarrera: 'Hola Claudia, estuve viendo tu programa de Transición de Carrera y me gustaría conocer un poco más sobre cómo funciona.',
  nextLevelLeader: 'Hola Claudia, me interesó tu programa Next Level Leader y quisiera saber un poco más sobre cómo podría ayudarme en mi desarrollo profesional.',
  equiposCulturas: 'Hola Claudia, estuve viendo tu programa Equipos y Culturas Fascinantes y me gustaría conocer más sobre cómo podríamos trabajarlo en nuestra organización.',
  executiveLongevity: 'Hola Claudia, me interesa conocer más sobre Executive Longevity Program y cómo podría implementarse en nuestra organización.',
  lifePlacement: 'Hola Claudia, estuve viendo LifePlacement y me gustaría conocer más sobre la experiencia y las modalidades de participación.',
  consciousLeadership: 'Hola Claudia, me interesó el Retiro Conscious Leadership y quisiera conocer un poco más sobre cómo funciona y cómo participar.',
  contacto: 'Hola Claudia, estuve recorriendo tu página web y me gustaría conversar con vos para conocer más sobre tus servicios.',
};

export const WHATSAPP_URLS = Object.fromEntries(
  Object.entries(WHATSAPP_MESSAGES).map(([key, message]) => [key, whatsappUrl(message)])
);

export const isWhatsappUrl = href => typeof href === 'string' && href.startsWith('https://api.whatsapp.com/send?');

// Los enlaces de WhatsApp se abren en pestaña nueva; el resto de enlaces no cambia.
export const whatsappLinkProps = href => isWhatsappUrl(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {};

// /personas se lee de content.json (ids del CMS), por eso se asigna por id de ítem.
export const PERSONAS_WHATSAPP_HREFS = {
  'item-2': WHATSAPP_URLS.transicionCarrera,
  'item-1': WHATSAPP_URLS.nextLevelLeader,
};
