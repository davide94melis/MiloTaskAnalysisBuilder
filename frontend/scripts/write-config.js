const fs = require('node:fs');
const path = require('node:path');

const publicDir = path.join(__dirname, '..', 'public');
const configPath = path.join(publicDir, 'config.json');

const config = {
  apiUrl: process.env.API_URL || 'http://localhost:8080/api',
  miloApiUrl: process.env.MILO_API_URL || process.env.API_URL || 'http://localhost:8081/api'
};

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

console.log(`Wrote ${configPath}`);
