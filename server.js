const http = require('http');
const path = require('path');
const fs = require('fs/promises');
const { createReadStream, existsSync } = require('fs');

const PORT = Number(process.env.PORT) || 59023;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATASET_ROOT = path.join(ROOT, 'dataset');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

async function walkForDescriptions(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walkForDescriptions(fullPath);
      }
      if (entry.isFile() && entry.name.endsWith('_description.json')) {
        return [fullPath];
      }
      return [];
    })
  );
  return files.flat();
}

function buildDatasetSummary(data, filePath) {
  const dataset = data.dataset || {};
  const type = dataset.type || data.dataType?.type || 'unknown';
  const numberOfData = data.numberOfData ?? data.dataType?.numberOfPhenotype ?? data.dataType?.numberOfSNP;

  return {
    id: data.id || path.basename(filePath),
    name: dataset.name || 'Unnamed dataset',
    crop: dataset.crop || 'Unknown crop',
    cropCode: dataset.cropCode || '',
    type,
    version: data.version || 'N/A',
    numberOfData: typeof numberOfData === 'number' ? numberOfData : null,
    dataType: data.dataType?.type || null,
    storagePath: data.storage?.locationOfFile || path.dirname(path.relative(DATASET_ROOT, filePath)),
    generatedAt: data.generatedAt || null,
    relatedGenotype: data.relatedGenotype || null,
    filePath: path.relative(DATASET_ROOT, filePath)
  };
}

async function loadDatasetDescriptions() {
  const descriptionFiles = await walkForDescriptions(DATASET_ROOT);
  const descriptions = [];

  for (const filePath of descriptionFiles) {
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(raw);
      descriptions.push(buildDatasetSummary(data, filePath));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Failed to parse description file ${filePath}:`, err.message);
    }
  }

  return descriptions.sort((a, b) => a.name.localeCompare(b.name));
}

async function serveApi(req, res) {
  try {
    const datasets = await loadDatasetDescriptions();
    const payload = JSON.stringify({ datasets });
    res.writeHead(200, { 'Content-Type': MIME_TYPES['.json'] });
    res.end(payload);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': MIME_TYPES['.json'] });
    res.end(JSON.stringify({ error: 'Failed to load dataset descriptions.' }));
  }
}

function serveStatic(req, res) {
  const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = path.join(PUBLIC_DIR, path.normalize(urlPath));

  if (!filePath.startsWith(PUBLIC_DIR) || !existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/datasets')) {
    serveApi(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Dashboard server listening on http://localhost:${PORT}`);
});
