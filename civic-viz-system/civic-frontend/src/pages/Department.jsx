import { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, LogOut, Send, CheckCircle, Clock, AlertCircle, RefreshCw, Upload, ChevronDown } from 'lucide-react';

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_STYLES = {
  Assigned:      { color: 'text-blue-400',   border: 'border-blue-400/30',   bg: 'bg-blue-400/10',   dot: 'bg-blue-400' },
  'In Progress': { color: 'text-purple-400', border: 'border-purple-400/30', bg: 'bg-purple-400/10', dot: 'bg-purple-400' },
  Completed:     { color: 'text-amber-400',  border: 'border-amber-400/30',  bg: 'bg-amber-400/10',  dot: 'bg-amber-400' },
  AwaitingReview:{ color: 'text-amber-400',  border: 'border-amber-400/30',  bg: 'bg-amber-400/10',  dot: 'bg-amber-400' },
  Resolved:      { color: 'text-green-400',  border: 'border-green-400/30',  bg: 'bg-green-400/10',  dot: 'bg-green-400' },
  Reopened:      { color: 'text-red-400',    border: 'border-red-400/30',    bg: 'bg-red-400/10',    dot: 'bg-red-400' },
  Pending:       { color: 'text-slate-400',  border: 'border-slate-400/30',  bg: 'bg-slate-400/10',  dot: 'bg-slate-400' },
};

function StatusBadge({ status, finalStatus }) {
  const display = finalStatus === 'AwaitingReview' ? 'Awaiting Review' : (finalStatus || status);
  const key = finalStatus === 'AwaitingReview' ? 'AwaitingReview' : (finalStatus || status);
  const s = STATUS_STYLES[key] || STATUS_STYLES.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm border ${s.color} ${s.border} ${s.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${key === 'AwaitingReview' || key === 'Completed' ? 'animate-pulse' : ''}`}/>
      {display}
    </span>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
const TaskCard = ({ c, onUpdate }) => {
  const [status, setStatus] = useState(c.status);
  const [response, setResponse] = useState(c.department_response || '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // If admin fully resolved OR awaiting admin review — dept can't edit further
  const locked = c.final_status === 'Resolved';
  // If awaiting admin review show a notice but don't allow changes
  const awaitingReview = c.final_status === 'AwaitingReview' || c.status === 'Completed';
  // Reopened means dept can re-work it
  const reopened = c.status === 'Reopened';

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!response.trim() && status === 'Completed') {
      alert('Please add field notes before marking as Completed');
      return;
    }
    setLoading(true);
    const fd = new FormData();
    fd.append('status', status);
    fd.append('department_response', response);
    if (file) fd.append('resolution_image', file);

    try {
      await axios.patch(`http://localhost:5000/api/department/complaints/${c.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update task');
    }
    setLoading(false);
  };

  const allowedNextStatuses = () => {
    if (c.status === 'Assigned') return ['In Progress'];
    if (c.status === 'In Progress') return ['In Progress', 'Completed'];
    if (c.status === 'Reopened') return ['In Progress', 'Completed'];
    return [c.status];
  };

  return (
    <div className={`glass rounded-2xl border flex flex-col relative overflow-hidden transition-all duration-300 ${
      reopened ? 'border-red-500/30 shadow-[0_0_20px_rgba(255,0,60,0.1)]' :
      awaitingReview ? 'border-amber-400/30 shadow-[0_0_20px_rgba(255,179,0,0.1)]' :
      locked ? 'border-green-400/20' : 'border-white/5 hover:border-white/10'
    }`}>
      {/* Status accent top bar */}
      <div className={`h-0.5 w-full ${
        reopened ? 'bg-red-500' :
        awaitingReview && !locked ? 'bg-amber-400 animate-pulse' :
        locked ? 'bg-green-400' : 'bg-cyber-blue/40'
      }`} />

      <div className="p-6 flex flex-col gap-4 flex-1">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-slate-500 font-mono">#{c.id}</span>
              <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-slate-500 font-mono uppercase">{c.category}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Booth {c.booth_id} · {c.voter_id}</div>
          </div>
          <StatusBadge status={c.status} finalStatus={c.final_status} />
        </div>

        {/* Evidence image */}
        {c.imageUrl && (
          <img
            src={c.imageUrl.startsWith('http') ? c.imageUrl : `http://localhost:5000${c.imageUrl}`}
            alt="Problem Evidence"
            className="w-full h-36 object-cover rounded-xl border border-white/10"
          />
        )}

        {/* Description */}
        <p className="text-sm text-white font-medium leading-relaxed">"{c.description}"</p>

        {/* Admin directive */}
        {c.adminComments && (
          <div className="text-[10px] text-cyber-blue bg-cyber-blue/5 border border-cyber-blue/10 p-3 rounded-lg italic leading-relaxed">
            <span className="font-black uppercase not-italic">📋 Admin Directive: </span>{c.adminComments}
          </div>
        )}

        {/* Reopened notice */}
        {reopened && (
          <div className="flex items-center gap-2 text-[10px] text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-lg">
            <RefreshCw size={12} className="shrink-0" />
            <span><strong>REOPENED</strong> — Admin rejected the previous submission. Please rework and resubmit.</span>
          </div>
        )}

        {/* Awaiting review notice */}
        {awaitingReview && !locked && (
          <div className="flex items-center gap-2 text-[10px] text-amber-400 bg-amber-400/5 border border-amber-400/20 p-3 rounded-lg">
            <Clock size={12} className="shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
            <span>Submitted for admin review. Awaiting approval.</span>
          </div>
        )}

        {/* Admin review note (if reviewed) */}
        {c.admin_review_note && (
          <div className="text-[10px] text-purple-400 bg-purple-400/5 border border-purple-400/20 p-3 rounded-lg">
            <span className="font-black uppercase">Admin Note: </span>{c.admin_review_note}
          </div>
        )}

        {/* Resolution image (submitted) */}
        {c.resolution_image && (
          <div className="space-y-1">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Resolution Proof</div>
            <img
              src={`http://localhost:5000${c.resolution_image}`}
              alt="Resolution"
              className="w-full h-32 object-cover rounded-xl border border-white/10"
            />
          </div>
        )}

        {/* LOCKED STATE — resolved by admin */}
        {locked && (
          <div className="mt-auto flex items-center gap-2 text-[10px] text-green-400 bg-green-400/5 border border-green-400/20 p-3 rounded-lg">
            <CheckCircle size={12} className="shrink-0" />
            <span>Resolved by admin. No further action required.</span>
          </div>
        )}

        {/* EDITABLE STATE */}
        {!locked && !awaitingReview && (
          <div className="mt-auto space-y-3 pt-4 border-t border-white/5">
            {/* Status selector */}
            <div className="relative">
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg text-xs p-2.5 text-white outline-none appearance-none cursor-pointer focus:border-orange-400 transition"
              >
                {allowedNextStatuses().map(s => (
                  <option key={s} value={s}>{s === 'Completed' ? 'Completed (Pending Review)' : s}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            {/* Field notes */}
            <textarea
              value={response}
              onChange={e => setResponse(e.target.value)}
              placeholder="Field notes / work report..."
              className="w-full bg-black/50 border border-white/10 rounded-lg text-xs p-2.5 text-white h-20 resize-none outline-none focus:border-orange-400 transition"
            />

            {/* Resolution image upload — only when marking Completed */}
            {status === 'Completed' && (
              <div className="space-y-2">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Proof of Completion</div>
                <label className="flex items-center gap-3 cursor-pointer bg-white/5 border border-dashed border-white/10 hover:border-orange-400/50 rounded-lg p-3 transition">
                  <Upload size={14} className="text-orange-400 shrink-0" />
                  <span className="text-[10px] text-slate-400">{file ? file.name : 'Click to upload image'}</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
                {preview && (
                  <img src={preview} alt="Preview" className="w-full h-28 object-cover rounded-lg border border-white/10" />
                )}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 font-black uppercase tracking-widest text-[10px] rounded-lg border transition flex items-center justify-center gap-2
                bg-orange-400/10 text-orange-400 border-orange-400/30 hover:bg-orange-400 hover:text-black disabled:opacity-50"
            >
              {loading ? (
                <><span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" /> Uploading...</>
              ) : (
                <><Send size={12} /> Transmit Update</>
              )}
            </button>
          </div>
        )}

        {/* Read-only dept response after submit */}
        {(awaitingReview || locked) && c.department_response && (
          <div className="pt-3 border-t border-white/5 space-y-1">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Your Field Notes</div>
            <p className="text-xs text-white/70 italic">"{c.department_response}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Stats Bar ────────────────────────────────────────────────────────────────
const StatsBar = ({ complaints }) => {
  const counts = {
    total: complaints.length,
    assigned: complaints.filter(c => c.status === 'Assigned').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    completed: complaints.filter(c => c.status === 'Completed' || c.final_status === 'AwaitingReview').length,
    resolved: complaints.filter(c => c.final_status === 'Resolved').length,
    reopened: complaints.filter(c => c.status === 'Reopened').length,
  };

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {[
        { label: 'Total', value: counts.total, color: 'text-white' },
        { label: 'Assigned', value: counts.assigned, color: 'text-blue-400' },
        { label: 'In Progress', value: counts.inProgress, color: 'text-purple-400' },
        { label: 'Awaiting Review', value: counts.completed, color: 'text-amber-400' },
        { label: 'Resolved', value: counts.resolved, color: 'text-green-400' },
        { label: 'Reopened', value: counts.reopened, color: 'text-red-400' },
      ].map(({ label, value, color }) => (
        <div key={label} className="glass p-4 rounded-xl border border-white/5 text-center">
          <div className={`text-2xl font-black ${color}`}>{value}</div>
          <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Department Component ────────────────────────────────────────────────
function Department() {
  const [isAuth, setIsAuth] = useState(localStorage.getItem('deptAuth') === 'true');
  const [departmentName, setDepartmentName] = useState(localStorage.getItem('deptName') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuth && departmentName) fetchTasks();
  }, [isAuth, departmentName, filter]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const resp = await axios.post('http://localhost:5000/api/department/login', { email, password });
      setIsAuth(true);
      setDepartmentName(resp.data.department);
      localStorage.setItem('deptAuth', 'true');
      localStorage.setItem('deptName', resp.data.department);
    } catch (err) {
      alert('Invalid Department Credentials');
    }
    setLoginLoading(false);
  };

  const logout = () => {
    setIsAuth(false);
    setDepartmentName('');
    localStorage.removeItem('deptAuth');
    localStorage.removeItem('deptName');
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const url = `http://localhost:5000/api/department/complaints?department=${encodeURIComponent(departmentName)}${filter ? `&status=${filter}` : ''}`;
      const resp = await axios.get(url);
      setComplaints(resp.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // ── LOGIN SCREEN ──────────────────────────────────────────────────────────
  if (!isAuth) {
    return (
      <div className="max-w-md mx-auto pt-16 animate-in fade-in zoom-in duration-500">
        <div className="glass p-10 rounded-[2rem] border border-white/10 relative overflow-hidden">
          {/* Decorative top strip */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl -z-10" />

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-orange-400/10 border border-orange-400/30 flex items-center justify-center">
              <Shield size={32} className="text-orange-400" />
            </div>
          </div>

          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-1 text-center text-white">
            Department <span className="text-orange-400">Portal</span>
          </h2>
          <p className="text-center text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-8">
            Field Operations Gateway · Delhi Civic System
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 block">Official Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-orange-400 transition"
                placeholder="pwd@delhi.gov.in"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 block">Security Token</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-orange-400 transition"
                placeholder="••••••"
                required
              />
            </div>

            {/* Credential hints */}
            <div className="bg-white/3 border border-white/5 rounded-xl p-4">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-3">Available Credentials</div>
              <div className="grid grid-cols-2 gap-y-1 text-[9px] font-mono">
                {[
                  'pwd@delhi.gov.in', 'jal@delhi.gov.in', 'power@delhi.gov.in',
                  'mcd@delhi.gov.in', 'sewer@delhi.gov.in', 'police@delhi.gov.in',
                ].map(e => (
                  <button
                    key={e} type="button"
                    onClick={() => { setEmail(e); setPassword('admin'); }}
                    className="text-left text-slate-500 hover:text-orange-400 transition truncate"
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className="text-[9px] text-slate-600 mt-2 font-mono">Password: <span className="text-slate-400">admin</span></div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-4 font-black uppercase italic tracking-widest text-sm rounded-xl bg-white text-black hover:bg-orange-400 transition-colors disabled:opacity-50"
            >
              {loginLoading ? 'Authenticating...' : 'Access Task Grid'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass p-6 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500/60 to-transparent" />
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Active Terminal</div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-orange-400">{departmentName}</h1>
          <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mt-0.5">Delhi Civic Services · Field Operations</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Filter */}
          <div className="flex gap-2">
            {['', 'Assigned', 'In Progress', 'Completed', 'Reopened'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition ${
                  filter === f
                    ? 'bg-orange-400 text-black border-orange-400'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                }`}
              >
                {f || 'All'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchTasks}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5 transition text-slate-400"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-2 text-cyber-red text-[10px] font-black uppercase tracking-widest hover:text-white transition"
          >
            <LogOut size={14} /> Disconnect
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsBar complaints={complaints} />

      {/* Complaints Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="py-24 text-center">
          <AlertCircle size={40} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 uppercase tracking-widest text-sm italic font-black">No Active Task Directives</p>
          <p className="text-slate-600 text-xs mt-2">Admin has not assigned any complaints to {departmentName} yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {complaints.map(c => <TaskCard key={c.id} c={c} onUpdate={fetchTasks} />)}
        </div>
      )}
    </div>
  );
}

export default Department;
