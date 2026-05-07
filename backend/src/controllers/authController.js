const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendResponse, asyncHandler } = require('../utils/helpers');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return sendResponse(res, 409, false, 'Email already registered');

  // First user becomes admin
  const userCount = await User.countDocuments();
  const assignedRole = userCount === 0 ? 'admin' : role === 'admin' ? 'admin' : 'member';

  const user = await User.create({ name, email, password, role: assignedRole });
  const token = generateToken(user._id);

  sendResponse(res, 201, true, 'Account created successfully', {
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return sendResponse(res, 401, false, 'Invalid email or password');
  }

  const token = generateToken(user._id);
  sendResponse(res, 200, true, 'Login successful', {
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

exports.getMe = asyncHandler(async (req, res) => {
  sendResponse(res, 200, true, 'User fetched', req.user);
});
