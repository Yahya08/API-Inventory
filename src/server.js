const config = require('./config');
const app = require('./app');
const db = require('./db');

const server = app.listen(config.port, () => {
  console.log(`API berjalan di http://localhost:${config.port}`);
});

// Fungsi untuk mematikan server dengan aman (Graceful Shutdown)
const shutdown = () => {
  server.close(async () => {
    await db.pool.end();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
