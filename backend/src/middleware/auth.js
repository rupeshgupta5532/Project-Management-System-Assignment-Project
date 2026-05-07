const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendResponse } = require('../utils/helpers');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendResponse(res, 401, false, 'Not authorized, no token');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return sendResponse(res, 401, false, 'User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    return sendResponse(res, 401, false, 'Not authorized, invalid token');
  }
};

// Check if user is admin of the project
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && !req.projectAdminOverride) {
    return sendResponse(res, 403, false, 'Access denied: Admin only');
  }
  next();
};

// Check project-level admin role
const requireProjectAdmin = (req, res, next) => {
  if (!req.projectMember) return sendResponse(res, 403, false, 'Not a project member');
  if (req.projectMember.role !== 'admin') {
    return sendResponse(res, 403, false, 'Access denied: Project admin only');
  }
  next();
};

module.exports = { protect, requireAdmin, requireProjectAdmin };
