const express = require('express');
const path = require('path');
const fs = require('fs');

const DATA_FILE = path.join(__dirname, 'data', 'pain_points.json');

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

const app = express();
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'production') {
  app.enable('trust proxy');
  const enforce = require('express-sslify');
  app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

app.get(['/', '/pain-points'], (req, res) => {
  const content = readPainPoints();
  const html = renderPainPointsPage(content);
  res.send(html);
});

app.get('/admin', (req, res) => {
  const content = readPainPoints();
  const html = renderAdminPage(content);
  res.send(html);
});

app.post('/admin', (req, res) => {
  const updated = {
    sustainability: req.body.sustainability ? req.body.sustainability.split(/\r?\n/).filter(Boolean) : [],
    integrations: req.body.integrations ? req.body.integrations.split(/\r?\n/).filter(Boolean) : []
  };
  writePainPoints(updated);
  res.redirect('/pain-points');
});

app.get('/style.css', (req, res) => {
  const cssPath = path.join(__dirname, 'public', 'style.css');
  fs.readFile(cssPath, (err, data) => {
    if (err) {
      res.status(404).send('Not found');
    } else {
      res.type('text/css').send(data);
    }
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

