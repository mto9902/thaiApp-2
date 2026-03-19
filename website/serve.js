const http = require('http');
const fs = require('fs');
const path = require('path');
const port = 8090;
const root = 'C:/Users/Lux/thai-generator/thaiApp-2/website';
const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json',
};
http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  let fp = path.join(root, url === '/' ? '/index.html' : url);
  if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    let index = path.join(fp, 'index.html');
    if (fs.existsSync(index)) {
      fp = index;
    } else {
      res.writeHead(404);
      res.end('Not found: ' + url);
      return;
    }
  }
  const ext = path.extname(fp);
  res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
  fs.createReadStream(fp).pipe(res);
}).listen(port, () => console.log('Server on http://localhost:' + port));
