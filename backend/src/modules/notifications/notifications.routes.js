const { Router } = require("express");
const validate = require("../../middleware/validate");
const { notificationIdParams } = require("./notifications.schemas");

function createNotificationsRouter(controller) {
  const router = Router();

  router.get("/", controller.list);
  router.patch("/:id/read", validate({ params: notificationIdParams }), controller.markRead);

  return router;
}

module.exports = { createNotificationsRouter };
