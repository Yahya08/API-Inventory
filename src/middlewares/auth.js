const jwt = require('jsonwebtoken');
const config = require('../config');
const { AppError } = require('../errors');

module.exports = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'Token tidak ditemukan'));
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    req.user = { id: Number(payload.sub) };
    next();
  } catch {
    next(new AppError(401, 'Token tidak valid atau sudah kedaluwarsa'));
  }
};
