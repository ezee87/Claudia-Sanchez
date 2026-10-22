import { ClaudiaEditable, ClaudiaEditableCollection, useClaudiaCmsSection } from '../../integration/eze-cms/ClaudiaCms.jsx';
import type from './type.module.css';
import styles from './Impact.module.css';

export default function Impact({ content: fallback }) {
  const { content } = useClaudiaCmsSection('impact', fallback);
  return <section id="impacto" className={`${type.section} ${styles.section}`} aria-labelledby="impact-title">
    <div className={type.container}>
      <ClaudiaEditable sectionKey="impact" fieldPath="eyebrow"><p className={styles.eyebrow}>{content.eyebrow}</p></ClaudiaEditable>
      <ClaudiaEditable sectionKey="impact" fieldPath="title"><h2 id="impact-title" className={styles.title}>{content.title}</h2></ClaudiaEditable>
      <ClaudiaEditableCollection sectionKey="impact" collectionPath="items"><div className={styles.grid}>
        {content.items.map(item => <ClaudiaEditableCollection key={item._id} sectionKey="impact" collectionPath="items" itemId={item._id}><article className={styles.card}><strong>{item.value}</strong><p>{item.label}</p></article></ClaudiaEditableCollection>)}
      </div></ClaudiaEditableCollection>
      <ClaudiaEditable sectionKey="impact" fieldPath="note"><p className={styles.note}>{content.note}</p></ClaudiaEditable>
    </div>
  </section>;
}
