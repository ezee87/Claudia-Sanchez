import { RevealText } from '../ui/Reveal.jsx';
import type from './type.module.css';

/** Encabezado editorial compartido: eyebrow + H2 con revelado M01 (Motion, por palabra). */
export default function SectionHead({ eyebrow, title, id, children, className = '' }) {
  return (
    <header className={className}>
      <p className={type.eyebrow}>{eyebrow}</p>
      <RevealText as="h2" id={id} className={type.title}>
        {title}
      </RevealText>
      {children}
    </header>
  );
}
