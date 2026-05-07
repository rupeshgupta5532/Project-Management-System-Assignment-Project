const Task = require('../models/Task');
const Project = require('../models/Project');
const { sendResponse, asyncHandler } = require('../utils/helpers');

// Verify user can access the project
const verifyProjectAccess = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId);
  if (!project) return { project: null, member: null };
  const member = project.members.find((m) => m.user.toString() === userId.toString());
  if (!member && userRole !== 'admin') return { project, member: null };
  return { project, member: member || { role: 'admin' } };
};

exports.createTask = asyncHandler(async (req, res) => {
  const { title, description, priority, dueDate, assignedTo, status } = req.body;
  const { projectId } = req.params;

  const { project, member } = await verifyProjectAccess(projectId, req.user._id, req.user.role);
  if (!project) return sendResponse(res, 404, false, 'Project not found');
  if (!member) return sendResponse(res, 403, false, 'Not a project member');
  if (member.role !== 'admin') return sendResponse(res, 403, false, 'Only project admins can create tasks');

  // Verify assigned user is a project member
  if (assignedTo) {
    const isMember = project.members.some((m) => m.user.toString() === assignedTo);
    if (!isMember) return sendResponse(res, 400, false, 'Assigned user is not a project member');
  }

  const task = await Task.create({
    title, description, priority, dueDate, assignedTo, status,
    project: projectId, createdBy: req.user._id,
  });

  await task.populate([
    { path: 'assignedTo', select: 'name email' },
    { path: 'createdBy', select: 'name email' },
  ]);

  sendResponse(res, 201, true, 'Task created', task);
});

exports.getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { status, priority, search, sortBy = 'createdAt', order = 'desc', page = 1, limit = 20 } = req.query;

  const { project, member } = await verifyProjectAccess(projectId, req.user._id, req.user.role);
  if (!project) return sendResponse(res, 404, false, 'Project not found');
  if (!member) return sendResponse(res, 403, false, 'Not a project member');

  const filter = { project: projectId };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search) filter.title = { $regex: search, $options: 'i' };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOrder = order === 'asc' ? 1 : -1;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit)),
    Task.countDocuments(filter),
  ]);

  sendResponse(res, 200, true, 'Tasks fetched', {
    tasks,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
  });
});

exports.getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('project', 'name');

  if (!task) return sendResponse(res, 404, false, 'Task not found');

  const { member } = await verifyProjectAccess(task.project._id, req.user._id, req.user.role);
  if (!member) return sendResponse(res, 403, false, 'Not a project member');

  sendResponse(res, 200, true, 'Task fetched', task);
});

exports.updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) return sendResponse(res, 404, false, 'Task not found');

  const { project, member } = await verifyProjectAccess(task.project, req.user._id, req.user.role);
  if (!project) return sendResponse(res, 404, false, 'Project not found');
  if (!member) return sendResponse(res, 403, false, 'Not a project member');

  const isProjectAdmin = member.role === 'admin';
  const isAssignee = task.assignedTo?.toString() === req.user._id.toString();

  if (!isProjectAdmin && !isAssignee) {
    return sendResponse(res, 403, false, 'Not authorized to update this task');
  }

  // Members can only update status
  if (!isProjectAdmin) {
    if (Object.keys(req.body).some((k) => k !== 'status')) {
      return sendResponse(res, 403, false, 'Members can only update task status');
    }
  }

  const allowedFields = isProjectAdmin
    ? ['title', 'description', 'priority', 'dueDate', 'assignedTo', 'status']
    : ['status'];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });

  await task.save();
  await task.populate([
    { path: 'assignedTo', select: 'name email' },
    { path: 'createdBy', select: 'name email' },
  ]);

  sendResponse(res, 200, true, 'Task updated', task);
});

exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) return sendResponse(res, 404, false, 'Task not found');

  const { member } = await verifyProjectAccess(task.project, req.user._id, req.user.role);
  if (!member || member.role !== 'admin') return sendResponse(res, 403, false, 'Project admin only');

  await task.deleteOne();
  sendResponse(res, 200, true, 'Task deleted');
});
