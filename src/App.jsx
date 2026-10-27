import { Route, Routes } from 'react-router-dom';
import DisenaTuFuturoPage from './pages/DisenaTuFuturoPage/DisenaTuFuturoPage';
import { Navigate } from 'react-router-dom';
import Layout from './components/institutional/Layout';
import { EditorialPage, ContactPage, ArticlesPage, ThanksPage, NotFoundPage, LegacyArticleRedirect } from './components/institutional/Pages';
import { ArticleDetail } from './components/institutional/articles';
import HomePage from './pages/HomePage/HomePage';
import PersonasPage from './pages/PersonasPage/PersonasPage';
import EmpresasPage from './pages/EmpresasPage/EmpresasPage';
import ComunidadPage from './pages/ComunidadPage/ComunidadPage';
export default function App(){return <Routes>
  <Route path="/disena-tu-futuro" element={<Navigate replace to="/diseno-de-carrera"/>}/>
  <Route path="/diseno-de-carrera" element={<DisenaTuFuturoPage/>}/>
  <Route path="/newsletter" element={<LegacyArticleRedirect/>}/>
  <Route path="/newsletter/:slug" element={<LegacyArticleRedirect/>}/>
  <Route path="*" element={<Layout><Routes>
    <Route path="/" element={<HomePage/>}/>
    <Route path="/personas" element={<PersonasPage/>}/>
    <Route path="/empresas" element={<EmpresasPage/>}/>
    <Route path="/comunidad-y-experiencias" element={<ComunidadPage/>}/>
    <Route path="/contacto" element={<ContactPage/>}/>
    <Route path="/articulos" element={<ArticlesPage/>}/>
    <Route path="/articulos/:slug" element={<ArticleDetail/>}/>
    <Route path="/gracias" element={<ThanksPage/>}/>
    <Route path="*" element={<NotFoundPage/>}/>
  </Routes></Layout>}/>
</Routes>;}
