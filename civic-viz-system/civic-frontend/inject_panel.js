const fs = require('fs');
let code = fs.readFileSync('src/pages/Visualization.jsx', 'utf8');

if (!code.includes('import DeepAnalysisPanel')) {
  code = code.replace(
    "import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';",
    "import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';\nimport DeepAnalysisPanel from '../components/DeepAnalysisPanel';"
  );
}

// Safe splice of the layout
const startToken = '{showDetailPanel && (';
const endRegex = /        <\/div>\s*\}\)\}\s*<\/div>\s*\);\s*\}\s*$/;
const endMatch = code.match(endRegex);

if (code.includes(startToken) && endMatch) {
  const startIdx = code.indexOf(startToken);
  const endIdx = endMatch.index;
  const replacement = `{showDetailPanel && (
        <DeepAnalysisPanel 
           level={level} 
           currentZone={currentZone} 
           currentCluster={currentCluster} 
           currentBooth={currentBooth} 
           onBulkAssign={handleBulkAssign} 
        />
      )}
`;
  code = code.substring(0, startIdx) + replacement + code.substring(endIdx + endMatch[0].length - 12);
  fs.writeFileSync('src/pages/Visualization.jsx', code);
  console.log('Successfully injected DeepAnalysisPanel!');
} else {
  console.log('Missing injection tokens', !!code.includes(startToken), !!endMatch);
}
