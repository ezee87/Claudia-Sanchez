import { useParams } from 'react-router-dom';
import styles from '../PlaceholderPage.module.css';

export default function NewsletterArticlePage() {
  const { slug } = useParams();

  return <main className={styles.page}><h1>Artículo</h1><p>Página pendiente de desarrollo: {slug}</p></main>;
}
