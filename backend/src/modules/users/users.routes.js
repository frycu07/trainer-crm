const { Router } = require("express");
const validate = require("../../middleware/validate");
const authorize = require("../../middleware/authorize");
const { userIdParams, createUserBody } = require("./users.schemas");

// caly router tylko dla ADMIN - zarzadzanie kontami to nie sprawa trenera
function createUsersRouter(controller) {
  const router = Router();

  router.use(authorize("ADMIN"));

  router.get("/", controller.list);
  router.post("/", validate({ body: createUserBody }), controller.create);
  router.delete("/:id", validate({ params: userIdParams }), controller.remove);

  return router;
}

module.exports = { createUsersRouter };
