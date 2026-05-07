const router = require('express').Router();
const { getUsers, updateProfile, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getUsers);
router.put('/profile', updateProfile);
router.put('/password', changePassword);

module.exports = router;
