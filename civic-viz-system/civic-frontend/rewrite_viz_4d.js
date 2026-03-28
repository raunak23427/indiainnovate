const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'pages', 'Visualization.jsx');
let content = fs.readFileSync(file, 'utf8');

const marker = "// ─── 3D Orbital Engine";
const splitIdx = content.indexOf(marker);
if (splitIdx === -1) throw new Error("Marker not found!");

const headerCode = content.substring(0, splitIdx);

const newCode = `// ─── 3D Orbital Engine ────────────────────────────────────────────────────────
const OrbitalGalaxy = ({ 
  level, 
  data, 
  centerLabel, 
  onNodeClick, 
  activeCat,
  setActiveCat,
  selectedNode,
  setSelectedNode,
  handleSingleUpdate,
  handleBulkAssign
}) => {
  const [selectedClaims, setSelectedClaims] = useState(new Set());
  const [bulkDepartment, setBulkDepartment] = useState('');
  const [loadingBulk, setLoadingBulk] = useState(false);

  useEffect(() => {
    setSelectedClaims(new Set());
    setBulkDepartment('');
  }, [activeCat, selectedNode]);

  let renderNodes = [];
  let activeClaims = [];

  // Level 1: Zones, Level 2: Clusters, Level 3: Booths
  if (level === 1 || level === 2 || level === 3) {
    renderNodes = data.map(d => ({
      id: d._id || d.id,
      count: d.count || 0,
      unresolvedCount: d.unresolved_count || 0,
      color: level === 1 ? getCatColorLevel1(d.unresolved_count || 0) : getCatColorLevel2(d.unresolved_count || 0)
    }));
  } else if (level === 4) {
    const grouped = data.reduce((acc, curr) => {
      if (!acc[curr.category]) acc[curr.category] = [];
      acc[curr.category].push(curr);
      return acc;
    }, {});
    
    renderNodes = Object.keys(grouped).map(cat => {
      const claims = grouped[cat];
      const unresolvedCount = claims.filter(c => c.final_status !== 'Resolved' && c.status !== 'Resolved').length;
      return {
        id: cat,
        count: claims.length,
        unresolvedCount,
        color: getCatColorLevel3(claims)
      };
    });
    
    if (activeCat && grouped[activeCat]) {
      activeClaims = grouped[activeCat];
    }
  }

  function getCatColorLevel1(unresolved) {
    if (unresolved >= 150) return '#ff003c';   
    if (unresolved >= 50) return '#ff7b00';    
    if (unresolved >= 15) return '#ffb300';    
    if (unresolved > 0) return '#00f2ff';     
    return '#1a3a1a'; 
  }
  
  function getCatColorLevel2(unresolved) {
    if (unresolved >= 30) return '#ff003c';   
    if (unresolved >= 10) return '#ff7b00';    
    if (unresolved >= 3) return '#ffb300';    
    if (unresolved > 0) return '#bc13fe';     
    return '#1a3a1a'; 
  }

  function getCatColorLevel3(claims) {
    const unresolved = claims.filter(c => c.final_status !== 'Resolved' && c.status !== 'Resolved').length;
    if (unresolved >= 15) return '#ff003c';   
    if (unresolved >= 8) return '#ff7b00';    
    if (unresolved >= 4) return '#ffb300';    
    if (unresolved > 0) return '#bc13fe';     
    return '#1a3a1a'; 
  }

  const toggleSelection = (id) => {
    setSelectedClaims(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedClaims.size === activeClaims.length) setSelectedClaims(new Set());
    else setSelectedClaims(new Set(activeClaims.map(c => c._id || c.id)));
  };

  const handleBulk = async () => {
    if (selectedClaims.size === 0 || !bulkDepartment) return;
    setLoadingBulk(true);
    await handleBulkAssign(Array.from(selectedClaims), bulkDepartment);
    setSelectedClaims(new Set());
    setBulkDepartment('');
    setLoadingBulk(false);
  };

  const showDetailPanel = selectedNode || activeCat;

  return (
    <div className="flex-1 flex overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl glass mb-10 min-h-[700px]">
      {/* 3D Galaxy Canvas */}
      <div className={\`transition-all duration-700 ease-in-out \${showDetailPanel ? 'w-1/2' : 'w-full'}\`}>
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 12, 22]} fov={55} />
          <OrbitControls autoRotate={!showDetailPanel} autoRotateSpeed={0.8} maxDistance={45} minDistance={6} enableDamping dampingFactor={0.05} />
          <Stars radius={120} depth={60} count={5500} factor={4} saturation={0} fade speed={0.8} />
          
          <ambientLight intensity={0.15} />
          <pointLight position={[0, 20, 0]} intensity={3} color="#00f2ff" castShadow />
          <pointLight position={[10, -5, 10]} intensity={1} color="#bc13fe" />
          <pointLight position={[-10, -5, -10]} intensity={1} color="#00f2ff" />
          
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[1.8, 64, 64]} />
            <meshStandardMaterial color="#001020" emissive="#00f2ff" emissiveIntensity={1.2} roughness={0.1} metalness={0.8} />
            <Html distanceFactor={22} center zIndexRange={[10, 20]}>
              <div style={{ background:'rgba(0,0,0,0.85)', border:'1px solid rgba(0,242,255,0.4)', borderRadius:'999px', padding:'6px 18px', fontFamily:'monospace', fontWeight:900, fontSize:'11px', letterSpacing:'0.2em', color:'#00f2ff', whiteSpace:'nowrap', boxShadow:'0 0 30px rgba(0,242,255,0.5)', textTransform:'uppercase' }}>
                {centerLabel}
              </div>
            </Html>
          </mesh>
          
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[10, 0.025, 8, 120]} />
            <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={0.4} transparent opacity={0.2} />
          </mesh>
          
          {renderNodes.map((n, idx) => {
            const angle = (idx / renderNodes.length) * Math.PI * 2;
            const r = 10;
            const cx = Math.cos(angle) * r;
            const cz = Math.sin(angle) * r;
            const isActive = (level === 4 && activeCat === n.id) || (level !== 4 && selectedNode?.id === n.id);
            const nodeScale = 1.0; // Enforced uniform rigid node scale size
            
            return (
              <group key={n.id}>
                <Line points={[[0,0,0],[cx,0,cz]]} color={n.color} lineWidth={isActive ? 2.5 : 1} transparent opacity={isActive ? 0.8 : (n.unresolvedCount===0?0.08:0.35)} dashed={!isActive} dashSize={0.4} gapSize={0.3} />
                <mesh 
                  position={[cx,0,cz]} 
                  scale={nodeScale} 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (level === 4) setActiveCat(isActive ? null : n.id);
                    else setSelectedNode(isActive ? null : n);
                  }}
                  onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
                  onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'default'; }}
                >
                  <sphereGeometry args={[0.7,32,32]} />
                  <meshStandardMaterial color={n.unresolvedCount===0?'#0a2a0a':'#050510'} emissive={n.color} emissiveIntensity={isActive ? 6 : (n.unresolvedCount===0?0.1:2.5)} roughness={0.2} metalness={0.6} />
                  <Html distanceFactor={14} center zIndexRange={[20,50]}>
                    <div style={{ marginTop:isActive?'52px':'44px', cursor:'pointer' }} onClick={(e)=>{ 
                      e.stopPropagation();
                      if (level === 4) setActiveCat(isActive ? null : n.id);
                      else setSelectedNode(isActive ? null : n);
                    }}>
                      <div style={{ background:'rgba(0,0,0,0.88)', border:\`1px solid \${n.color}55\`, borderRadius:'12px', padding:'6px 12px', textAlign:'center', boxShadow:\`0 0 18px \${n.color}40\`, minWidth:'80px', backdropFilter:'blur(8px)' }}>
                        <div style={{ fontSize:'9px', fontWeight:900, letterSpacing:'0.15em', textTransform:'uppercase', color:'#fff', fontFamily:'monospace' }}>
                          {level === 4 ? n.id : n.id.substring(0,14)}
                        </div>
                        <div style={{ fontSize:'13px', fontWeight:900, color:n.color, marginTop:'2px', fontFamily:'monospace' }}>{n.unresolvedCount}</div>
                        <div style={{ fontSize:'7px', color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em', textTransform:'uppercase' }}>active</div>
                      </div>
                    </div>
                  </Html>
                </mesh>
              </group>
            );
          })}
        </Canvas>
      </div>

      {showDetailPanel && (
        <div className="w-1/2 flex flex-col border-l border-white/5 bg-[#050508]/80 animate-in slide-in-from-right duration-300">
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">
                {level === 1 ? 'Zonal Lens' : level === 2 ? 'Cluster Lens' : level === 3 ? 'Booth Scope' : 'Target Category'}
              </div>
              <div className="text-3xl font-black uppercase italic tracking-tighter text-white">
                {level === 4 ? activeCat : selectedNode?.id}
              </div>
              {level !== 4 && selectedNode && (
                <div className="text-sm font-bold text-cyber-blue mt-2">
                  Impact: {selectedNode.count} Cases
                </div>
              )}
            </div>
            <button 
              onClick={() => {
                if (level === 4) setActiveCat(null);
                else setSelectedNode(null);
              }} 
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition text-slate-400 group"
            >
              <XCircle size={18} className="group-hover:text-white transition" />
            </button>
          </div>

          {level !== 4 ? (
             <div className="flex-1 p-8 flex flex-col justify-center items-center text-center space-y-6">
                <div className="w-24 h-24 rounded-full border-2 border-cyber-blue/30 flex items-center justify-center bg-cyber-blue/5">
                   <Network size={36} className="text-cyber-blue" />
                </div>
                <p className="text-slate-400 text-sm max-w-[70%] leading-relaxed">
                  Proceed with deep dive to access all constituent nodes bounded to this region.
                </p>
                <button
                  onClick={() => onNodeClick(selectedNode)}
                  className="w-full max-w-sm cyber-button bg-white text-black py-4 rounded-xl font-black uppercase italic tracking-widest text-sm hover:invert transition-all flex items-center justify-center gap-3 mt-4"
                >
                  <Zap size={18} /> Initialize Deep Dive
                </button>
             </div>
          ) : (
            <>
              {/* Bulk Action Bar */}
              <div className="px-8 py-4 bg-white/5 border-b border-white/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input type="checkbox"
                      checked={selectedClaims.size === activeClaims.length && activeClaims.length > 0}
                      onChange={selectAll}
                      className="w-4 h-4 rounded border-white/20 bg-black/50 text-cyber-blue cursor-pointer" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{selectedClaims.size} Selected</span>
                  </div>
                  <div className="flex gap-2">
                    <select value={bulkDepartment} onChange={e => setBulkDepartment(e.target.value)}
                      className="bg-black/50 border border-white/10 rounded-lg text-xs p-2 text-white outline-none">
                      <option value="">Assign Dept...</option>
                      <option value="Jal Board">Jal Board</option>
                      <option value="Power Department">Power Dept</option>
                      <option value="Municipal Corporation">MCD</option>
                                            <option value="Public Works Department (PWD)">PWD</option>
                      <option value="Sewerage Department">Sewerage Dept</option>
                      <option value="Electricity Department">Electricity Dept</option>
                      <option value="Police Department">Police</option>
                    </select>
                    <button onClick={handleBulk}
                      disabled={loadingBulk || !bulkDepartment || selectedClaims.size === 0}
                      className="px-4 py-2 bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-cyber-blue hover:text-black transition-colors disabled:opacity-50">
                      {loadingBulk ? '...' : 'Apply'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Complaints */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
                {activeClaims.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs italic mt-10">No active complaints found.</div>
                ) : (
                  activeClaims.map((c, i) => (
                    <ComplaintAdminCard
                      key={c._id || c.id || i}
                      c={c}
                      isSelected={selectedClaims.has(c._id || c.id)}
                      toggleSelection={toggleSelection}
                      onUpdate={handleSingleUpdate}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Visualization Component ─────────────────────────────────────────────
function Visualization() {
  const navigate = useNavigate();
  // 4-Tier Hierarchy: 1=Zone, 2=Cluster(ac_name), 3=Booth, 4=Category
  const [level, setLevel] = useState(1);
  const [currentZone, setCurrentZone] = useState(null);
  const [currentCluster, setCurrentCluster] = useState(null);
  const [currentBooth, setCurrentBooth] = useState(null);
  const [data, setData] = useState([]);
  
  const [activeCat, setActiveCat] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (localStorage.getItem('adminAuth') !== 'true') {
      navigate('/admin');
      return;
    }
    loadData();
  }, [level, currentZone, currentCluster, currentBooth, navigate]);

  const loadData = async () => {
    try {
      let endpoint = '';
      if (level === 1) endpoint = 'http://localhost:5000/api/viz/4d/zones';
      else if (level === 2) endpoint = \`http://localhost:5000/api/viz/4d/clusters/\${encodeURIComponent(currentZone)}\`;
      else if (level === 3) endpoint = \`http://localhost:5000/api/viz/4d/booths/\${encodeURIComponent(currentCluster)}\`;
      else if (level === 4) endpoint = \`http://localhost:5000/api/viz/4d/problems/\${encodeURIComponent(currentBooth)}\`;
      
      if (!endpoint) return;

      const resp = await axios.get(endpoint);
      let mappedData = resp.data.map(d => ({ ...d, id: d._id || d.id, count: d.count || 0 }));
      
      if (level !== 4) {
        mappedData = mappedData.filter(d => (d.unresolved_count || 0) > 0);
      } else {
        mappedData = mappedData.filter(d => d.final_status !== 'Resolved' && d.status !== 'Resolved');
      }
      
      setData(mappedData);
    } catch (err) { console.error(err); }
  };

  const handleDrillDown = useCallback((node) => {
    if (level === 1) {
      setCurrentZone(node.id);
      setLevel(2);
    } else if (level === 2) {
      setCurrentCluster(node.id);
      setLevel(3);
    } else if (level === 3) {
      setCurrentBooth(node.id);
      setLevel(4);
    }
    setSelectedNode(null);
    setActiveCat(null);
  }, [level]);

  const handleGoBack = () => {
    setLevel(Math.max(1, level - 1));
    setSelectedNode(null);
    setActiveCat(null);
  };

  const handleSingleUpdate = (id, updates) => {
    setData(prev => prev.map(c => (c._id || c.id) === id ? { ...c, ...updates } : c));
  };

  const handleBulkAssign = async (ids, assigned_department) => {
    try {
      await axios.put('http://localhost:5000/api/admin/complaints/bulk-assign', {
        complaint_ids: ids,
        assigned_department
      });
      setData(prev => prev.map(c =>
        ids.includes(c._id || c.id)
          ? { ...c, status: 'Assigned', assigned_department, assigned_at: new Date().toISOString() }
          : c
      ));
    } catch (err) { console.error(err); }
  };

  const getLensText = () => {
    if (level === 1) return 'Zonal Matrix Lens';
    if (level === 2) return 'Constituency Cluster Scope';
    if (level === 3) return 'Booth Isolation Scope';
    return 'Category Diagnostic';
  };

  const getCenterLabel = () => {
    if (level === 1) return "DELHI METRO REGION";
    if (level === 2) return \`\${currentZone}\`;
    if (level === 3) return \`CLUSTER \${currentCluster}\`;
    if (level === 4) return \`BOOTH \${currentBooth}\`;
    return "";
  };

  return (
    <div className="relative animate-in fade-in duration-1000">
      <div className="flex flex-col lg:flex-row gap-8 mb-6 mt-6 items-center">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2 opacity-50">
            <Layers size={14} className="text-cyber-blue" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">
              {getLensText()}
            </span>
          </div>
          <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none">
            {level === 1 && (<>Global <span className="text-cyber-blue">Zones</span> Matrix</>)}
            {level === 2 && (<>Zone <span className="text-cyber-blue">{currentZone}</span></>)}
            {level === 3 && (<>Cluster <span className="text-cyber-purple">{currentCluster}</span></>)}
            {level === 4 && (<>Booth <span className="text-cyber-green">{currentBooth}</span> Diagnostics</>)}
          </h2>
        </div>

        <div className="flex gap-4 items-center">
          {level > 1 && (
            <button onClick={handleGoBack} className="glass p-4 rounded-xl border border-white/10 hover:bg-white/5 transition flex items-center gap-3 group">
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition" />
              <span className="text-xs font-black uppercase italic tracking-widest">Step Back</span>
            </button>
          )}
        </div>
      </div>

      <OrbitalGalaxy 
        level={level}
        data={data}
        centerLabel={getCenterLabel()}
        onNodeClick={handleDrillDown}
        activeCat={activeCat}
        setActiveCat={setActiveCat}
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
        handleSingleUpdate={handleSingleUpdate}
        handleBulkAssign={handleBulkAssign}
      />
    </div>
  );
}

export default Visualization;
`;

fs.writeFileSync(file, headerCode + newCode);
console.log('Successfully applied 4D integration!');
