const { AppError } = require('../errors');

const notFound = (_req, _res, next) => next(new AppError(404, 'Endpoint tidak ditemukan'));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ success: false, message: err.message, errors: err.details });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Body bukan JSON yang valid' });
  }
  if (err.type === 'entity.too.large') {
  return res.status(413).json({ success: false, message: 'Body request terlalu besar' });
  }
  
  // Pelanggaran constraint Postgres sebagai pertahanan terakhir
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'Data sudah ada (duplikat)' });
  }
  if (err.code === '23514') {
    return res.status(422).json({ success: false, message: 'Data melanggar constraint database' });
  }
  console.error(err);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
};

module.exports = { notFound, errorHandler };
