const db = require('../../db');

const create = async ({ name, email, passwordHash }) => {
  const { rows } = await db.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, passwordHash]
  );
  return rows[0];
};

const findByEmail = async (email) => {
  const { rows } = await db.query(
    'SELECT id, name, email, password_hash FROM users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
};

module.exports = { create, findByEmail };
