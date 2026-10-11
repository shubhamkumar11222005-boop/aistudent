import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes';
import { storage } from './server/storage';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const HOST = process.env.HOST || '0.0.0.0';

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Pre-seed sample documents if database is empty
  try {
    await storage.seedInitialDocumentsIfEmpty();
  } catch (seedErr) {
    console.warn('[StudyAI Server] Seeding error:', seedErr);
  }

  // Mount API router under /api
  app.use('/api', apiRouter);

  // Frontend integration: Vite middleware in development, static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: HOST,
        port: PORT,
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, HOST, () => {
    console.log(`[StudyAI Full-Stack Server] Listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[StudyAI Server] Fatal startup error:', err);
  process.exit(1);
});
