const User = require('../models/User');
const { sendResponse, asyncHandler } = require('../utils/helpers');

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort('name');
  sendResponse(res, 200, true, 'Users fetched', users);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name },
    { new: true, runValidators: true }
  ).select('-password');
  sendResponse(res, 200, true, 'Profile updated', user);
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return sendResponse(res, 400, false, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  sendResponse(res, 200, true, 'Password changed successfully');
});
