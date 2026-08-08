const { Notification } = require('../models');

// Fire-and-forget: called after the triggering write already committed, so a
// notification failure (e.g. bad enum value) never rolls back the real
// business transaction (tender/evaluation/approval) that triggered it.
async function notify({ type, message, link = null }) {
  try {
    await Notification.create({ type, message, link });
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
}

async function listRecent({ limit = 50 } = {}) {
  return Notification.findAll({ order: [['createdAt', 'DESC']], limit });
}

async function markRead(id) {
  const notification = await Notification.findByPk(id);
  if (!notification) {
    const err = new Error('Notification not found');
    err.status = 404;
    throw err;
  }
  await notification.update({ read: true });
  return notification;
}

async function markAllRead() {
  await Notification.update({ read: true }, { where: { read: false } });
}

module.exports = { notify, listRecent, markRead, markAllRead };
