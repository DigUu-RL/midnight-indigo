import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const PORT = Number(process.env.PORT ?? 3000);
const routes = new Map();

/**
 * Register a handler for one method + path pair.
 * @param {string} method
 * @param {string} path
 */
export function route(method, path, handler) {
  routes.set(`${method} ${path}`, handler);
  return { method, path };
}

route('GET', '/health', async (_req, res) => {
  const pkg = JSON.parse(await readFile('./package.json', 'utf8'));
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ ok: true, version: pkg.version }));
});

const server = createServer(async (req, res) => {
  const handler = routes.get(`${req.method} ${req.url}`);
  if (!handler) return res.writeHead(404).end('Not Found');

  try {
    await handler(req, res);
  } catch (err) {
    console.error('unhandled', err); // bubbles up to the crash reporter
    res.writeHead(500).end('Internal Server Error');
  }
});

server.listen(PORT, () => console.log(`listening on :${PORT}`));
