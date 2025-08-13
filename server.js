const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

const DATA_FILE = path.join(__dirname, 'data', 'pain_points.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.html': 'text/html',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function readPainPoints() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { sustainability: [], integrations: [] };
  }
}

function writePainPoints(content) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(content, null, 2));
}

function renderPainPointsPage(content) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pain Points</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
<nav>
  <a href="/pain-points">Pain Points</a> | <a href="/admin">Admin</a>
</nav>
<h1>Pain Points</h1>
<section>
  <h2>Sustainability Issues</h2>
  <ul>${content.sustainability.map(item => `<li>${item}</li>`).join('')}</ul>
</section>
<section>
  <h2>Third-Party Integrations</h2>
  <ul>${content.integrations.map(item => `<li>${item}</li>`).join('')}</ul>
</section>
</body>
</html>`;
}

function renderAdminPage(content) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Admin Panel</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
<nav>
  <a href="/pain-points">Pain Points</a> | <a href="/admin">Admin</a>
</nav>
<h1>Admin Panel</h1>
<form method="POST" action="/admin">
  <label>Sustainability Issues:<br>
    <textarea name="sustainability" rows="5" cols="40">${content.sustainability.join('\n')}</textarea>
  </label>
  <br><br>
  <label>Third-Party Integrations:<br>
    <textarea name="integrations" rows="5" cols="40">${content.integrations.join('\n')}</textarea>
  </label>
  <br><br>
  <button type="submit">Save</button>
</form>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // Serve static files from the public directory
  if (req.method === 'GET') {
    const safePath = path
      .normalize(parsedUrl.pathname)
      .replace(/^\/+/, '');
    const filePath = path.join(PUBLIC_DIR, safePath);
    if (
      filePath.startsWith(PUBLIC_DIR) &&
      fs.existsSync(filePath) &&
      fs.statSync(filePath).isFile()
    ) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(500);
          res.end('Server error');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(data);
        }
      });
      return;
    }
  }

  if (req.method === 'GET' && (parsedUrl.pathname === '/' || parsedUrl.pathname === '/pain-points')) {
    const content = readPainPoints();
    const html = renderPainPointsPage(content);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else if (req.method === 'GET' && parsedUrl.pathname === '/admin') {
    const content = readPainPoints();
    const html = renderAdminPage(content);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else if (req.method === 'POST' && parsedUrl.pathname === '/admin') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      const parsed = querystring.parse(body);
      const updated = {
        sustainability: parsed.sustainability ? parsed.sustainability.split(/\r?\n/).filter(Boolean) : [],
        integrations: parsed.integrations ? parsed.integrations.split(/\r?\n/).filter(Boolean) : []
      };
      writePainPoints(updated);
      res.writeHead(302, { Location: '/pain-points' });
      res.end();
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
