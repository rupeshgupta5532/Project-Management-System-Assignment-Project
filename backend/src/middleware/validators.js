const { body, validationResult } = require('express-validator');
const { sendResponse } = require('../utils/helpers');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join(', ');
    return sendResponse(res, 400, false, messages);
  }
  next();
};

const authValidators = {
  signup: [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  login: [
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
};

const projectValidators = {
  create: [
    body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
  ],
};

const taskValidators = {
  create: [
    body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 150 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
    body('status').optional().isIn(['Todo', 'In Progress', 'Completed']).withMessage('Invalid status'),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  ],
  updateStatus: [
    body('status').isIn(['Todo', 'In Progress', 'Completed']).withMessage('Invalid status'),
  ],
};

module.exports = { validate, authValidators, projectValidators, taskValidators };
