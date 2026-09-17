import { HashRouter } from 'react-router-dom';
import Footer from '@/shared/components/layout/Footer';
import Navbar from '@/shared/components/layout/Navbar';
import { useTheme } from '@/shared/hooks/useTheme';
import AppRoutes from './AppRoutes';

function App() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <HashRouter>
      <div className="flex flex-column min-h-screen">
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        <main className="flex-grow-1 p-3">
          <AppRoutes />
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
}

export default App;
