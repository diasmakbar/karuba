// src/App.tsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Lobby from './pages/Lobby';
import Room from './pages/Room';
import Demo from './pages/Demo';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/room/:gameId" element={<Room />} />
        <Route path="/demo" element={<Demo />} />
      </Routes>
    </Router>
  );
}
