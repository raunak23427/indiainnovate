const fs = require('fs');
let code = fs.readFileSync('src/pages/Visualization.jsx', 'utf8');

// 1. Fix the mesh array and backslash issue
code = code.replace(/<mesh\s*\r?\n\s*position=\{\[cx,0,cz\]\}[\s\S]*?<\/mesh>/m, `                <mesh 
                  position={[cx,0,cz]} 
                  scale={nodeScale} 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (level === 4) setActiveCat(isActive ? null : n.id);
                    else setSelectedNode(isActive ? null : n);
                  }}
                  onPointerOver={(e) => { e.stopPropagation(); setHoveredNode(n.id); document.body.style.cursor = 'pointer'; }}
                  onPointerOut={(e) => { e.stopPropagation(); setHoveredNode(null); document.body.style.cursor = 'default'; }}
                >
                  <sphereGeometry args={[isActive ? 1.0 : 0.7, 32, 32]} />
                  <meshStandardMaterial color={n.unresolvedCount===0?'#0a2a0a':'#050510'} emissive={n.color} emissiveIntensity={isActive ? 6 : (n.unresolvedCount===0?0.1:2.5)} roughness={0.2} metalness={0.6} />
                  
                  {/* Lightweight WebGL Text Rendering */}
                  {!isActive && (
                    <Text position={[0, 1.8, 0]} fontSize={0.7} color="white" outlineWidth={0.05} outlineColor="black" anchorX="center" anchorY="middle">
                      {level === 4 ? n.id : String(n.id).substring(0,14)}
                    </Text>
                  )}

                  {/* Heavy DOM Portal (Occlusion Culled) */}
                  {(isActive || hoveredNode === n.id) && (
                    <Html distanceFactor={14} center zIndexRange={[20,50]}>
                      <div style={{ marginTop:isActive?'52px':'44px', cursor:'pointer' }} onClick={(e)=>{ 
                        e.stopPropagation();
                        if (level === 4) setActiveCat(isActive ? null : n.id);
                        else setSelectedNode(isActive ? null : n);
                      }}>
                        <div style={{ background:'rgba(0,0,0,0.88)', border:'1px solid ' + n.color + '55', borderRadius:'12px', padding:'6px 12px', textAlign:'center', boxShadow:'0 0 18px ' + n.color + '40', minWidth:'80px', backdropFilter:'blur(8px)' }}>
                          <div style={{ fontSize:'9px', fontWeight:900, letterSpacing:'0.15em', textTransform:'uppercase', color:'#fff', fontFamily:'monospace' }}>
                            {level === 4 ? n.id : String(n.id).substring(0,14)}
                          </div>
                          <div style={{ fontSize:'13px', fontWeight:900, color:n.color, marginTop:'2px', fontFamily:'monospace' }}>{n.unresolvedCount || n.count || 0} active</div>
                        </div>
                      </div>
                    </Html>
                  )}
                </mesh>`);

// 2. Erase the old DetailPanel and replace entirely with DeepAnalysisPanel.
const startPanelIdx = code.indexOf('{showDetailPanel && (');
const endPanelMatch = code.match(/ {6}<\/div>\s*\r?\n {4}\)\}\s*\r?\n {2}<\/div>\s*\r?\n\s*\);\s*\r?\n\};\s*$/);

if (startPanelIdx !== -1 && endPanelMatch) {
  const panelReplacement = `{showDetailPanel && (
        <DeepAnalysisPanel 
           level={level} 
           currentZone={currentZone} 
           currentCluster={currentCluster} 
           currentBooth={currentBooth} 
           onBulkAssign={handleBulkAssign} 
        />
      )}`;
  code = code.substring(0, startPanelIdx) + panelReplacement + code.substring(endPanelMatch.index + 6);
} else {
  console.log("Could not find entire DetailPanel bounds. Attempting simple closure replacing.");
  // If the end match failed, we just replace everything after startPanelIdx
  const panelReplacement = `{showDetailPanel && (
        <DeepAnalysisPanel 
           level={level} 
           currentZone={currentZone} 
           currentCluster={currentCluster} 
           currentBooth={currentBooth} 
           onBulkAssign={handleBulkAssign} 
        />
      )}
    </div>
  );
};
export default Visualization;`;
  code = code.substring(0, startPanelIdx) + panelReplacement;
}

fs.writeFileSync('src/pages/Visualization.jsx', code);
console.log("AST Rewrite Successfully Complete.");
