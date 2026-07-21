import React, { useState, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Dashboard from './views/Dashboard';
import Base64Decoder from './views/Base64Decoder';
import TextToSpeech from './views/TextToSpeech';
import CedulaEcuador from './views/CedulaEcuador';
import JwtTool from './views/JwtTool';
import PhotoMetadata from './views/PhotoMetadata';
import BackgroundRemover from './views/BackgroundRemover';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    const isDark = theme === 'dark';
    setIsDarkMode(isDark);
    
    const themeLink = document.getElementById('theme-link');
    if (themeLink) {
      const baseUrl = import.meta.env.BASE_URL;
      themeLink.href = isDark
        ? `${baseUrl}themes/lara-dark-indigo/theme.css`
        : `${baseUrl}themes/lara-light-indigo/theme.css`;
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    
    const themeLink = document.getElementById('theme-link');
    if (themeLink) {
      const baseUrl = import.meta.env.BASE_URL;
      themeLink.href = newTheme
        ? `${baseUrl}themes/lara-dark-indigo/theme.css`
        : `${baseUrl}themes/lara-light-indigo/theme.css`;
    }
  };

  return (
    <HashRouter>
      <div className="flex flex-column min-h-screen">
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        <main className="flex-grow-1 p-3">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/base64-decoder" element={<Base64Decoder />} />
            <Route path="/text-to-speech" element={<TextToSpeech />} />
            <Route path="/cedula-ecuador" element={<CedulaEcuador />} />
            <Route path="/jwt-tool" element={<JwtTool />} />
            <Route path="/photo-metadata" element={<PhotoMetadata />} />
            <Route path="/background-remover" element={<BackgroundRemover />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
}

export default App;
