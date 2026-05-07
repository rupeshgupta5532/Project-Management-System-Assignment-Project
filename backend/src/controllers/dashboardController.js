const Project = require('../models/Project');
const Task = require('../models/Task');
const { sendResponse, asyncHandler } = require('../utils/helpers');

exports.getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();

  // Projects user belongs to
  const projectQuery =
    req.user.role === 'admin'
      ? {}
      : { 'members.user': userId };

  const userProjects = await Project.find(projectQuery).select('_id name');
  const projectIds = userProjects.map((p) => p._id);

  // Aggregate task stats
  const [taskStats, myTaskStats, recentTasks] = await Promise.all([
    Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
          todo: { $sum: { $cond: [{ $eq: ['$status', 'Todo'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                { $and: [{ $lt: ['$dueDate', now] }, { $ne: ['$status', 'Completed'] }, { $ne: ['$dueDate', null] }] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
    Task.aggregate([
      { $match: { assignedTo: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    Task.find({ project: { $in: projectIds } })
      .sort('-createdAt')
      .limit(5)
      .populate('assignedTo', 'name')
      .populate('project', 'name'),
  ]);

  const stats = taskStats[0] || { total: 0, completed: 0, inProgress: 0, todo: 0, overdue: 0 };

  const myTasks = { total: 0, Todo: 0, 'In Progress': 0, Completed: 0 };
  myTaskStats.forEach((s) => {
    myTasks[s._id] = s.count;
    myTasks.total += s.count;
  });

  sendResponse(res, 200, true, 'Dashboard data fetched', {
    projects: { total: userProjects.length, list: userProjects.slice(0, 5) },
    tasks: stats,
    myTasks,
    recentTasks,
  });
});
