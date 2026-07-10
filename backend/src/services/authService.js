const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || process.env.DEV_JWT_SECRET;
const TOKEN_EXPIRY = '8h';

const hashPassword = (plainPassword) => bcrypt.hash(plainPassword, SALT_ROUNDS);

const comparePassword = (plainPassword, passwordHash) => bcrypt.compare(plainPassword, passwordHash);

const signToken = (user) => {
  const payload = {
    sub: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role
  };
  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256', expiresIn: TOKEN_EXPIRY });
};

const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

module.exports = {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken
};
