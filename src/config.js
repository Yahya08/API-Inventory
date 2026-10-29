require('dotenv').config();

const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
};

for (const key of ['databaseUrl', 'jwtSecret']) {
  if (!config[key]) {
    console.error(`Environment variable untuk "${key}" belum diatur. Lihat .env.example`);
    process.exit(1);
  }
}

module.exports = config;