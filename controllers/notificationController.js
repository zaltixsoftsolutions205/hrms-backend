const Notification = require('../models/Notification');
const User = require('../models/User');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Save FCM push token for the logged-in user
exports.savePushToken = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Token required' });
  try {
    // Add token if not already stored (prevent duplicates)
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { pushTokens: token } });
    res.json({ message: 'Push token saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove FCM push token (called on logout or permission revoked)
exports.removePushToken = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Token required' });
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { pushTokens: token } });
    res.json({ message: 'Push token removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
