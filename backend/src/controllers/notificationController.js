const notificationService = require('../services/NotificationService');

exports.getAll = async (req, res) => {
  try {
    const notifications = await notificationService.listRecent();
    res.json({ status: 'success', data: notifications });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const notification = await notificationService.markRead(req.params.id);
    res.json({ status: 'success', data: notification });
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await notificationService.markAllRead();
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
