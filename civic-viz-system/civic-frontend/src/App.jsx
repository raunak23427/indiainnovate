import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Visualization from './pages/Visualization';
import Department from './pages/Department';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#050507] text-[#F5F5F7] selection:bg-[#0A84FF]/30">
        <Navbar />
        <main className="relative z-10 w-full">
          <Routes>
            <Route path="/" element={<div className="container mx-auto px-6 py-12"><Home /></div>} />
            <Route path="/login" element={<div className="container mx-auto px-6 py-12"><Login /></div>} />
            <Route path="/admin" element={<div className="container mx-auto px-6 py-12"><Admin /></div>} />
            <Route path="/viz" element={<Visualization />} />
            <Route path="/department" element={<div className="container mx-auto px-6 py-12"><Department /></div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
