const fs = require('fs');
const path = require('path');
const db = require('../src/db');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '../db/init.sql'), 'utf8');
  await db.query(sql);
  console.log('Migrasi selesai.');
  await db.pool.end();
})().catch((err) => {
  console.error('Migrasi gagal secara detail:');
  console.error(err); // Menampilkan seluruh objek error agar penyebab aslinya kelihatan
  process.exit(1);
});
