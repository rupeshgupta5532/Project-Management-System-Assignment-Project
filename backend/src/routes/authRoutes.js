const router = require('express').Router();
const { signup, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authValidators, validate } = require('../middleware/validators');

router.post('/signup', authValidators.signup, validate, signup);
router.post('/login', authValidators.login, validate, login);
router.get('/me', protect, getMe);

module.exports = router;
