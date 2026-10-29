const { AppError } = require('../errors');

const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return next(new AppError(422, 'Validasi gagal', details));
  }
  req.valid = { ...(req.valid || {}), [source]: result.data };
  next();
};

module.exports = validate;