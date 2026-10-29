const router = require('express').Router();
const validate = require('../../middlewares/validate');
const schema = require('./auth.schema');
const controller = require('./auth.controller');

router.post('/register', validate(schema.register), controller.register);
router.post('/login', validate(schema.login), controller.login);

module.exports = router;
