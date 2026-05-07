const router = require('express').Router({ mergeParams: true });
const {
  createTask, getTasks, getTask, updateTask, deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { taskValidators, validate } = require('../middleware/validators');

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(taskValidators.create, validate, createTask);

router.route('/:taskId')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;
