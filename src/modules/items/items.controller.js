const service = require('./items.service');

const wrap = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    next(err);
  }
};

const create = wrap(async (req, res) => {
  const item = await service.create(req.user.id, req.valid.body);
  res.status(201).json({ success: true, data: item });
});

const list = wrap(async (req, res) => {
  const { items, meta } = await service.list(req.user.id, req.valid.query);
  res.json({ success: true, data: items, meta });
});

const getById = wrap(async (req, res) => {
  const item = await service.getById(req.user.id, req.valid.params.id);
  res.json({ success: true, data: item });
});

const update = wrap(async (req, res) => {
  const item = await service.update(req.user.id, req.valid.params.id, req.valid.body);
  res.json({ success: true, data: item });
});

const remove = wrap(async (req, res) => {
  await service.remove(req.user.id, req.valid.params.id);
  res.status(204).send();
});

const decreaseStock = wrap(async (req, res) => {
  const item = await service.decreaseStock(
    req.user.id,
    req.valid.params.id,
    req.valid.body.quantity
  );
  res.json({ success: true, data: item });
});

module.exports = { create, list, getById, update, remove, decreaseStock };
