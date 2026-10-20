import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage.jsx';
import PersonasPage from './pages/PersonasPage/PersonasPage.jsx';
import EmpresasPage from './pages/EmpresasPage/EmpresasPage.jsx';
import NewsletterPage from './pages/NewsletterPage/NewsletterPage.jsx';
import NewsletterArticlePage from './pages/NewsletterArticlePage/NewsletterArticlePage.jsx';
import ContactoPage from './pages/ContactoPage/ContactoPage.jsx';
import DisenaTuFuturoPage from './pages/DisenaTuFuturoPage/DisenaTuFuturoPage.jsx';
import GraciasPage from './pages/GraciasPage/GraciasPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/personas" element={<PersonasPage />} />
      <Route path="/empresas" element={<EmpresasPage />} />
      <Route path="/newsletter" element={<NewsletterPage />} />
      <Route path="/newsletter/:slug" element={<NewsletterArticlePage />} />
      <Route path="/contacto" element={<ContactoPage />} />
      <Route path="/disena-tu-futuro" element={<DisenaTuFuturoPage />} />
      <Route path="/gracias" element={<GraciasPage />} />
    </Routes>
  );
}
