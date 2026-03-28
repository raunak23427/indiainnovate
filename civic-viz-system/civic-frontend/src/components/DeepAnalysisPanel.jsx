import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Map, Layout, Server, AlertCircle, ArrowUpRight, Camera, User, BadgeCheck, Clock, FileText, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const DeepAnalysisPanel = ({ level, currentZone, currentCluster, currentBooth, activeCat, onDrillDown, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      if (newStatus === 'Assigned') {
        await axios.put('http://localhost:5000/api/admin/complaints/bulk-assign', {
          complaint_ids: [id],
          assigned_department: activeCat || 'Field Operations'
        });
      } else {
        await axios.patch(`http://localhost:5000/api/admin/complaints/${id}`, {
          status: newStatus,
          adminComments: 'Status updated from Pro Diagnostic Matrix'
        });
      }
      
      setData(prev => {
        if (!prev || !prev.detailed_complaints) return prev;
        return {
          ...prev,
          detailed_complaints: prev.detailed_complaints.map(c => 
            c.id === id ? { ...c, status: newStatus } : c
          )
        };
      });
    } catch (err) {
      console.error("Action error:", err);
    }
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const resp = await axios.get('http://localhost:5000/api/viz/4d/analytics', {
          params: { level, zone: currentZone, cluster: currentCluster, booth: currentBooth, category: activeCat }
        });
        setData(resp.data);
      } catch (err) {
        console.error(err);
        setData({ error: err.response?.data?.error || err.message });
      }
      setLoading(false);
    };
    fetchAnalytics();
  }, [level, currentZone, currentCluster, currentBooth, activeCat]);

  if (loading || !data) {
    return (
      <div className="w-[450px] h-full bg-[#111216]/80 backdrop-blur-[40px] flex flex-col items-center justify-center p-10 border-l border-white/5 shadow-2xl">
         <Activity className="animate-spin text-[#0A84FF] mb-4" size={32} />
         <p className="text-xs font-bold tracking-widest text-[#A1A1AA] uppercase">Synchronizing Neural Stream...</p>
      </div>
    );
  }

  const { 
    summary = { title: "Global Overview", total_booths: 0, total_complaints: 0, severity: "Normal" }, 
    categories = [], 
    sub_regions = [], 
    detailed_complaints = [],
    ai_insight = "Synthesizing regional metrics..." 
  } = data || {};

  const getStatusBadge = (s) => {
    const color = s === 'Pending' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20 shadow-[0_0_10px_rgba(251,191,36,0.2)]' : 
                  s === 'Assigned' ? 'bg-[#0A84FF]/10 text-[#0A84FF] border-[#0A84FF]/20 shadow-[0_0_10px_rgba(10,132,255,0.2)]' : 
                  'bg-emerald-400/10 text-emerald-400 border-emerald-400/20 shadow-[0_0_10px_rgba(52,211,153,0.2)]';
    return (
      <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border ${color}`}>
        {s || 'Pending'}
      </span>
    );
  };

  return (
    <div className="w-[450px] h-full bg-[#050507]/90 backdrop-blur-[60px] flex flex-col p-12 border-l border-white/10 shadow-2xl overflow-y-auto">
      <div className="scan-line !opacity-20"></div>
      
      {/* HUD Header */}
      <div className="flex justify-between items-start mb-12 relative z-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-[#0A84FF] animate-pulse"></div>
             <span className="text-[10px] font-black text-[#0A84FF] uppercase tracking-[0.4em]">Neural Intelligence Feed</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none max-w-[280px]">
            {activeCat || summary.title}
          </h2>
          <div className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 inline-flex items-center gap-2 mt-4 self-start">
             <Layers size={12} className="text-white/40" />
             <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sector Tier {level}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all border border-white/5 group">
          <ChevronRight size={24} className="text-white group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Metric Rings / Stats */}
      <div className="grid grid-cols-2 gap-6 mb-12 relative z-10">
        <div className="glass-premium p-8 rounded-[32px] border border-white/5 flex flex-col gap-4 group">
          <div className="flex items-center gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
            <Activity size={12} className="text-[#0A84FF]" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">Node Intensity</span>
          </div>
          <span className="text-4xl font-black text-white tracking-tighter italic">
            {detailed_complaints.length || categories.reduce((a,b)=>a+b.count,0)}
          </span>
        </div>
        <div className="glass-premium p-8 rounded-[32px] border border-white/5 flex flex-col gap-4 group">
          <div className="flex items-center gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
            <AlertCircle size={12} className="text-[#FF453A]" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">Sector Heat</span>
          </div>
          <span className="text-4xl font-black text-[#FF453A] tracking-tighter italic">
            {summary.severity || 'LOW'}
          </span>
        </div>
      </div>

      {/* AI Log Stream */}
      <div className="glass-premium !bg-[#0A84FF]/5 !border-[#0A84FF]/20 p-6 rounded-[24px] mb-12 relative z-10">
        <div className="flex gap-4 items-start">
          <div className="w-8 h-8 rounded-lg bg-[#0A84FF]/20 flex items-center justify-center shrink-0 border border-[#0A84FF]/30">
             <Activity size={14} className="text-[#0A84FF]" />
          </div>
          <div className="flex flex-col gap-1">
             <span className="text-[9px] font-black text-[#0A84FF] uppercase tracking-widest">Synthesizing Log:</span>
             <p className="text-[13px] font-medium text-white/90 leading-relaxed italic">
                "{ai_insight}"
             </p>
          </div>
        </div>
      </div>

      {/* Logic Stream Content */}
      <div className="relative z-10">
        {((level === 4 || level === 5) && activeCat) ? (
          <div className="flex flex-col gap-8">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-2 flex items-center gap-3">
               <FileText size={14} className="text-[#0A84FF]" /> Neural Evidence Packets
            </h3>
            {detailed_complaints.map((prob, idx) => (
              <motion.div 
                key={prob.id || idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-premium p-6 rounded-[32px] border border-white/5 group hover:border-[#0A84FF]/40 transition-all duration-500"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                      <User size={20} className="text-[#0A84FF]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Subject Vector</span>
                      <span className="text-sm font-black text-white italic tracking-tight uppercase">
                         {prob.citizen_id || `ID-49${idx}`}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(prob.status)}
                </div>

                {prob.proof && (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden mb-6 border border-white/10 shadow-2xl relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <img 
                      src={prob.proof?.startsWith('http') ? prob.proof : `http://localhost:5000${prob.proof}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                      alt="Neural Feed Proof" 
                    />
                    <div className="absolute bottom-4 left-4 flex flex-col">
                       <span className="text-[8px] font-black text-white uppercase tracking-[0.3em] opacity-60">Metadata Lock</span>
                       <span className="text-[10px] font-bold text-white uppercase tracking-widest">GPS SECURE: {prob.latitude ? `${prob.latitude}, ${prob.longitude}` : 'ENCRYPTED'}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                   <p className="text-[14px] font-medium text-white/80 leading-relaxed border-l-2 border-[#0A84FF]/40 pl-5">
                    {prob.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                    <div className="flex flex-col gap-1">
                       <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Spatial Vector</span>
                       <div className="flex items-center gap-2">
                          <Map size={12} className="text-[#0A84FF]" />
                          <span className="text-[11px] font-bold text-white/60 truncate">{prob.address || 'UNKNOWN SECTOR'}</span>
                       </div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Chronos Link</span>
                       <div className="flex items-center gap-2">
                          <Clock size={12} className="text-white/40" />
                          <span className="text-[11px] font-bold text-white/60 uppercase">
                            {new Date(prob.created_at || Date.now()).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                          </span>
                       </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-2">
                    {(!prob.status || prob.status === 'Pending') && (
                      <button 
                        onClick={() => handleStatusUpdate(prob.id, 'Assigned')}
                        className="flex-1 apple-button-primary !py-3 bg-[#0A84FF] hover:bg-[#0A84FF] shadow-[0_0_20px_rgba(10,132,255,0.4)]"
                      >
                        RE-ASSIGN VECTOR
                      </button>
                    )}
                    {prob.status === 'Assigned' && (
                      <button 
                        onClick={() => handleStatusUpdate(prob.id, 'Resolved')}
                        className="flex-1 apple-button-primary !py-3 !bg-[#30D158] shadow-[0_0_20px_rgba(48,209,88,0.4)]"
                      >
                        RESOLVE CORE
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {/* Logic Distribution Charts */}
            <div className="glass-premium p-10 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="scan-line !opacity-10 !animation-duration-[12s]"></div>
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-12 flex items-center gap-3">
                <Layout size={14} className="text-[#0A84FF] group-hover:scale-110 transition-transform" /> Topological Load Distribution
              </h3>
              <div className="space-y-10">
                {categories.map((c, i) => (
                  <div key={i} className="space-y-5">
                    <div className="flex justify-between text-[11px] font-black text-white uppercase tracking-[0.2em] group">
                      <span className="group-hover:text-[#0A84FF] transition-colors">{c.name}</span>
                      <span className="text-[#0A84FF]">{c.count} UNITS</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10 group-hover:border-[#0A84FF]/20 transition-all">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(c.count / (categories[0]?.count || 1)) * 100}%` }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100, delay: i * 0.1 }}
                        className="h-full bg-gradient-to-r from-[#0A84FF] to-[#0A84FF]/20 rounded-full shadow-[0_0_15px_rgba(10,132,255,0.4)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Region Matrix Breakdown */}
            <div className="glass-premium p-10 rounded-[40px] border border-white/5 shadow-2xl group">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                <AlertCircle size={14} className="text-[#FF453A]" /> Neural Sector Heat Analysis
              </h3>
              <div className="grid grid-cols-1 gap-5">
                 {sub_regions.map((r, i) => (
                   <motion.div 
                    key={i} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex justify-between items-center p-6 bg-white/5 hover:bg-[#0A84FF]/10 rounded-[28px] transition-all duration-500 border border-white/5 hover:border-[#0A84FF]/30 group/item cursor-pointer"
                   >
                      <span className="text-[12px] font-black text-white/80 uppercase tracking-widest group-hover/item:text-white transition-colors">{r.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-[#0A84FF] bg-[#0A84FF]/10 px-5 py-2 rounded-full border border-[#0A84FF]/20 shadow-[0_0_20px_rgba(10,132,255,0.2)]">{r.count} MASS</span>
                        <ChevronRight size={16} className="text-white/20 group-hover/item:text-[#0A84FF] group-hover/item:translate-x-1 transition-all" />
                      </div>
                   </motion.div>
                 ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeepAnalysisPanel;
