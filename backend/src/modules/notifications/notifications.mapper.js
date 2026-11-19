function toNotificationResponse(notification) {
  return {
    id: notification.id,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt
  };
}

module.exports = { toNotificationResponse };
