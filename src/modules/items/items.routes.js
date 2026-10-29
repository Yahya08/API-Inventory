const router = require('express').Router();
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schema = require('./items.schema');
const c = require('./items.controller');

router.use(auth); // Proteksi token JWT untuk seluruh endpoint di bawah ini

router.post('/', validate(schema.itemBody), c.create);
router.get('/', validate(schema.listQuery, 'query'), c.list);
router.get('/:id', validate(schema.idParam, 'params'), c.getById);
router.put('/:id', validate(schema.idParam, 'params'), validate(schema.itemBody), c.update);
router.delete('/:id', validate(schema.idParam, 'params'), c.remove);
router.patch(
  '/:id/decrease-stock',
  validate(schema.idParam, 'params'),
  validate(schema.decreaseBody),
  c.decreaseStock
);

module.exports = router;
