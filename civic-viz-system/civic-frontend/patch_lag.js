const fs = require('fs');
let code = fs.readFileSync('src/pages/Visualization.jsx', 'utf8');

// 1. Add hovered state
if (!code.includes('const [hoveredNode, setHoveredNode]')) {
  code = code.replace(
    'const [selectedNode, setSelectedNode] = useState(null);',
    'const [selectedNode, setSelectedNode] = useState(null);\n  const [hoveredNode, setHoveredNode] = useState(null);'
  );
}

// 2. Add Drei Text Import
if (!code.includes('Text } from \'@react-three/drei\'')) {
  code = code.replace(
    /Html } from '@react-three\/drei';/,
    "Html, Text } from '@react-three/drei';"
  );
}

// 3. Update the mesh mapping
const meshStart = "<mesh onClick={() => {";
const meshEnd = "</Html>\n                </mesh>";

if (code.includes(meshStart)) {
  const replacement = `<mesh 
                  onClick={() => {
                    if (level === 4) setActiveCat(isActive ? null : n.id);
                    else setSelectedNode(isActive ? null : n);
                  }}
                  onPointerOver={(e) => { e.stopPropagation(); setHoveredNode(n.id); document.body.style.cursor='pointer'; }}
                  onPointerOut={(e) => { setHoveredNode(null); document.body.style.cursor='auto'; }}
                >
                  <sphereGeometry args={[isActive ? 1.5 : 1, 32, 32]} />
                  <meshStandardMaterial 
                    color={n.color} 
                    emissive={n.color} 
                    emissiveIntensity={isActive ? 1.5 : 0.8} 
                    roughness={0.2} 
                    metalness={0.8} 
                  />
                  
                  {/* Native WebGL Text (Zero DOM Overhead) */}
                  {!isActive && (
                    <Text position={[0, 1.8, 0]} fontSize={0.6} color="white" outlineWidth={0.05} outlineColor="black" anchorX="center" anchorY="middle">
                      {level === 4 ? n.id : String(n.id).substring(0,14)}
                    </Text>
                  )}

                  {/* Heavy DOM Portal (Occlusion Culled: ONLY renders when active/hovered) */}
                  {(isActive || hoveredNode === n.id) && (
                    <Html distanceFactor={14} center zIndexRange={[20,50]}>
                      <div style={{ marginTop:isActive?'58px':'48px', cursor:'pointer' }} onClick={(e)=>{ 
                        e.stopPropagation();
                        if (level === 4) setActiveCat(isActive ? null : n.id);
                        else setSelectedNode(isActive ? null : n);
                      }}>
                        <div style={{ background:'rgba(0,0,0,0.88)', border:\`1px solid \${n.color}55\`, borderRadius:'12px', padding:'10px 16px', textAlign:'center', boxShadow:\`0 0 18px \${n.color}40\`, minWidth:'100px', backdropFilter:'blur(8px)' }}>
                          <div style={{ fontSize:'12px', fontWeight:900, letterSpacing:'0.1em', textTransform:'uppercase', color:'#fff', fontFamily:'monospace' }}>
                            {n.id}
                          </div>
                          {level !== 4 && (
                            <div style={{ fontSize:'16px', fontWeight:900, color:n.color, marginTop:'4px', fontFamily:'monospace' }}>
                              {n.unresolvedCount || n.unresolved_count || n.count} Cases
                            </div>
                          )}
                          <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:'4px' }}>
                            {isActive ? 'SELECTED' : 'Click to Drill'}
                          </div>
                        </div>
                      </div>
                    </Html>
                  )}
                </mesh>`;
  
  const startIdx = code.indexOf(meshStart);
  let endIdx = code.indexOf(meshEnd, startIdx);
  if (endIdx !== -1) {
    code = code.substring(0, startIdx) + replacement + code.substring(endIdx + meshEnd.length);
    fs.writeFileSync('src/pages/Visualization.jsx', code);
    console.log('Optimized HTML portals via dynamic occlusion!');
  } else {
    console.log('Could not parse end boundary for mesh');
  }
} else {
  console.log('Could not find mesh injection boundary');
}
