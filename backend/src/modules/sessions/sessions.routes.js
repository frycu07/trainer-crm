const { Router } = require("express");
const validate = require("../../middleware/validate");
const authorize = require("../../middleware/authorize");
const { sessionIdParams, createSessionBody, updateNotesBody, listSessionsQuery } = require("./sessions.schemas");

function createSessionsRouter(controller) {
  const router = Router();

  router.get("/", validate({ query: listSessionsQuery }), controller.list);
  router.post("/", validate({ body: createSessionBody }), controller.create);
  router.get("/:id", validate({ params: sessionIdParams }), controller.getById);
  router.patch("/:id", validate({ params: sessionIdParams, body: updateNotesBody }), controller.updateNotes);
  router.patch("/:id/complete", validate({ params: sessionIdParams }), controller.complete);
  router.patch("/:id/cancel", validate({ params: sessionIdParams }), controller.cancel);
  // usuwanie treningow tylko dla ADMINa
  router.delete("/:id", authorize("ADMIN"), validate({ params: sessionIdParams }), controller.remove);

  return router;
}

module.exports = { createSessionsRouter };
