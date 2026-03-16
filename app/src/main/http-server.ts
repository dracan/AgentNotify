import * as http from 'http';

type NotifyCallback = (title: string, message: string, accentColor: string, folder: string) => void;

export function createHttpServer(onNotify: NotifyCallback): http.Server {
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/notify') {
      let body = '';
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const title = String(data.title || 'Notification');
          const message = String(data.message || '');
          const accentColor = String(data.accentColor || '#6c9fff');
          const folder = String(data.folder || '');

          onNotify(title, message, accentColor, folder);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(9456, '127.0.0.1');
  return server;
}
