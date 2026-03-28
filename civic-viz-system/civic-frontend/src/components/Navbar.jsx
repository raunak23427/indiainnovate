import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, BarChart3, ShieldCheck, AlertTriangle, ChevronRight, Activity } from 'lucide-react';

function Navbar() {
  const location = useLocation();
  const isViz = location.pathname === '/viz';

  return (
    <header className={`fixed top-0 left-0 w-full h-24 z-[100] flex items-center justify-between px-16 transition-all duration-700 ${isViz ? 'bg-transparent' : 'bg-[#050507]/60 backdrop-blur-[60px] border-b border-white/5'}`}>
      <div className="flex items-center gap-16">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#0A84FF]/20 flex items-center justify-center shadow-[0_0_20px_rgba(10,132,255,0.4)] group-hover:scale-110 transition-all">
            <Layers className="text-white" size={20} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">CivicMatrix</h1>
        </Link>
        
        <nav className="hidden lg:flex items-center gap-12">
          {[
            { to: '/viz', icon: BarChart3, label: 'Neural Stream' },
            { to: '/admin', icon: ShieldCheck, label: 'Matrix Core' },
            { to: '/login', icon: AlertTriangle, label: 'Diagnostics' },
          ].map((link) => (
            <Link 
              key={link.to}
              to={link.to} 
              className={`nav-link flex items-center gap-3 ${location.pathname === link.to ? 'text-[#0A84FF]' : ''}`}
            >
              <link.icon size={14} className={location.pathname === link.to ? 'text-[#0A84FF]' : 'text-white/20'} />
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-8">
         <div className="flex items-center gap-3 px-6 py-2 rounded-full border border-green-500/20 bg-green-500/5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-green-500 tracking-widest uppercase">System Online</span>
         </div>
         <Link to="/login">
           <button className="apple-button-primary group flex items-center gap-3">
             Portal Access <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
           </button>
         </Link>
      </div>
    </header>
  );
}

export default Navbar;
