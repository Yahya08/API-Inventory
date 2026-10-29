const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const { AppError } = require('../../errors');
const repo = require('./auth.repository');

// Hash dummy supaya waktu respons mirip saat email tidak terdaftar
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

const register = async ({ name, email, password }) => {
  if (await repo.findByEmail(email)) {
    throw new AppError(409, 'Email sudah terdaftar');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  return repo.create({ name, email, passwordHash });
};

const login = async ({ email, password }) => {
  const user = await repo.findByEmail(email);
  const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) {
    throw new AppError(401, 'Email atau password salah');
  }
  const token = jwt.sign({ sub: String(user.id) }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn,
  });
  return { token, user: { id: user.id, name: user.name, email: user.email } };
};

module.exports = { register, login };
