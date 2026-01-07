const fs = require('fs');
const path = require('path');

const electronDist = path.join(__dirname, '..', 'dist-electron');
if (!fs.existsSync(electronDist)) {
  fs.mkdirSync(electronDist, { recursive: true });
}
