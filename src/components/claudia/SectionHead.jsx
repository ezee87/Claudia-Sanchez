import { RevealText } from '../ui/Reveal.jsx';
import { ClaudiaEditable } from '../../integration/eze-cms/ClaudiaCms.jsx';
import type from './type.module.css';

/** Encabezado editorial compartido: eyebrow + H2 con revelado M01 (Motion, por palabra). */
export default function SectionHead({ eyebrow, title, id, children, className = '', cmsSection }) {
  const eyebrowNode = <p className={type.eyebrow}>{eyebrow}</p>;
  const titleNode = <RevealText as="h2" id={id} className={type.title}>{title}</RevealText>;
  return (
    <header className={className}>
      {cmsSection ? <ClaudiaEditable sectionKey={cmsSection} fieldPath="eyebrow">{eyebrowNode}</ClaudiaEditable> : eyebrowNode}
      {cmsSection ? <ClaudiaEditable sectionKey={cmsSection} fieldPath="title">{titleNode}</ClaudiaEditable> : titleNode}
      {children}
    </header>
  );
}
