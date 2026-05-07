const router = require('express').Router();
const {
  createProject, getProjects, getProject,
  updateProject, deleteProject, addMember, removeMember,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { projectValidators, validate } = require('../middleware/validators');
const taskRoutes = require('./taskRoutes');

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(projectValidators.create, validate, createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

router.post('/:id/members', addMember);
router.delete('/:id/members/:memberId', removeMember);

// Nest tasks under project
router.use('/:projectId/tasks', taskRoutes);

module.exports = router;
