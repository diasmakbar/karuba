import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LangProvider } from './contexts/LangContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Lobby from './pages/Lobby';
import Room from './pages/Room';

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Lobby />} />
            <Route path="/room/:id" element={<Room />} />
          </Routes>
        </Router>
      </LangProvider>
    </ThemeProvider>
  );
}
