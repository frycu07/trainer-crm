const { Router } = require("express");
const validate = require("../../middleware/validate");
const { sessionIdParams, createSessionBody, updateNotesBody, listSessionsQuery } = require("./sessions.schemas");

function createSessionsRouter(controller) {
  const router = Router();

  router.get("/", validate({ query: listSessionsQuery }), controller.list);
  router.post("/", validate({ body: createSessionBody }), controller.create);
  router.get("/:id", validate({ params: sessionIdParams }), controller.getById);
  router.patch("/:id", validate({ params: sessionIdParams, body: updateNotesBody }), controller.updateNotes);

  return router;
}

module.exports = { createSessionsRouter };
