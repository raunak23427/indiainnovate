import { motion } from 'framer-motion';
import { Shield, BarChart3, Radio, Database, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const FeatureCard = ({ icon: Icon, title, desc, delay, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    viewport={{ once: true }}
    className="apple-card p-8 flex flex-col h-full"
  >
    <div className="p-3 rounded-xl bg-black/5 w-fit mb-6 text-apple-blue">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold mb-3 tracking-tight">{title}</h3>
    <p className="text-apple-text-secondary text-sm leading-relaxed font-medium">{desc}</p>
  </motion.div>
);

function Home() {
  return (
    <div className="relative pt-32 pb-48">
      {/* HUD Background Element */}
      <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-[#0A84FF]/10 to-transparent opacity-30 pointer-events-none"></div>
      
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-10 mb-40 relative z-10">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-6 py-2 rounded-full border border-[#0A84FF]/30 bg-[#0A84FF]/5 text-[10px] font-black text-[#0A84FF] uppercase tracking-[0.4em] mb-10"
          >
            Neural Protocol v4.0 Enabled
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-7xl md:text-8xl font-black text-white mb-10 leading-[0.9] tracking-tighter uppercase italic"
          >
            THE NEURAL <span className="text-[#0A84FF]">MATRIX.</span><br />
            CIVIC OVERSIGHT.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[17px] text-white/50 max-w-3xl mx-auto mb-16 font-medium leading-relaxed uppercase tracking-widest"
          >
            Decode the city's pulse. Experience a multi-dimensional analytics environment that maps grievances from high-level zones to individual citizen reports.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-8"
          >
            <Link to="/viz" className="apple-button-primary scale-125 !px-16 !py-5">
              Initialize Stream
            </Link>
            <Link to="/login" className="apple-button-secondary scale-125 !px-16 !py-5">
              Portal Access
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Neural Stats HUD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto mb-40 px-10 relative z-10">
        {[
          { label: 'Neural Nodes', val: '2,942', desc: 'Active spatial coordinates' },
          { label: 'Sync Latency', val: '0.04ms', desc: 'Real-time telemetry speed' },
          { label: 'Matrix Health', val: 'ONLINE', desc: 'Secure blockchain logging' },
          { label: 'Data Packets', val: '1.2M', desc: 'Processed citizen reports' }
        ].map((s, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-premium p-10 flex flex-col justify-between border-white/5 hover:border-[#0A84FF]/30 transition-all group overflow-hidden"
          >
            <div className="scan-line !opacity-10 !animation-duration-[5s]"></div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-2 group-hover:text-[#0A84FF] transition-colors">{s.label}</div>
              <div className="text-4xl font-black tracking-tighter text-white italic">{s.val}</div>
            </div>
            <div className="text-[10px] text-white/40 mt-6 font-bold uppercase tracking-widest">{s.desc}</div>
          </motion.div>
        ))}
      </div>

      {/* Logic Vectors */}
      <div className="grid md:grid-cols-2 gap-10 max-w-7xl mx-auto px-10 relative z-10">
        <div className="glass-premium p-12 rounded-[48px] flex flex-col group hover:scale-[1.02] transition-all">
           <div className="w-14 h-14 rounded-2xl bg-[#0A84FF]/10 flex items-center justify-center mb-10 border border-[#0A84FF]/20 group-hover:rotate-12 transition-transform">
              <Globe className="text-[#0A84FF]" size={28} />
           </div>
           <h3 className="text-3xl font-black text-white mb-4 uppercase italic tracking-tighter">Global Oversight</h3>
           <p className="text-white/40 text-[15px] leading-relaxed font-medium uppercase tracking-widest">
             Harness the power of neural topography to visualize city-wide grievances with surgical precision. 
           </p>
        </div>
        <div className="glass-premium p-12 rounded-[48px] flex flex-col group hover:scale-[1.02] transition-all">
           <div className="w-14 h-14 rounded-2xl bg-[#0A84FF]/10 flex items-center justify-center mb-10 border border-[#0A84FF]/20 group-hover:rotate-12 transition-transform">
              <Database className="text-[#0A84FF]" size={28} />
           </div>
           <h3 className="text-3xl font-black text-white mb-4 uppercase italic tracking-tighter">Core Encryption</h3>
           <p className="text-white/40 text-[15px] leading-relaxed font-medium uppercase tracking-widest">
             Advanced biometric verification ensures every citizen report within the matrix is authenticated and immutable.
           </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
