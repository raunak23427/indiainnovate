import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import {
  LayoutDashboard, ChevronLeft, AlertTriangle,
  Activity, X, User, MapPin, Clock, Image as ImageIcon, CheckCircle, Loader
} from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Error Boundary
// ─────────────────────────────────────────────────────────────
class VizErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  render() {
    if (this.state.err) return (
      <div style={{ padding: 60, textAlign: 'center', color: '#fff' }}>
        <AlertTriangle size={48} style={{ color: '#FF453A', margin: '0 auto 16px' }} />
        <h2>Visualization Error</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{this.state.err?.toString()}</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: '10px 28px', background: '#0A84FF', border: 'none', borderRadius: 999, color: '#fff', fontWeight: 900, cursor: 'pointer' }}>Reload</button>
      </div>
    );
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const CAT_COLORS = {
  'Water Supply':   '#0A84FF',
  'Electricity':    '#FFD60A',
  'Roads/Potholes': '#FF9F0A',
  'Garbage':        '#BF5AF2',
  'Street Lights':  '#64D2FF',
  'Public Health':  '#FF453A',
  'Drainage':       '#30D158',
};
const DEFAULT_COLOR = '#7C7C8E';

function catColor(name) { return CAT_COLORS[name] || DEFAULT_COLOR; }

// Heatmap colors based on problem count
function getHeatColor(count, isActive) {
  if (isActive) return '#0A84FF';    // Active highlight
  if (count === 0) return '#30D158'; // Green (No issues)
  if (count <= 10) return '#FFD60A'; // Yellow (Low)
  if (count <= 25) return '#FF9F0A'; // Orange (Medium)
  return '#FF453A';                  // Red (High/Critical)
}


// Strip prefix junk from booth/cluster IDs
// e.g. "Z08-MAL-C16-B17" → "B17", "Zone A | Cluster 3 | Booth 12" → "Booth 12"
function shortLabel(raw = '') {
  const s = String(raw).trim();
  // Pipe-separated: take last part
  if (s.includes('|')) return s.split('|').pop().trim();
  if (s.includes(' - ')) return s.split(' - ').pop().trim();
  // Hyphen-separated code like Z08-MAL-C16-B17 → take last segment
  if (s.includes('-')) return s.split('-').pop().trim();
  return s;
}

// ─────────────────────────────────────────────────────────────
// Background stars (full 3D sphere)
// ─────────────────────────────────────────────────────────────
const Stars = () => {
  const pos = useMemo(() => {
    const a = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      // Random points on a large sphere shell
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 120 + Math.random() * 80;
      a[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      a[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      a[i * 3 + 2] = r * Math.cos(phi);
    }
    return a;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={400} array={pos} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.2} color="#ffffff" transparent opacity={0.3} sizeAttenuation />
    </points>
  );
};

// ─────────────────────────────────────────────────────────────
// Graph Node
// ─────────────────────────────────────────────────────────────
const GNode = ({ node, level, onClick, isActive }) => {
  const [hov, setHov] = useState(false);

  const label  = level === 4 ? String(node._id) : shortLabel(node._id);
  const count  = node.unresolved || node.count || 0;
  
  // Categories use category color, higher levels use heat color based on problems
  const color  = level === 4 ? catColor(node._id) : getHeatColor(count, isActive || hov);
  
  // Booth nodes are smaller
  const size   = level === 4 ? 3.2 : (level === 3 ? 1.4 : 2.8);
  const bright = isActive || hov ? 5 : (level === 4 ? 1.2 : 1.8);

  // Label placement: outward along spoke direction
  const [px, py, pz] = node.pos;
  const len  = Math.sqrt(px*px + py*py + pz*pz) || 1;
  const norm = [px/len, py/len, pz/len];
  const labelPos = [
    px + norm[0] * (size + (level === 3 ? 1.5 : 2.0)),
    py + norm[1] * (size + (level === 3 ? 1.5 : 2.0)),
    pz + norm[2] * (size + (level === 3 ? 1.5 : 2.0)),
  ];

  return (
    <group>
      {/* Spoke */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, ...node.pos])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={isActive || hov ? '#0A84FF' : color}
          transparent
          opacity={isActive || hov ? 0.65 : 0.15}
        />
      </line>

      {/* Sphere */}
      <mesh
        position={node.pos}
        scale={isActive || hov ? 1.8 : 1}
        onClick={e => { e.stopPropagation(); onClick(node); }}
        onPointerOver={e => { e.stopPropagation(); setHov(true);  document.body.style.cursor = 'pointer'; }}
        onPointerOut={()  => {                    setHov(false); document.body.style.cursor = 'auto';    }}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={bright} roughness={0.05} metalness={0.9} />
      </mesh>

      {/* Label */}
      <Html position={labelPos} center occlude={false} style={{ pointerEvents: 'none', userSelect: 'none' }}>
        {level === 3 ? (
          // Tiny, very minimal badge for booths to prevent clutter
          <div style={{
            padding: '2px 5px',
            background: isActive || hov ? `${color}44` : 'none',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            transition: 'all 0.1s',
            opacity: hov || isActive ? 1 : 0.7,
          }}>
            <span style={{
              color: isActive || hov ? '#fff' : color,
              fontSize: '8px',
              fontWeight: 900,
              textTransform: 'uppercase',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            }}>
              {label}
            </span>
          </div>
        ) : (
          // Normal badge for larger nodes (Zones, Clusters, Categories)
          <div style={{
            padding: '3px 10px', borderRadius: 999,
            background: isActive ? `${color}28` : 'rgba(4,4,12,0.9)',
            border: `1px solid ${color}${isActive ? 'ee' : '60'}`,
            backdropFilter: 'blur(12px)', whiteSpace: 'nowrap',
            boxShadow: (isActive || hov) ? `0 0 18px ${color}99` : 'none',
            transition: 'all 0.15s',
          }}>
            <span style={{
              color: isActive ? color : '#e8e8e8',
              fontSize: '10px',
              fontWeight: 900, letterSpacing: '0.15em',
              textTransform: 'uppercase', fontFamily: 'Inter, monospace',
            }}>
              {label}
            </span>
          </div>
        )}
      </Html>
    </group>
  );
};


// ─────────────────────────────────────────────────────────────
// Left Side Panel — Problems under a category
// ─────────────────────────────────────────────────────────────
const ProblemsPanel = ({ booth, category, onClose }) => {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const color = catColor(category);

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`http://localhost:5000/api/admin/complaints/${id}`, { status });
      setItems(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!booth || !category) return;
    setLoading(true);
    // Use the direct endpoint — reliable, no complex query params
    const url = `http://localhost:5000/api/viz/4d/detailed-problems/${encodeURIComponent(booth)}/${encodeURIComponent(category)}`;
    axios.get(url)
      .then(r => { setItems(Array.isArray(r.data) ? r.data : []); setLoading(false); })
      .catch(() => { setItems([]); setLoading(false); });
  }, [booth, category]);

  const badge = (s) => {
    const cfg = {
      Pending:  { bg: 'rgba(255,196,0,0.12)', color: '#FFD60A', border: 'rgba(255,196,0,0.3)'  },
      Assigned: { bg: 'rgba(10,132,255,0.12)', color: '#0A84FF', border: 'rgba(10,132,255,0.3)' },
      Resolved: { bg: 'rgba(48,209,88,0.12)',  color: '#30D158', border: 'rgba(48,209,88,0.3)'  },
    };
    const c = cfg[s] || cfg.Pending;
    return (
      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 9, fontWeight: 900,
        letterSpacing: '0.2em', textTransform: 'uppercase',
        background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
        {s || 'Pending'}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      style={{
        position: 'fixed', top: 96, left: 0,
        width: '420px', height: 'calc(100vh - 96px)',
        background: 'rgba(5,6,14,0.97)',
        backdropFilter: 'blur(60px)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '20px 0 80px rgba(0,0,0,0.7)',
        zIndex: 300,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Sticky Header */}
      <div style={{
        padding: '24px 22px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0,
        background: 'rgba(5,6,14,0.97)',
        backdropFilter: 'blur(40px)',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {/* Category dot + label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 12px ${color}` }} />
              <span style={{ color, fontSize: 9, fontWeight: 900, letterSpacing: '0.35em', textTransform: 'uppercase' }}>
                Problem Category
              </span>
            </div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: 0,
              textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {category}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700,
              margin: '6px 0 0', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Booth: {shortLabel(booth)}  •  {loading ? '…' : `${items.length} complaints`}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0,
          }}>
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 18px', flex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: 220, gap: 14 }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${color}33`,
              borderTopColor: color, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 800,
              letterSpacing: '0.3em', textTransform: 'uppercase' }}>Loading complaints…</span>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px',
            color: 'rgba(255,255,255,0.25)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            No complaints found for this category
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {items.map((c, idx) => (
              <motion.div
                key={c.id || idx}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 18, padding: '16px 16px 14px',
                  borderLeft: `3px solid ${color}`,
                }}
              >
                {/* Top row: citizen ID + status */}
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={14} style={{ color }} />
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8,
                        fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                        Citizen ID
                      </div>
                      <div style={{ color: '#fff', fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>
                        {c.citizen_id || c.voter_id || `CIV-${c.id}`}
                      </div>
                    </div>
                  </div>
                  {badge(c.status)}
                </div>

                {/* Proof Image */}
                {(c.proof || c.imageUrl) && (
                  <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 12,
                    border: '1px solid rgba(255,255,255,0.08)', position: 'relative',
                    aspectRatio: '16/9', background: '#111' }}>
                    <img
                      src={(c.proof || c.imageUrl)?.startsWith('http')
                        ? (c.proof || c.imageUrl)
                        : `http://localhost:5000${c.proof || c.imageUrl}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      alt="Proof"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <div style={{ position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
                  </div>
                )}

                {/* Description */}
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: 1.65,
                  margin: '0 0 12px', paddingLeft: 10,
                  borderLeft: `2px solid ${color}55` }}>
                  {c.description || 'No description provided.'}
                </p>

                {/* Meta grid */}
                <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {/* Location with clickable Maps link */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                      <MapPin size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
                      <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8,
                        fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Location</span>
                    </div>
                    {(() => {
                      const raw = c.address || c.location || '';
                      const gpsMatch = raw.match(/GPS:\s*([\d.]+),([\d.]+)/);
                      const mapsMatch = raw.match(/Maps:\s*(https?:\/\/\S+)/);
                      const mapsUrl   = gpsMatch
                        ? `https://www.google.com/maps?q=${gpsMatch[1]},${gpsMatch[2]}`
                        : mapsMatch ? mapsMatch[1] : null;
                      const cleanAddr = raw
                        .replace(/\|?\s*GPS:[\d.,\s]+/, '')
                        .replace(/\|?\s*Maps:.*$/, '')
                        .trim() || 'Not specified';
                      return (
                        <div>
                          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600, display: 'block' }}>
                            {cleanAddr}
                          </span>
                          {mapsUrl && (
                            <a href={mapsUrl} target="_blank" rel="noreferrer"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 5,
                                padding: '4px 10px', borderRadius: 8,
                                background: 'rgba(10,132,255,0.12)', border: '1px solid rgba(10,132,255,0.3)',
                                color: '#0A84FF', fontSize: 9, fontWeight: 900,
                                letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none',
                              }}>
                              <MapPin size={9} /> Open in Google Maps ↗
                            </a>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  {/* Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8,
                      fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Date: </span>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600 }}>
                      {c.created_at || c.createdAt
                        ? new Date(c.created_at || c.createdAt).toLocaleDateString('en-IN',
                            { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </span>
                  </div>
                </div>


                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {(!c.status || c.status === 'Pending') && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) updateStatus(c.id, 'Assigned', e.target.value);
                      }}
                      defaultValue=""
                      style={{
                        flex: 1, padding: '7px 10px', borderRadius: 10, cursor: 'pointer',
                        background: 'rgba(10,132,255,0.12)', border: '1px solid rgba(10,132,255,0.3)',
                        color: '#0A84FF', fontSize: 9, fontWeight: 900, outline: 'none',
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        WebkitAppearance: 'none', textAlign: 'center'
                      }}
                    >
                      <option value="" disabled>Assign Dept ↓</option>
                      <option value="MCD" style={{background:'#111', color:'#fff'}}>MCD</option>
                      <option value="PWD" style={{background:'#111', color:'#fff'}}>PWD (Roads)</option>
                      <option value="Delhi Jal Board" style={{background:'#111', color:'#fff'}}>Delhi Jal Board</option>
                      <option value="BSES" style={{background:'#111', color:'#fff'}}>BSES (Electricity)</option>
                      <option value="DDA" style={{background:'#111', color:'#fff'}}>DDA</option>
                    </select>
                  )}
                  {c.status === 'Assigned' && (
                    <button onClick={() => updateStatus(c.id, 'Resolved')} style={{
                      flex: 1, padding: '7px 10px', borderRadius: 10, cursor: 'pointer',
                      background: 'rgba(48,209,88,0.12)', border: '1px solid rgba(48,209,88,0.3)',
                      color: '#30D158', fontSize: 9, fontWeight: 900,
                      letterSpacing: '0.2em', textTransform: 'uppercase',
                    }}>Mark Resolved</button>
                  )}
                  {c.status === 'Resolved' && (
                    <div style={{
                      flex: 1, padding: '7px 10px', borderRadius: 10,
                      background: 'rgba(48,209,88,0.06)', border: '1px solid rgba(48,209,88,0.15)',
                      color: 'rgba(48,209,88,0.5)', fontSize: 9, fontWeight: 900,
                      letterSpacing: '0.2em', textTransform: 'uppercase', textAlign: 'center',
                    }}>✓ Resolved</div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Visualization Component
// ─────────────────────────────────────────────────────────────
function Visualization() {
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────
  const [level,    setLevel]    = useState(1);  // 1=Zones 2=Clusters 3=Booths 4=Categories
  const [zone,     setZone]     = useState(null);
  const [cluster,  setCluster]  = useState(null);
  const [booth,    setBooth]    = useState(null);

  const [nodes,    setNodes]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [active,   setActive]   = useState(null);  // currently highlighted node id

  const [panelOpen,     setPanelOpen]     = useState(false);
  const [panelCategory, setPanelCategory] = useState(null);

  // Auth guard
  useEffect(() => {
    if (localStorage.getItem('adminAuth') !== 'true') navigate('/admin');
  }, [navigate]);

  // ── Fetch graph data on level/parent change ──────────────
  useEffect(() => {
    const endpoints = {
      1: 'http://localhost:5000/api/viz/4d/zones',
      2: `http://localhost:5000/api/viz/4d/clusters/${encodeURIComponent(zone || '')}`,
      3: `http://localhost:5000/api/viz/4d/booths/${encodeURIComponent(cluster || '')}`,
      4: `http://localhost:5000/api/viz/4d/problems/${encodeURIComponent(booth || '')}`,
    };
    const url = endpoints[level];
    if (!url || (level === 2 && !zone) || (level === 3 && !cluster) || (level === 4 && !booth)) return;

    setLoading(true);
    setActive(null);
    setPanelOpen(false);

    axios.get(url)
      .then(r => {
        const raw = Array.isArray(r.data) ? r.data : [];
        // Layout: Level 3 (Booths) = FLAT 2D wheel like the screenshot
        //         All other levels  = 3D spherical
        const mapped = raw.map((d, i) => {
          const total = raw.length;
          let pos;

          if (level === 3) {
            // Flat XY — 3 concentric rings packed tighter to fit screen without zooming
            const angle   = (i / total) * Math.PI * 2;
            const ringIdx  = i % 3;  // 0, 1, 2
            
            // Much smaller base radius so the graph is compact
            const rBase    = Math.max(28, total * 1.0);
            
            // Tighter gap between the 3 rings (12 units instead of 18)
            const radii    = [rBase, rBase + 12, rBase + 24];
            const radius   = radii[ringIdx];
            
            // Interleave the nodes so labels don't crash
            const angleOff = [0, Math.PI / total, -Math.PI / total][ringIdx];
            const a = angle + angleOff;
            
            pos = [Math.cos(a) * radius, Math.sin(a) * radius, 0];
          } else {
            // 3D spherical golden-ratio spiral
            const minRadius = Math.max(28, total * (level >= 4 ? 3.8 : 3.0));
            const phi   = Math.acos(1 - (2 * (i + 0.5)) / total);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            const shell = i % 3 === 0 ? 0 : i % 3 === 1 ? 8 : -8;
            const radius = minRadius + shell;
            pos = [
              radius * Math.sin(phi) * Math.cos(theta),
              radius * Math.sin(phi) * Math.sin(theta),
              radius * Math.cos(phi),
            ];
          }

          return {
            _id: d._id || d.id,
            count: d.count || 0,
            unresolved: d.unresolved_count || 0,
            pos,
          };
        });
        setNodes(mapped);
        setLoading(false);
      })
      .catch(err => {
        console.error('Graph fetch error:', err);
        setNodes([]);
        setLoading(false);
      });
  }, [level, zone, cluster, booth]);

  // ── Single-click node handler ─────────────────────────────
  const handleClick = (node) => {
    const id = node._id;
    if (level === 1) { setZone(id);    setLevel(2); }
    else if (level === 2) { setCluster(id); setLevel(3); }
    else if (level === 3) { setBooth(id);   setLevel(4); }
    else if (level === 4) {
      // Open left panel with complaints for this category
      setActive(id);
      setPanelCategory(id);
      setPanelOpen(true);
    }
  };

  const handleBack = () => {
    setPanelOpen(false);
    setActive(null);
    if      (level === 4) { setBooth(null);   setLevel(3); }
    else if (level === 3) { setCluster(null); setLevel(2); }
    else if (level === 2) { setZone(null);    setLevel(1); }
  };

  const handleReset = () => {
    setLevel(1); setZone(null); setCluster(null); setBooth(null);
    setActive(null); setPanelOpen(false);
  };

  // ── Breadcrumb labels ─────────────────────────────────────
  const levelTitles = ['', 'DELHI ZONES', 'CLUSTERS', 'BOOTHS', 'CATEGORIES'];
  const hintTexts   = ['', 'Click a Zone', 'Click a Cluster', 'Click a Booth', 'Click a Category'];

  const crumbs = [];
  crumbs.push({ label: 'Delhi', active: level === 1 });
  if (zone)    crumbs.push({ label: shortLabel(zone),    active: level === 2 });
  if (cluster) crumbs.push({ label: shortLabel(cluster), active: level === 3 });
  if (booth)   crumbs.push({ label: `Booth ${shortLabel(booth)}`, active: level === 4 });

  // ── Center hub label ──────────────────────────────────────
  const hubLabel =
    level === 1 ? 'DELHI' :
    level === 2 ? `ZONE: ${shortLabel(zone)}` :
    level === 3 ? `CLUSTER: ${shortLabel(cluster)}` :
                  `BOOTH: ${shortLabel(booth)}`;

  return (
    <VizErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden',
        position: 'relative', background: '#090910' }}>

        {/* ── 3D Canvas ── */}
        <Canvas camera={{ position: [40, 25, 70], fov: 55 }}>
          <color attach="background" args={['#090910']} />
          <ambientLight intensity={0.4} />
          <pointLight position={[0, 0, 60]}  intensity={2.5} color="#0A84FF" />
          <pointLight position={[40, 40, 30]} intensity={1.2} color="#BF5AF2" />
          <pointLight position={[-40,-40,30]} intensity={0.8} color="#FF453A" />

          {/* 3D — rotate, zoom, pan. NO auto-rotate. */}
          <OrbitControls
            enableRotate
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.6}
            zoomSpeed={0.8}
          />

          <Stars />

          {/* Central hub */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[2.2, 48, 48]} />
            <meshStandardMaterial color="#0A84FF" emissive="#0A84FF" emissiveIntensity={5} />
          </mesh>
          <Html position={[0, -4.5, 0]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
            <div style={{ padding: '5px 18px', borderRadius: 999, whiteSpace: 'nowrap',
              background: 'rgba(10,132,255,0.12)', border: '1px solid rgba(10,132,255,0.4)',
              backdropFilter: 'blur(10px)' }}>
              <span style={{ color: '#0A84FF', fontSize: 9, fontWeight: 900,
                letterSpacing: '0.35em', textTransform: 'uppercase' }}>
                {hubLabel}
              </span>
            </div>
          </Html>

          {/* Nodes */}
          {nodes.map(n => (
            <GNode key={n._id} node={n} level={level}
              onClick={handleClick} isActive={active === n._id} />
          ))}
        </Canvas>

        {/* ── TOP-LEFT HUD (below navbar) ── */}
        <div style={{ position: 'absolute', top: 104, left: 20, zIndex: 50,
          display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>›</span>}
                <span style={{
                  padding: '3px 12px', borderRadius: 999, fontSize: 9, fontWeight: 900,
                  letterSpacing: '0.2em', textTransform: 'uppercase',
                  background: c.active ? 'rgba(10,132,255,0.18)' : 'rgba(255,255,255,0.05)',
                  border: c.active ? '1px solid rgba(10,132,255,0.45)' : '1px solid rgba(255,255,255,0.08)',
                  color: c.active ? '#0A84FF' : 'rgba(255,255,255,0.35)',
                }}>
                  {c.label}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleReset} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '7px 16px',
              borderRadius: 12, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)', color: '#fff',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.15em',
              textTransform: 'uppercase', cursor: 'pointer', backdropFilter: 'blur(16px)',
            }}>
              <LayoutDashboard size={13} style={{ color: '#0A84FF' }} /> Reset
            </button>
            {level > 1 && (
              <button onClick={handleBack} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '7px 16px',
                borderRadius: 12, background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)', color: '#fff',
                fontSize: 10, fontWeight: 800, letterSpacing: '0.15em',
                textTransform: 'uppercase', cursor: 'pointer', backdropFilter: 'blur(16px)',
              }}>
                <ChevronLeft size={13} style={{ color: '#0A84FF' }} /> Back
              </button>
            )}
          </div>

          {/* Info card */}
          <div style={{
            padding: '14px 18px', borderRadius: 18,
            background: 'rgba(9,9,18,0.75)', border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(24px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <Activity size={10} style={{ color: '#0A84FF' }} />
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 900,
                letterSpacing: '0.35em', textTransform: 'uppercase' }}>Matrix Level</span>
            </div>
            <div style={{ color: '#fff', fontSize: 26, fontWeight: 900,
              fontStyle: 'italic', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {levelTitles[level]}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11,
              fontWeight: 700, marginTop: 5 }}>
              {nodes.length} nodes  •  {hintTexts[level]} to go deeper
            </div>
          </div>
        </div>

        {/* ── TOP-RIGHT tier guide ── */}
        <div style={{
          position: 'absolute', top: 104, right: 20, zIndex: 50,
          padding: '14px 18px', borderRadius: 18,
          background: 'rgba(9,9,18,0.75)', border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(24px)', display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {[['1','ZONES'],['2','CLUSTERS'],['3','BOOTHS'],['4','CATEGORIES']].map(([t, l]) => {
            const done = Number(t) <= level;
            return (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 7, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: done ? 'rgba(10,132,255,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${done ? 'rgba(10,132,255,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: done ? '#0A84FF' : 'rgba(255,255,255,0.2)',
                  fontSize: 9, fontWeight: 900,
                }}>{t}</div>
                <span style={{ color: done ? '#fff' : 'rgba(255,255,255,0.2)', fontSize: 10,
                  fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{l}</span>
              </div>
            );
          })}
        </div>

        {/* ── Loading Overlay ── */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'absolute', inset: 0, zIndex: 100,
                background: 'rgba(9,9,16,0.7)', backdropFilter: 'blur(20px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 16,
              }}>
              <div style={{ width: 44, height: 44, border: '3px solid rgba(10,132,255,0.2)',
                borderTopColor: '#0A84FF', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900,
                letterSpacing: '0.35em', textTransform: 'uppercase' }}>
                Loading {levelTitles[level]}…
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Left Problems Panel (slides in from left when category clicked) ── */}
        <AnimatePresence>
          {panelOpen && panelCategory && (
            <ProblemsPanel
              booth={booth}
              category={panelCategory}
              onClose={() => { setPanelOpen(false); setActive(null); }}
            />
          )}
        </AnimatePresence>

        {/* ── Bottom status bar ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 38,
          background: 'rgba(9,9,16,0.85)', backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.05)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span style={{ color: '#0A84FF', fontSize: 10, fontWeight: 800,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 5 }}>
              <Activity size={10} /> System: Optimal
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Level {level} • {nodes.length} Nodes
            </span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            India Innovates Civic Matrix
          </span>
        </div>
      </div>
    </VizErrorBoundary>
  );
}

export default Visualization;
