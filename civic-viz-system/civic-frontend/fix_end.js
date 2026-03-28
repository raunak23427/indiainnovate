const fs = require('fs');
let code = fs.readFileSync('src/pages/Visualization.jsx', 'utf8');

const startIdx = code.indexOf('{showDetailPanel && (');
const endComponentIdx = code.indexOf('\n// ─── Main Visualization Component', startIdx);

if (startIdx !== -1 && endComponentIdx !== -1) {
    const newPanel = `{showDetailPanel && (
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
    code = code.substring(0, startIdx) + newPanel + code.substring(endComponentIdx);
    fs.writeFileSync('src/pages/Visualization.jsx', code);
    console.log('Fixed component brackets perfectly!');
} else {
    console.log('Indices not found!', startIdx, endComponentIdx);
}
