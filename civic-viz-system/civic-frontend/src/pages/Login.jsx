import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ArrowRight, UserCheck, AlertTriangle, Fingerprint,
  UserPlus, MapPin, CheckCircle, X, ChevronDown, Upload,
  Camera, Navigation, Clock, FileText, Phone, Mail,
  LogOut, Home, ChevronRight, Loader, Star
} from 'lucide-react';

// Fixed booth for all new complaints — matches a REAL booth in the database
const FIXED_BOOTH = {
  booth_id:   'Z10-ROH-C09-B50',
  booth_name: 'Rohini Sector 9 - Booth 50',
  area:       'Shahdara',
  cluster:    'Rohini Sector 9',
  zone:       'Shahdara',
  path:       'Delhi › Shahdara › Rohini Sector 9 › Booth 50',
};

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'Water Supply',   emoji: '💧', color: '#0A84FF' },
  { value: 'Electricity',    emoji: '⚡', color: '#FFD60A' },
  { value: 'Roads/Potholes', emoji: '🛣️', color: '#FF9F0A' },
  { value: 'Garbage',        emoji: '🗑️', color: '#BF5AF2' },
  { value: 'Street Lights',  emoji: '💡', color: '#64D2FF' },
  { value: 'Public Health',  emoji: '🏥', color: '#FF453A' },
  { value: 'Drainage',       emoji: '🚿', color: '#30D158' },
  { value: 'Other',          emoji: '📋', color: '#8E8E93' },
];

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  Pending:      { color: '#FFD60A', bg: 'rgba(255,214,10,0.1)',   border: 'rgba(255,214,10,0.3)'   },
  Assigned:     { color: '#0A84FF', bg: 'rgba(10,132,255,0.1)',   border: 'rgba(10,132,255,0.3)'   },
  'In Progress':{ color: '#BF5AF2', bg: 'rgba(191,90,242,0.1)',   border: 'rgba(191,90,242,0.3)'   },
  Resolved:     { color: '#30D158', bg: 'rgba(48,209,88,0.1)',    border: 'rgba(48,209,88,0.3)'    },
  Reopened:     { color: '#FF453A', bg: 'rgba(255,69,58,0.1)',    border: 'rgba(255,69,58,0.3)'    },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.Pending;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 999, fontSize: 9, fontWeight: 900,
      letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap',
      color: c.color, background: c.bg, border: `1px solid ${c.border}`,
    }}>{status || 'Pending'}</span>
  );
};

// ─── GPS Location Helper ───────────────────────────────────────────────────────
function makeGoogleMapsLink(lat, lng) {
  if (!lat || !lng) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
function Login() {
  const [tab,       setTab]       = useState('login'); // 'login' | 'register'
  const [user,      setUser]      = useState(() => {
    try { return JSON.parse(localStorage.getItem('citizenUser')) || null; } catch { return null; }
  });
  const [view,      setView]      = useState('home'); // 'home' | 'complaint' | 'profile'

  // Login form
  const [loginId,    setLoginId]    = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginErr,   setLoginErr]   = useState('');
  const [loginLoad,  setLoginLoad]  = useState(false);

  // Register form
  const [regForm, setRegForm] = useState({ voter_id: '', name: '', email: '', phone: '', address: '' });
  const [regLoad, setRegLoad] = useState(false);
  const [regId,   setRegId]   = useState('');  // returned citizen ID after register

  // Complaint form
  const [cat,         setCat]         = useState('');
  const [desc,        setDesc]        = useState('');
  const [locText,     setLocText]     = useState('');   // typed location
  const [gpsCoords,   setGpsCoords]   = useState(null); // { lat, lng }
  const [gpsLoading,  setGpsLoading]  = useState(false);
  const [file,        setFile]        = useState(null);
  const [preview,     setPreview]     = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitOk,    setSubmitOk]    = useState(false);

  // Complaint history
  const [history, setHistory] = useState([]);
  const [histLoad, setHistLoad] = useState(false);

  // ── Persist user to localStorage ────────────────────────────────────────────
  useEffect(() => {
    if (user) localStorage.setItem('citizenUser', JSON.stringify(user));
    else localStorage.removeItem('citizenUser');
  }, [user]);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  // ── Fetch complaint history ──────────────────────────────────────────────────
  const fetchHistory = async () => {
    if (!user) return;
    setHistLoad(true);
    try {
      const r = await axios.get(`http://localhost:5000/api/complaints/voter/${user.voter_id || user.id}`);
      setHistory(r.data || []);
    } catch { setHistory([]); }
    setHistLoad(false);
  };

  // ── Login ────────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!loginId.trim()) { setLoginErr('Please enter your Citizen ID'); return; }
    setLoginLoad(true); setLoginErr('');
    try {
      const r = await axios.post('http://localhost:5000/api/auth/login', {
        voter_id: loginId.trim(),
        email: loginEmail.trim() || undefined,
      });
      setUser({ ...r.data, voter_id: r.data.voter_id || loginId.trim() });
      setView('home');
    } catch (err) {
      setLoginErr(err.response?.data?.message || 'ID not found. Please register first.');
    }
    setLoginLoad(false);
  };

  // ── Register ─────────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.voter_id.trim() || !regForm.address.trim() || !regForm.phone.trim()) {
      alert('Voter ID, Address, and Phone are required'); return;
    }
    setRegLoad(true);
    try {
      const r = await axios.post('http://localhost:5000/api/auth/register', {
        voter_id: regForm.voter_id.trim(),
        name:     regForm.name.trim(),
        email:    regForm.email.trim(),
        phone:    regForm.phone.trim(),
        address: regForm.address.trim(),
        // Force-allocate to B01
        area:    FIXED_BOOTH.area,
        pincode: '110048',
      });
      setRegId(r.data.voter_id);
      setUser({ ...r.data, voter_id: r.data.voter_id });
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed');
    }
    setRegLoad(false);
  };

  // ── GPS detection ────────────────────────────────────────────────────────────
  const detectGPS = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setGpsCoords({ lat, lng });
        setLocText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        setGpsLoading(false);
      },
      () => { alert('Could not detect location'); setGpsLoading(false); }
    );
  };

  // ── Submit complaint ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!desc.trim()) { alert('Please describe the issue'); return; }
    if (!cat)         { alert('Please select a category');  return; }
    setSubmitting(true);
    const fd = new FormData();
    fd.append('voter_id',    user.voter_id || `GUEST-${user.id}`);
    fd.append('booth_id',    FIXED_BOOTH.booth_id);
    fd.append('description', desc.trim());
    fd.append('category',    cat);
    // Location: typed text OR GPS coords
    const locStr = gpsCoords
      ? `${locText} | GPS: ${gpsCoords.lat},${gpsCoords.lng} | Maps: ${makeGoogleMapsLink(gpsCoords.lat, gpsCoords.lng)}`
      : locText;
    fd.append('address', locStr);
    if (file) fd.append('image', file);

    try {
      await axios.post('http://localhost:5000/api/complaints', fd);
      setSubmitOk(true);
      setCat(''); setDesc(''); setLocText(''); setGpsCoords(null);
      setFile(null); setPreview(null);
      fetchHistory();
      setTimeout(() => { setSubmitOk(false); setView('profile'); }, 2000);
    } catch { alert('Submission failed. Please try again.'); }
    setSubmitting(false);
  };

  // ────────────────────────────────────────────────────────────────────────────
  // NOT LOGGED IN
  // ────────────────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 16px' }}>
        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)', padding: 4, marginBottom: 32 }}>
          {[['login','Citizen Login', Fingerprint], ['register','New Registration', UserPlus]].map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: '10px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: tab === id ? '#fff' : 'transparent',
              color: tab === id ? '#000' : 'rgba(255,255,255,0.4)',
              fontSize: 11, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'login' ? (
            <motion.div key="login" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }}>
              {/* Login Card */}
              <div style={{
                background: 'rgba(12,12,22,0.8)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 28, padding: 36, backdropFilter: 'blur(40px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 20,
                    background: 'rgba(10,132,255,0.12)', border: '1px solid rgba(10,132,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Fingerprint size={30} style={{ color: '#0A84FF' }} />
                  </div>
                  <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 900, margin: 0,
                    textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '-0.02em' }}>
                    Citizen <span style={{ color: '#0A84FF' }}>Login</span>
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700,
                    marginTop: 8, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
                    Enter your credentials to access the portal
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 900,
                      letterSpacing: '0.3em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                      Citizen / Voter ID *
                    </label>
                    <input
                      value={loginId}
                      onChange={e => setLoginId(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      placeholder="e.g. VOTER001 or GUEST-12"
                      style={{
                        width: '100%', padding: '14px 16px', borderRadius: 14, boxSizing: 'border-box',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', fontSize: 14, fontWeight: 600, outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 900,
                      letterSpacing: '0.3em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                      Email (optional)
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      placeholder="citizen@example.com"
                      style={{
                        width: '100%', padding: '14px 16px', borderRadius: 14, boxSizing: 'border-box',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', fontSize: 14, fontWeight: 600, outline: 'none',
                      }}
                    />
                  </div>

                  {loginErr && (
                    <div style={{ color: '#FF453A', fontSize: 11, fontWeight: 700,
                      background: 'rgba(255,69,58,0.1)', borderRadius: 10, padding: '8px 12px',
                      border: '1px solid rgba(255,69,58,0.2)' }}>
                      {loginErr}
                    </div>
                  )}

                  <button onClick={handleLogin} disabled={loginLoad}
                    style={{
                      width: '100%', padding: '16px', borderRadius: 14, border: 'none',
                      background: '#0A84FF', color: '#fff', fontSize: 12, fontWeight: 900,
                      letterSpacing: '0.2em', textTransform: 'uppercase', cursor: loginLoad ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      opacity: loginLoad ? 0.7 : 1, transition: 'all 0.2s',
                    }}>
                    {loginLoad ? <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <ArrowRight size={16} />}
                    {loginLoad ? 'Verifying…' : 'Sign In'}
                  </button>

                  <button onClick={() => setTab('register')} style={{
                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em',
                    padding: '8px 0', textDecoration: 'underline dotted',
                  }}>
                    Not registered yet? Create account →
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="reg" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }}>
              {/* Register Card */}
              <div style={{
                background: 'rgba(12,12,22,0.8)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 28, padding: 36, backdropFilter: 'blur(40px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 20,
                    background: 'rgba(48,209,88,0.12)', border: '1px solid rgba(48,209,88,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <UserPlus size={30} style={{ color: '#30D158' }} />
                  </div>
                  <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 900, margin: 0,
                    textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '-0.02em' }}>
                    New <span style={{ color: '#30D158' }}>Citizen</span>
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700,
                    marginTop: 8, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                    Create your account to file complaints
                  </p>
                </div>

                {/* Fixed booth notice */}
                <div style={{
                  background: 'rgba(10,132,255,0.08)', border: '1px solid rgba(10,132,255,0.2)',
                  borderRadius: 12, padding: '10px 14px', marginBottom: 20,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <MapPin size={14} style={{ color: '#0A84FF', flexShrink: 0 }} />
                  <div>
                    <div style={{ color: '#0A84FF', fontSize: 9, fontWeight: 900,
                      letterSpacing: '0.25em', textTransform: 'uppercase' }}>Auto-assigned Booth</div>
                    <div style={{ color: '#fff', fontSize: 11, fontWeight: 700, marginTop: 2 }}>
                      Delhi › Shahdara › Rohini Sector 9 › <strong>Booth 50</strong>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { key: 'voter_id', label: 'Voter ID *',    type: 'text',  placeholder: 'e.g. DLH1234567' },
                    { key: 'name',     label: 'Full Name *',   type: 'text',  placeholder: 'Enter your full name' },
                    { key: 'address',  label: 'Address *',     type: 'text',  placeholder: 'House no, street, area...' },
                    { key: 'phone',    label: 'Phone *',       type: 'text',  placeholder: '9876543210' },
                    { key: 'email',    label: 'Email (Optional)', type: 'email', placeholder: 'citizen@example.com' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 900,
                        letterSpacing: '0.3em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                        {f.label}
                      </label>
                      <input
                        type={f.type}
                        value={regForm[f.key]}
                        onChange={e => setRegForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        style={{
                          width: '100%', padding: '13px 16px', borderRadius: 12, boxSizing: 'border-box',
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff', fontSize: 13, fontWeight: 600, outline: 'none',
                        }}
                      />
                    </div>
                  ))}

                  {regId && (
                    <div style={{ background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.3)',
                      borderRadius: 12, padding: '12px 16px' }}>
                      <div style={{ color: '#30D158', fontSize: 9, fontWeight: 900,
                        letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 4 }}>
                        ✓ Registration Successful!
                      </div>
                      <div style={{ color: '#fff', fontSize: 13, fontWeight: 900 }}>
                        Your Citizen ID: <span style={{ color: '#30D158' }}>{regId}</span>
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4 }}>
                        Save this ID — you'll need it to log in
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={regLoad} style={{
                    width: '100%', padding: '15px', borderRadius: 14, border: 'none',
                    background: '#30D158', color: '#000', fontSize: 12, fontWeight: 900,
                    letterSpacing: '0.2em', textTransform: 'uppercase', cursor: regLoad ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    opacity: regLoad ? 0.7 : 1,
                  }}>
                    {regLoad ? <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <UserPlus size={16} />}
                    {regLoad ? 'Registering…' : 'Create Account'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // LOGGED IN — Portal
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>

      {/* ── Top Nav ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(12,12,22,0.8)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 18, padding: '12px 20px', marginBottom: 24,
        backdropFilter: 'blur(30px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12,
            background: 'rgba(10,132,255,0.15)', border: '1px solid rgba(10,132,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={18} style={{ color: '#0A84FF' }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 900, letterSpacing: '-0.01em' }}>
              {user.name}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              {user.voter_id || `GUEST-${user.id}`}
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'home',      label: 'Home',     Icon: Home        },
            { id: 'complaint', label: 'File',     Icon: AlertTriangle },
            { id: 'profile',   label: 'My Profile', Icon: Star       },
          ].map(({ id, label, Icon }) => (
            <button key={id} onClick={() => { setView(id); if (id==='profile') fetchHistory(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 10,
                fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase',
                background: view === id ? 'rgba(10,132,255,0.2)' : 'rgba(255,255,255,0.04)',
                color: view === id ? '#0A84FF' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${view === id ? 'rgba(10,132,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
                transition: 'all 0.2s',
              }}>
              <Icon size={12} /> {label}
            </button>
          ))}
          <button onClick={() => { setUser(null); setHistory([]); }} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            borderRadius: 10, border: '1px solid rgba(255,69,58,0.2)', cursor: 'pointer',
            background: 'rgba(255,69,58,0.08)', color: '#FF453A', fontSize: 10,
            fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase',
          }}>
            <LogOut size={12} /> Logout
          </button>
        </div>
      </div>

      {/* ── HOME VIEW ── */}
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div key="home" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* Welcome card */}
              <div style={{
                gridColumn: '1 / -1',
                background: 'linear-gradient(135deg, rgba(10,132,255,0.12) 0%, rgba(48,209,88,0.08) 100%)',
                border: '1px solid rgba(10,132,255,0.2)', borderRadius: 22, padding: '24px 28px',
              }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 900,
                  letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Welcome back
                </div>
                <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 900, margin: '0 0 6px',
                  fontStyle: 'italic', letterSpacing: '-0.02em' }}>
                  {user.name}
                </h2>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700 }}>
                  📍 Delhi › Shahdara › Rohini Sector 9 › <span style={{ color: '#0A84FF' }}>Booth 50</span>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                  <button onClick={() => setView('complaint')} style={{
                    padding: '10px 22px', borderRadius: 12, border: 'none',
                    background: '#0A84FF', color: '#fff', fontSize: 11, fontWeight: 900,
                    letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <AlertTriangle size={13} /> File Complaint
                  </button>
                  <button onClick={() => { setView('profile'); fetchHistory(); }} style={{
                    padding: '10px 22px', borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 11, fontWeight: 900,
                    letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <FileText size={13} /> My Complaints ({history.length})
                  </button>
                </div>
              </div>

              {/* Stats */}
              {[
                { label: 'Total Filed',  val: history.length,                                   color: '#0A84FF' },
                { label: 'Pending',      val: history.filter(c => c.status === 'Pending').length, color: '#FFD60A' },
                { label: 'In Progress',  val: history.filter(c => c.status === 'Assigned' || c.status === 'In Progress').length, color: '#BF5AF2' },
                { label: 'Resolved',     val: history.filter(c => c.status === 'Resolved').length, color: '#30D158' },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'rgba(12,12,22,0.8)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 18, padding: '20px 22px', backdropFilter: 'blur(20px)',
                }}>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 900,
                    letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 8 }}>
                    {s.label}
                  </div>
                  <div style={{ color: s.color, fontSize: 36, fontWeight: 900,
                    fontStyle: 'italic', letterSpacing: '-0.03em' }}>
                    {s.val}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── FILE COMPLAINT VIEW ── */}
        {view === 'complaint' && (
          <motion.div key="complaint" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
            <div style={{
              background: 'rgba(12,12,22,0.8)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 24, padding: 32, backdropFilter: 'blur(40px)',
            }}>
              <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '0 0 6px',
                fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em',
                display: 'flex', alignItems: 'center', gap: 12 }}>
                <AlertTriangle size={22} style={{ color: '#FF9F0A' }} />
                File a Complaint
              </h2>

              {/* Booth badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(10,132,255,0.08)', border: '1px solid rgba(10,132,255,0.2)',
                borderRadius: 999, padding: '5px 14px', marginBottom: 28,
              }}>
                <MapPin size={11} style={{ color: '#0A84FF' }} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 900,
                  letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                  Delhi › South Delhi › Greater Kailash 1 › <span style={{ color: '#0A84FF' }}>Booth B01</span>
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Category grid */}
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 900,
                    letterSpacing: '0.3em', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
                    Problem Category *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {CATEGORIES.map(c => (
                      <button key={c.value} onClick={() => setCat(c.value)} style={{
                        padding: '12px 8px', borderRadius: 14, border: 'none', cursor: 'pointer',
                        background: cat === c.value ? `${c.color}22` : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${cat === c.value ? c.color : 'rgba(255,255,255,0.08)'}`,
                        color: cat === c.value ? c.color : 'rgba(255,255,255,0.5)',
                        fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        transition: 'all 0.2s',
                        boxShadow: cat === c.value ? `0 0 16px ${c.color}44` : 'none',
                      }}>
                        <span style={{ fontSize: 18 }}>{c.emoji}</span>
                        {c.value}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 900,
                    letterSpacing: '0.3em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    Issue Description *
                  </label>
                  <textarea
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    rows={4}
                    placeholder="Describe the problem in detail — what you see, how long it's been there, who it affects..."
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: 14,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', fontSize: 13, lineHeight: 1.6, resize: 'vertical',
                      outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Location */}
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 900,
                    letterSpacing: '0.3em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    📍 Location
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      value={locText}
                      onChange={e => setLocText(e.target.value)}
                      placeholder="e.g. Near Main Gate, Block B, GK-1 market..."
                      style={{
                        width: '100%', padding: '14px 130px 14px 16px', borderRadius: 14,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    <button onClick={detectGPS} disabled={gpsLoading} style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: gpsCoords ? 'rgba(48,209,88,0.2)' : 'rgba(10,132,255,0.15)',
                      color: gpsCoords ? '#30D158' : '#0A84FF',
                      fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      {gpsLoading
                        ? <Loader size={11} style={{ animation: 'spin 0.8s linear infinite' }} />
                        : <Navigation size={11} />}
                      {gpsCoords ? 'GPS ✓' : 'Use GPS'}
                    </button>
                  </div>
                  {gpsCoords && (
                    <a href={makeGoogleMapsLink(gpsCoords.lat, gpsCoords.lng)} target="_blank" rel="noreferrer"
                      style={{ color: '#0A84FF', fontSize: 10, fontWeight: 700, textDecoration: 'none',
                        display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <MapPin size={10} /> View on Google Maps ↗
                    </a>
                  )}
                </div>

                {/* Photo upload */}
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 900,
                    letterSpacing: '0.3em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    📷 Photo Evidence
                  </label>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                    borderRadius: 14, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.03)', border: '1.5px dashed rgba(255,255,255,0.12)',
                    transition: 'all 0.2s',
                  }}>
                    <Camera size={20} style={{ color: '#0A84FF', flexShrink: 0 }} />
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                      {file ? file.name : 'Click to upload photo (JPG, PNG, max 10MB)'}
                    </span>
                    <input type="file" accept="image/*" onChange={e => {
                      const f = e.target.files?.[0];
                      setFile(f || null);
                      setPreview(f ? URL.createObjectURL(f) : null);
                    }} style={{ display: 'none' }} />
                  </label>
                  {preview && (
                    <div style={{ position: 'relative', marginTop: 10 }}>
                      <img src={preview} alt="preview" style={{
                        width: '100%', maxHeight: 220, objectFit: 'cover',
                        borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                      }} />
                      <button onClick={() => { setFile(null); setPreview(null); }} style={{
                        position: 'absolute', top: 8, right: 8, width: 28, height: 28,
                        borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.7)',
                        color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit */}
                {submitOk ? (
                  <div style={{ padding: '18px', borderRadius: 14, textAlign: 'center',
                    background: 'rgba(48,209,88,0.12)', border: '1px solid rgba(48,209,88,0.3)',
                    color: '#30D158', fontSize: 14, fontWeight: 900 }}>
                    ✓ Complaint submitted! Redirecting to your profile…
                  </div>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting || !desc.trim() || !cat}
                    style={{
                      width: '100%', padding: '16px', borderRadius: 14, border: 'none',
                      background: (!desc.trim() || !cat) ? 'rgba(255,255,255,0.06)' : '#FF9F0A',
                      color: (!desc.trim() || !cat) ? 'rgba(255,255,255,0.3)' : '#000',
                      fontSize: 12, fontWeight: 900, letterSpacing: '0.2em',
                      textTransform: 'uppercase', cursor: (!desc.trim() || !cat) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      transition: 'all 0.2s',
                    }}>
                    {submitting
                      ? <><Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Submitting…</>
                      : <><ArrowRight size={16} /> Submit Complaint</>
                    }
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── PROFILE VIEW ── */}
        {view === 'profile' && (
          <motion.div key="profile" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>

              {/* Left: User card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Avatar + info */}
                <div style={{
                  background: 'rgba(12,12,22,0.9)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 22, padding: '28px 22px', textAlign: 'center',
                  backdropFilter: 'blur(40px)',
                }}>
                  <div style={{ width: 70, height: 70, borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(10,132,255,0.3), rgba(48,209,88,0.3))',
                    border: '2px solid rgba(10,132,255,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <UserCheck size={30} style={{ color: '#0A84FF' }} />
                  </div>
                  <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: '0 0 4px',
                    fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
                    {user.name}
                  </h3>
                  <p style={{ color: '#0A84FF', fontSize: 9, fontWeight: 900, margin: '0 0 20px',
                    letterSpacing: '0.25em', textTransform: 'uppercase' }}>
                    {user.voter_id?.startsWith('GUEST') ? 'Registered Citizen' : 'Verified Voter'}
                  </p>

                  {/* Info rows */}
                  {[
                    { label: 'Citizen ID',  val: user.voter_id || `GUEST-${user.id}` },
                    { label: 'Email',        val: user.email || '—'                    },
                    { label: 'Phone',        val: user.phone || '—'                    },
                    { label: 'Address',      val: user.address || '—'                  },
                    { label: 'Booth', val: 'Booth 50 (Rohini Sector 9)' },
                    { label: 'Zone',  val: 'Delhi › Shahdara' },
                  ].map(r => (
                    <div key={r.label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      padding: '8px 10px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.03)', marginBottom: 6,
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 900,
                        letterSpacing: '0.2em', textTransform: 'uppercase', flexShrink: 0, marginRight: 8 }}>
                        {r.label}
                      </span>
                      <span style={{ color: '#fff', fontSize: 10, fontWeight: 700,
                        textAlign: 'right', wordBreak: 'break-all' }}>
                        {r.val}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div style={{
                  background: 'rgba(12,12,22,0.9)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 18, padding: '18px 20px',
                }}>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 900,
                    letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 14 }}>
                    Complaint Summary
                  </div>
                  {[
                    { label: 'Total',       val: history.length,  color: '#0A84FF' },
                    { label: 'Pending',     val: history.filter(c=>c.status==='Pending').length,   color: '#FFD60A' },
                    { label: 'Resolved',    val: history.filter(c=>c.status==='Resolved').length,  color: '#30D158' },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '6px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }}>{s.label}</span>
                      <span style={{ color: s.color, fontSize: 16, fontWeight: 900, fontStyle: 'italic' }}>{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Complaints list */}
              <div style={{
                background: 'rgba(12,12,22,0.9)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 22, padding: 24, backdropFilter: 'blur(40px)',
                maxHeight: '75vh', overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 18, position: 'sticky', top: 0,
                  background: 'rgba(12,12,22,0.95)', paddingBottom: 12, zIndex: 10 }}>
                  <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0,
                    fontStyle: 'italic', textTransform: 'uppercase' }}>
                    My Complaints
                  </h3>
                  <button onClick={fetchHistory} style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: '5px 12px', color: 'rgba(255,255,255,0.5)',
                    fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer',
                  }}>Refresh</button>
                </div>

                {histLoad ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>
                    <Loader size={24} style={{ animation: 'spin 0.8s linear infinite' }} />
                  </div>
                ) : history.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px',
                    color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 700,
                    letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                    No complaints filed yet.<br/>
                    <button onClick={() => setView('complaint')} style={{
                      marginTop: 16, padding: '10px 20px', borderRadius: 12, border: 'none',
                      background: '#0A84FF', color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer',
                    }}>File First Complaint</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {history.map((c, idx) => {
                      // Parse GPS from address if present
                      const gpsMatch = c.address?.match(/GPS:\s*([\d.]+),([\d.]+)/);
                      const mapsUrl  = gpsMatch
                        ? `https://www.google.com/maps?q=${gpsMatch[1]},${gpsMatch[2]}`
                        : (c.address?.includes('Maps:') ? c.address.split('Maps:')[1]?.trim().split(' ')[0] : null);
                      const cleanAddr = c.address
                        ?.replace(/\|?\s*GPS:[\d.,\s]+/, '')
                        .replace(/\|?\s*Maps:.*$/, '')
                        .trim();
                      const catCfg = CATEGORIES.find(x => x.value === c.category) || { color: '#7C7C8E', emoji: '📋' };

                      return (
                        <motion.div key={c.id || idx}
                          initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                          transition={{ delay: idx * 0.04 }}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: `1px solid rgba(255,255,255,0.07)`,
                            borderLeft: `3px solid ${catCfg.color}`,
                            borderRadius: 16, padding: '16px 18px',
                          }}>

                          {/* Header row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between',
                            alignItems: 'flex-start', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 18 }}>{catCfg.emoji}</span>
                              <div>
                                <div style={{ color: catCfg.color, fontSize: 10, fontWeight: 900,
                                  letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                                  {c.category}
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>
                                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN',
                                    { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                </div>
                              </div>
                            </div>
                            <StatusBadge status={c.status} />
                          </div>

                          {/* Photo */}
                          {c.imageUrl && (
                            <img
                              src={c.imageUrl?.startsWith('http') ? c.imageUrl : `http://localhost:5000${c.imageUrl}`}
                              alt="proof"
                              style={{ width: '100%', height: 150, objectFit: 'cover',
                                borderRadius: 10, marginBottom: 10, display: 'block',
                                border: '1px solid rgba(255,255,255,0.07)' }}
                            />
                          )}

                          {/* Description */}
                          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.6,
                            margin: '0 0 10px', borderLeft: `2px solid ${catCfg.color}55`, paddingLeft: 10 }}>
                            {c.description}
                          </p>
                          
                          {/* Department Assignment Tag */}
                          {c.assigned_department && (
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '4px 10px', borderRadius: 8, marginBottom: 10,
                              background: 'rgba(10,132,255,0.1)', border: '1px solid rgba(10,132,255,0.2)',
                              color: '#64D2FF', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em',
                              textTransform: 'uppercase'
                            }}>
                              <span style={{color: '#0A84FF'}}>🏢 Handling Dept:</span> {c.assigned_department}
                            </div>
                          )}

                          {/* Location + Maps link */}
                          {cleanAddr && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                              <MapPin size={11} style={{ color: 'rgba(255,255,255,0.3)', marginTop: 2, flexShrink: 0 }} />
                              <div>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{cleanAddr}</span>
                                {mapsUrl && (
                                  <a href={mapsUrl} target="_blank" rel="noreferrer"
                                    style={{ display: 'block', color: '#0A84FF', fontSize: 10,
                                      fontWeight: 700, marginTop: 3, textDecoration: 'none' }}>
                                    📍 View on Google Maps ↗
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Booth */}
                          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9,
                            fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                            marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          Booth Z10-ROH-C09-B50 · Rohini Sector 9 · Shahdara
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Login;
