const authService = require('../services/authService');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ status: 'error', message: 'Missing or malformed Authorization header' });
  }

  try {
    const decoded = authService.verifyToken(token);
    req.user = {
      id: decoded.sub,
      full_name: decoded.full_name,
      email: decoded.email,
      role: decoded.role
    };
    return next();
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
};

const authorise = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'Authentication required' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ status: 'error', message: 'Insufficient permissions' });
  }
  return next();
};

module.exports = {
  authenticate,
  authorise
};
