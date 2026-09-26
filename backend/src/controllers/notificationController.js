import { db } from '../data/mockDatabase.js';

// POST /api/notifications/register-token
export const registerPushToken = (req, res) => {
  const { token, platform } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Device token is required' });
  }

  db.pushTokens.add(token);
  console.log(`🔔 Registered device push token (${platform || 'mobile'}):`, token);

  res.json({
    success: true,
    message: 'Push notification token registered',
    activeTokensCount: db.pushTokens.size,
  });
};

// POST /api/notifications/send
export const sendNotification = async (req, res) => {
  const { title, body, data } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  console.log(`📣 [Notification Dispatch] Title: "${title}" | Body: "${body}"`);

  res.json({
    success: true,
    message: 'Notification queued and broadcasted',
    recipients: db.pushTokens.size,
  });
};
