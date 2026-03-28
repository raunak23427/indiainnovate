const fs = require('fs');
let code = fs.readFileSync('src/pages/Visualization.jsx', 'utf8');

// 1. Inject hoveredNode hook
if (!code.includes('const [hoveredNode, setHoveredNode] = useState(null);')) {
    code = code.replace(
        'const [selectedClaims, setSelectedClaims] = useState(new Set());',
        'const [selectedClaims, setSelectedClaims] = useState(new Set());\n  const [hoveredNode, setHoveredNode] = useState(null);'
    );
}

// 2. Fix the String literal crash
code = code.replace(/n\.id\.substring/g, 'String(n.id).substring');

// 3. Inject DeepAnalysisPanel replacing legacy panel
const panelStartStr = '{showDetailPanel && (';
// Find panelStartStr that is AFTER Canvas is closed
const canvasEnd = code.indexOf('</Canvas>');
let panelStartIdx = -1;
if (canvasEnd !== -1) {
    panelStartIdx = code.indexOf(panelStartStr, canvasEnd);
}

if (panelStartIdx !== -1) {
    // Find the exact closing brace for OrbitalGalaxy
    const componentEndMatch = code.match(/<\/div>\s*\r?\n\s*\);\s*\r?\n\};/);
    if (componentEndMatch && componentEndMatch.index > panelStartIdx) {
        const replacement = `{showDetailPanel && (
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
};`;
        code = code.substring(0, panelStartIdx) + replacement + code.substring(componentEndMatch.index + componentEndMatch[0].length);
        console.log("DeepAnalysisPanel injected successfully!");
    } else {
        console.log("Could not find component end closure!");
    }
} else {
    console.log("Could not find panel injection start idx!");
}

fs.writeFileSync('src/pages/Visualization.jsx', code);
