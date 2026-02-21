const fs = require('fs');
const path = 'app/src/pages/HomestayDetail.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/captionLayout="dropdown-buttons"/g, 'captionLayout="dropdown"');
fs.writeFileSync(path, content);
console.log('Fixed!');