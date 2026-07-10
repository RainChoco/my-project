const { User } = require('../models');
const authService = require('../services/authService');

const sanitizeUser = (user) => ({
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  role: user.role,
  avatar_url: user.avatar_url,
  created_at: user.created_at,
  updated_at: user.updated_at
});

const register = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ status: 'error', message: 'A user with this email already exists' });
    }

    const password_hash = await authService.hashPassword(password);
    const user = await User.create({ full_name, email, password_hash, role });

    res.status(201).json({ status: 'success', data: sanitizeUser(user) });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ status: 'error', message: 'A user with this email already exists' });
    }
    console.error('Error in register:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    const passwordMatches = await authService.comparePassword(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    const token = authService.signToken(user);

    res.status(200).json({ status: 'success', data: { token, user: sanitizeUser(user) } });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

module.exports = {
  register,
  login
};
