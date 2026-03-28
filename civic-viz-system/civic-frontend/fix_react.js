const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'pages', 'Visualization.jsx');
let content = fs.readFileSync(file, 'utf8');
content = content.split('\\n').join('\n');
fs.writeFileSync(file, content);
console.log('Fixed Visualization.jsx!');
