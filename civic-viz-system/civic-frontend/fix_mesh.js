const fs = require('fs');
const lines = fs.readFileSync('src/pages/Visualization.jsx', 'utf8').split(/\r?\n/);

const newMeshLines = [
"                <mesh ",
"                  position={[cx,0,cz]} ",
"                  scale={nodeScale} ",
"                  onClick={(e) => { ",
"                    e.stopPropagation(); ",
"                    if (level === 4) setActiveCat(isActive ? null : n.id);",
"                    else setSelectedNode(isActive ? null : n);",
"                  }}",
"                  onPointerOver={(e) => { e.stopPropagation(); setHoveredNode(n.id); document.body.style.cursor = 'pointer'; }}",
"                  onPointerOut={(e) => { e.stopPropagation(); setHoveredNode(null); document.body.style.cursor = 'default'; }}",
"                >",
"                  <sphereGeometry args={[isActive ? 1.0 : 0.7, 32, 32]} />",
"                  <meshStandardMaterial color={n.unresolvedCount===0?'#0a2a0a':'#050510'} emissive={n.color} emissiveIntensity={isActive ? 6 : (n.unresolvedCount===0?0.1:2.5)} roughness={0.2} metalness={0.6} />",
"                  ",
"                  {/* Lightweight WebGL Text Rendering */}",
"                  {!isActive && (",
"                    <Text position={[0, 1.8, 0]} fontSize={0.7} color=\"white\" outlineWidth={0.05} outlineColor=\"black\" anchorX=\"center\" anchorY=\"middle\">",
"                      {level === 4 ? n.id : String(n.id).substring(0,14)}",
"                    </Text>",
"                  )}",
"",
"                  {/* Heavy DOM Portal (Occlusion Culled) */}",
"                  {(isActive || hoveredNode === n.id) && (",
"                    <Html distanceFactor={14} center zIndexRange={[20,50]}>",
"                      <div style={{ marginTop:isActive?'52px':'44px', cursor:'pointer' }} onClick={(e)=>{ ",
"                        e.stopPropagation();",
"                        if (level === 4) setActiveCat(isActive ? null : n.id);",
"                        else setSelectedNode(isActive ? null : n);",
"                      }}>",
"                        <div style={{ background:'rgba(0,0,0,0.88)', border:'1px solid ' + n.color + '55', borderRadius:'12px', padding:'6px 12px', textAlign:'center', boxShadow:'0 0 18px ' + n.color + '40', minWidth:'80px', backdropFilter:'blur(8px)' }}>",
"                          <div style={{ fontSize:'9px', fontWeight:900, letterSpacing:'0.15em', textTransform:'uppercase', color:'#fff', fontFamily:'monospace' }}>",
"                            {level === 4 ? n.id : String(n.id).substring(0,14)}",
"                          </div>",
"                          <div style={{ fontSize:'13px', fontWeight:900, color:n.color, marginTop:'2px', fontFamily:'monospace' }}>{n.unresolvedCount || n.count} active</div>",
"                        </div>",
"                      </div>",
"                    </Html>",
"                  )}",
"                </mesh>"
];

// Splice lines 521 to 559 (0-indexed indices: 521 to 559 inclusive is 39 lines)
// Wait! Let's find exactly where <mesh and </mesh> are just to be safe.
let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('<mesh') && lines[i+1] && lines[i+1].includes('position={[cx,0,cz]}')) {
       startIdx = i;
   }
   if (startIdx !== -1 && i > startIdx && lines[i].includes('</mesh>')) {
       endIdx = i;
       break;
   }
}

if (startIdx !== -1 && endIdx !== -1) {
   lines.splice(startIdx, endIdx - startIdx + 1, ...newMeshLines);
   fs.writeFileSync('src/pages/Visualization.jsx', lines.join('\n'));
   console.log('Successfully injected mesh via Line Splicing!');
} else {
   console.log('Failed to find mesh bounds via lines array.');
}
