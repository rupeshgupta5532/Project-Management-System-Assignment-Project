const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { sendResponse, asyncHandler } = require('../utils/helpers');

// Helper: get project and verify membership
const getProjectWithMember = async (projectId, userId) => {
  const project = await Project.findById(projectId)
    .populate('owner', 'name email')
    .populate('members.user', 'name email role');
  if (!project) return { project: null, member: null };
  const member = project.members.find((m) => m.user._id.toString() === userId.toString());
  return { project, member };
};

exports.createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const project = await Project.create({ name, description, owner: req.user._id });
  await project.populate('owner', 'name email');
  sendResponse(res, 201, true, 'Project created', project);
});

exports.getProjects = asyncHandler(async (req, res) => {
  const query =
    req.user.role === 'admin'
      ? {} // admins see all projects
      : { 'members.user': req.user._id };

  const projects = await Project.find(query)
    .populate('owner', 'name email')
    .populate('members.user', 'name email')
    .sort('-createdAt');

  // Attach task counts
  const projectIds = projects.map((p) => p._id);
  const taskCounts = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: '$project', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } } } },
  ]);

  const countMap = {};
  taskCounts.forEach((t) => { countMap[t._id.toString()] = t; });

  const enriched = projects.map((p) => {
    const counts = countMap[p._id.toString()] || { total: 0, completed: 0 };
    return { ...p.toObject(), taskCount: counts.total, completedCount: counts.completed };
  });

  sendResponse(res, 200, true, 'Projects fetched', enriched);
});

exports.getProject = asyncHandler(async (req, res) => {
  const { project, member } = await getProjectWithMember(req.params.id, req.user._id);
  if (!project) return sendResponse(res, 404, false, 'Project not found');
  if (!member && req.user.role !== 'admin') return sendResponse(res, 403, false, 'Not a project member');
  sendResponse(res, 200, true, 'Project fetched', project);
});

exports.updateProject = asyncHandler(async (req, res) => {
  const { project, member } = await getProjectWithMember(req.params.id, req.user._id);
  if (!project) return sendResponse(res, 404, false, 'Project not found');
  if (!member || member.role !== 'admin') return sendResponse(res, 403, false, 'Project admin only');

  const { name, description, status } = req.body;
  if (name) project.name = name;
  if (description !== undefined) project.description = description;
  if (status) project.status = status;
  await project.save();
  sendResponse(res, 200, true, 'Project updated', project);
});

exports.deleteProject = asyncHandler(async (req, res) => {
  const { project, member } = await getProjectWithMember(req.params.id, req.user._id);
  if (!project) return sendResponse(res, 404, false, 'Project not found');
  if (!member || member.role !== 'admin') return sendResponse(res, 403, false, 'Project admin only');

  await Task.deleteMany({ project: project._id });
  await project.deleteOne();
  sendResponse(res, 200, true, 'Project deleted');
});

exports.addMember = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const { project, member } = await getProjectWithMember(req.params.id, req.user._id);
  if (!project) return sendResponse(res, 404, false, 'Project not found');
  if (!member || member.role !== 'admin') return sendResponse(res, 403, false, 'Project admin only');

  const userToAdd = await User.findOne({ email });
  if (!userToAdd) return sendResponse(res, 404, false, 'User not found');

  const alreadyMember = project.members.some((m) => m.user._id.toString() === userToAdd._id.toString());
  if (alreadyMember) return sendResponse(res, 409, false, 'User is already a member');

  project.members.push({ user: userToAdd._id, role: role || 'member' });
  await project.save();
  await project.populate('members.user', 'name email');
  sendResponse(res, 200, true, 'Member added', project);
});

exports.removeMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  const { project, member } = await getProjectWithMember(req.params.id, req.user._id);
  if (!project) return sendResponse(res, 404, false, 'Project not found');
  if (!member || member.role !== 'admin') return sendResponse(res, 403, false, 'Project admin only');
  if (project.owner._id.toString() === memberId) return sendResponse(res, 400, false, 'Cannot remove project owner');

  project.members = project.members.filter((m) => m.user._id.toString() !== memberId);
  await project.save();
  sendResponse(res, 200, true, 'Member removed', project);
});
