const { toNotificationResponse } = require("./notifications.mapper");

function createNotificationsController(notificationsService) {
  return {
    async list(req, res) {
      const notifications = await notificationsService.list(req.user);
      res.json(notifications.map(toNotificationResponse));
    },

    async markRead(req, res) {
      const notification = await notificationsService.markRead(req.validated.params.id, req.user);
      res.json(toNotificationResponse(notification));
    }
  };
}

module.exports = { createNotificationsController };
