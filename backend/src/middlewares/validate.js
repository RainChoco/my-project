const validate = (schema) => async (req, res, next) => {
  try {
    await schema.validate({
      body: req.body,
      query: req.query,
      params: req.params
    }, { abortEarly: false, stripUnknown: true });
    return next();
  } catch (err) {
    return res.status(400).json({ status: 'error', type: 'ValidationError', errors: err.errors });
  }
};

module.exports = validate;
