const { AppError } = require('../../errors');
const repo = require('./items.repository');

const notFound = () => new AppError(404, 'Barang tidak ditemukan');

const create = (userId, data) => repo.create(userId, data);

const list = async (userId, { page, limit, search }) => {
  const { rows, total } = await repo.findAll(userId, { search, limit, offset: (page - 1) * limit });
  return {
    items: rows,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getById = async (userId, id) => {
  const item = await repo.findById(userId, id);
  if (!item) throw notFound();
  return item;
};

const update = async (userId, id, data) => {
  const item = await repo.update(userId, id, data);
  if (!item) throw notFound();
  return item;
};

const remove = async (userId, id) => {
  if (!(await repo.remove(userId, id))) throw notFound();
};

const decreaseStock = async (userId, id, quantity) => {
  const item = await repo.decreaseStock(userId, id, quantity);
  if (item) return item;
  
  const existing = await repo.findById(userId, id);
  if (!existing) throw notFound();
  throw new AppError(409, `Stok tidak cukup (tersisa ${existing.stock})`);
};

module.exports = { create, list, getById, update, remove, decreaseStock };
