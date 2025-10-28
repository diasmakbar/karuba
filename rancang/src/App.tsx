import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LangProvider } from './contexts/LangContext';
import Lobby from './pages/Lobby';
import Room from './pages/Room';

export default function App() {
  return (
    <LangProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/room/:id" element={<Room />} />
        </Routes>
      </Router>
    </LangProvider>
  );
}
