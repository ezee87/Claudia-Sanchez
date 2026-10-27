import { Navigate, useLocation, useParams } from 'react-router-dom';
import { content } from './content';
import Section from './Section';
import Seo from './Seo';
import { ArticleCards } from './articles';

export function EditorialPage({route}){return <><Seo route={route} missing={route==='/404'}/>{Object.keys(content[route]).filter(key=>!['navbar','footer','seo'].includes(key)).map((key,i)=><Section key={key} route={route} section={key} hero={i===0}/>)}</>;}
export { default as ContactPage } from '../../pages/ContactoPage/ContactoPage';
export function ArticlesPage(){return <><Seo route="/articulos"/><div className="articles-page"><Section route="/articulos" section="intro" hero/><section className="editorial-section articles-listing"><div className="site-container"><ArticleCards paged/></div></section></div></>;}
// No verified booking signal or email-delivery confirmation exists in this repository.
// Do not enable confirmation based on a query param, navigation state, or direct visit.
export function ThanksPage(){return <><Seo route="/gracias"/><Section route="/gracias" section="neutral" hero/></>;}
export function NotFoundPage(){return <EditorialPage route="/404"/>;}
export function LegacyArticleRedirect(){const {slug}=useParams();const {search,hash}=useLocation();return <Navigate replace to={`/articulos${slug?'/'+encodeURIComponent(slug):''}${search}${hash}`}/>;}
