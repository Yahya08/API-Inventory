const { Pool } = require('pg');
require('dotenv').config();

// Membuat koneksi pool ke database PostgreSQL menggunakan URL dari file .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  // Method pembantu untuk mengeksekusi query SQL
  query: (text, params) => pool.query(text, params),
  // Mengekspor objek pool agar koneksi bisa ditutup saat migrasi selesai
  pool, 
};
