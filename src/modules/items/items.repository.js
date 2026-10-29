const db = require('../../db');

const COLUMNS = 'id, name, description, stock, price, created_at, updated_at';

const map = (row) => (row ? { ...row, price: Number(row.price) } : null);

const escapeLike = (s) => s.replace(/[\\%_]/g, '\\$&');

const create = async (userId, { name, description, stock, price }) => {
  const { rows } = await db.query(
    `INSERT INTO items (user_id, name, description, stock, price)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLUMNS}`,
    [userId, name, description, stock, price]
  );
  return map(rows[0]);
};

const findAll = async (userId, { search, limit, offset }) => {
  const params = [userId];
  let where = 'WHERE user_id = $1';
  if (search) {
    params.push(`%${escapeLike(search)}%`);
    where += ' AND (name ILIKE $2 OR description ILIKE $2)';
  }
  const [list, count] = await Promise.all([
    db.query(
      `SELECT ${COLUMNS} FROM items ${where}
       ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    db.query(`SELECT count(*)::int AS total FROM items ${where}`, params),
  ]);
  return { rows: list.rows.map(map), total: count.rows[0].total };
};

const findById = async (userId, id) => {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM items WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return map(rows[0]);
};

const update = async (userId, id, { name, description, stock, price }) => {
  const { rows } = await db.query(
    `UPDATE items
        SET name = $3, description = $4, stock = $5, price = $6, updated_at = now()
      WHERE id = $1 AND user_id = $2
      RETURNING ${COLUMNS}`,
    [id, userId, name, description, stock, price]
  );
  return map(rows[0]);
};

const remove = async (userId, id) => {
  const { rowCount } = await db.query(
    'DELETE FROM items WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rowCount > 0;
};

const decreaseStock = async (userId, id, quantity) => {
  const { rows } = await db.query(
    `UPDATE items
        SET stock = stock - $3, updated_at = now()
      WHERE id = $1 AND user_id = $2 AND stock >= $3
      RETURNING ${COLUMNS}`,
    [id, userId, quantity]
  );
  return map(rows[0]);
};

module.exports = { create, findAll, findById, update, remove, decreaseStock };
