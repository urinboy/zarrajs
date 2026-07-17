/**
 * Mini statik server — tashqi bog'liqliksiz (`php qadamchi serve` falsafasi):
 *   node tools/server.mjs [port]
 * Loyiha ildizini http://localhost:8090 da beradi.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ILDIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const PORT = Number(process.argv[2]) || 8090;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

createServer(async (sorov, javob) => {
  try {
    let yol = decodeURIComponent(new URL(sorov.url, 'http://x').pathname);
    if (yol.endsWith('/')) yol += 'index.html';
    const fayl = normalize(join(ILDIZ, yol));
    if (!fayl.startsWith(normalize(ILDIZ))) throw new Error('taqiqlangan');
    const tarkib = await readFile(fayl);
    javob.writeHead(200, { 'Content-Type': MIME[extname(fayl)] || 'application/octet-stream' });
    javob.end(tarkib);
  } catch {
    javob.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    javob.end('404 — topilmadi');
  }
}).listen(PORT, () => console.log(`Zarra server: http://localhost:${PORT}`));
