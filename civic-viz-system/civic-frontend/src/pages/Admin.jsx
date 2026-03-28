import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, Clock, Filter, Layers, Database, Activity, UserCheck, Network } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="glass p-6 rounded-2xl border border-white/5 relative group overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-2xl rounded-full translate-x-16 -translate-y-16" style={{ backgroundColor: color }}></div>
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-xl bg-white/5" style={{ color }}>
        <Icon size={24} />
      </div>
      <Activity size={16} className="text-white/10" />
    </div>
    <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</h3>
    <p className="text-4xl font-black italic tracking-tighter" style={{ color }}>{value}</p>
  </div>
);

function Admin() {
  const [isAdminAuth, setIsAdminAuth] = useState(localStorage.getItem('adminAuth') === 'true');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [file, setFile] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ pending: 0, resolved: 0, voters: 0 });

  useEffect(() => {
    if (isAdminAuth) fetchComplaints();
  }, [isAdminAuth]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'admin2@gmail.com' && password === 'admin') {
      localStorage.setItem('adminAuth', 'true');
      setIsAdminAuth(true);
    } else {
      alert('Invalid Credentials - Access Denied');
    }
  };

  if (!isAdminAuth) {
    return (
      <div className="max-w-md mx-auto pt-20 animate-in fade-in zoom-in duration-500">
        <div className="glass p-10 rounded-[2rem] border border-white/10 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-blue to-cyber-purple"></div>
          <div className="flex justify-center mb-6 text-cyber-blue"><UserCheck size={48} /></div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 text-center text-white">Admin <span className="text-cyber-blue">Portal</span></h2>
          <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8">System Override Authentication</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 block">Admin Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-cyber-blue"
                placeholder="admin2@gmail.com"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 block">Passcode</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-cyber-blue"
                placeholder="••••••"
                required
              />
            </div>
            <button type="submit" className="w-full cyber-button bg-white text-black py-4 font-black uppercase italic tracking-widest text-sm hover:invert transition-all">
              Initialize Access
            </button>
          </form>
        </div>
      </div>
    );
  }

  const fetchComplaints = async () => {
    try {
      const resp = await axios.get('http://localhost:5000/api/admin/complaints');
      setComplaints(resp.data);
      const pending = resp.data.filter(c => c.status !== 'Resolved').length;
      const resolved = resp.data.filter(c => c.status === 'Resolved').length;
      setStats({ pending, resolved, voters: 0 });
    } catch (err) { console.error(err); }
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post('http://localhost:5000/api/admin/upload-excel', formData);
      alert('Rolls Synchronized Successfully');
      fetchComplaints();
    } catch (err) { alert('Sync Failed'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`http://localhost:5000/api/admin/complaints/${id}`, { status });
      fetchComplaints();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Command <span className="text-cyber-blue">Center</span></h1>
          <p className="text-slate-500 text-sm font-mono uppercase tracking-widest mt-1">Operational Oversight & Node Management</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Link to="/viz" className="cyber-button bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30 px-4 py-3 text-xs flex items-center gap-2 hover:bg-cyber-purple hover:text-white transition-all shadow-[0_0_15px_rgba(225,0,255,0.3)]">
            <Network size={14} /> Access Neural Graph
          </Link>
          <div className="glass p-2 rounded-xl border border-white/5 flex items-center gap-4">
            <input 
              type="file" 
              onChange={(e) => setFile(e.target.files[0])} 
              className="text-[10px] text-slate-500 file:bg-white/5 file:border-0 file:text-white file:px-4 file:py-1 file:rounded file:mr-4 file:cursor-pointer" 
            />
            <button onClick={handleUpload} className="cyber-button bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30 text-xs flex items-center gap-2">
              <Database size={14} /> Sync Database
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <StatCard title="Active Grievances" value={stats.pending} icon={Layers} color="#ff003c" />
        <StatCard title="Resolved Protocols" value={stats.resolved} icon={CheckCircle} color="#00f2ff" />
        <StatCard title="Total Voters" value="284K" icon={UserCheck} color="#bc13fe" />
        <StatCard title="System Load" value="12%" icon={Activity} color="#ffffff" />
      </div>

      <div className="glass rounded-2xl border border-white/5 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-blue to-cyber-purple opacity-50"></div>
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
          <h2 className="text-xl font-bold flex items-center gap-3 uppercase tracking-tighter italic">
            <span className="w-2 h-2 rounded-full bg-cyber-blue animate-pulse"></span>
            Real-Time Node Stream
          </h2>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition">
              <Filter size={14} /> Global Filter
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                <th className="p-6">Origin</th>
                <th className="p-6">Category</th>
                <th className="p-6">Objective</th>
                <th className="p-6">Status</th>
                <th className="p-6">Protocols</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {complaints.map(c => (
                <tr key={c._id} className="hover:bg-white/2 transition-colors">
                  <td className="p-6 font-mono text-xs text-slate-400">
                    Booth {c.booth_id}
                  </td>
                  <td className="p-6">
                    <span className="bg-cyber-blue/10 text-cyber-blue px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-tighter italic border border-cyber-blue/20">
                      {c.category}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="max-w-xs truncate text-sm text-slate-200">{c.description}</div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                       <span className={`w-1.5 h-1.5 rounded-full ${
                        c.status === 'Pending' ? 'bg-cyber-red animate-pulse' : 
                        c.status === 'In Progress' ? 'bg-orange-500' : 'bg-cyber-blue'
                      }`}></span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{c.status}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex gap-3">
                      {c.status !== 'Resolved' && (
                        <>
                          <button onClick={() => updateStatus(c._id, 'In Progress')} className="text-white hover:text-cyber-blue transition">
                            <Clock size={18} />
                          </button>
                          <button onClick={() => updateStatus(c._id, 'Resolved')} className="text-white hover:text-green-400 transition">
                            <CheckCircle size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {complaints.length === 0 && <div className="p-20 text-center text-slate-500 uppercase tracking-widest text-xs italic font-black">No Active Nodes Targeted</div>}
        </div>
      </div>
    </div>
  );
}

export default Admin;
