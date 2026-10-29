const service = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const user = await service.register(req.valid.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await service.login(req.valid.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
