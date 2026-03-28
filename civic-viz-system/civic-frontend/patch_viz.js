const fs = require('fs');
const file = 'src/pages/Visualization.jsx';
let c = fs.readFileSync(file, 'utf8');

let count = 0;
// Disable Rotation
if (c.includes('autoRotate={!showDetailPanel}')) {
  c = c.replace(
    '<OrbitControls autoRotate={!showDetailPanel} autoRotateSpeed={0.8} maxDistance={45} minDistance={6} enableDamping dampingFactor={0.05} />',
    '<OrbitControls autoRotate={false} maxDistance={150} minDistance={6} enableDamping dampingFactor={0.05} />'
  );
  count++;
}

// Dynamic Torus Ring
if (c.includes('<torusGeometry args={[10, 0.025, 8, 120]} />')) {
  c = c.replace(
    '<torusGeometry args={[10, 0.025, 8, 120]} />',
    '<torusGeometry args={[Math.max(10, renderNodes.length * 0.4), 0.025, 8, 120]} />'
  );
  count++;
}

// Dynamic Node Distance
if (c.includes('const r = 10;')) {
  c = c.replace(
    'const r = 10;',
    'const r = Math.max(10, renderNodes.length * 0.4);'
  );
  count++;
}

fs.writeFileSync(file, c);
console.log('Patched ' + count + ' graph properties successfully!');
