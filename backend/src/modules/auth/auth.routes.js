const { Router } = require("express");
const validate = require("../../middleware/validate");
const { loginBody } = require("./auth.schemas");

// login jest publiczny (inaczej nie dalo sie zalogowac), /me ma authenticate pojedynczo
function createAuthRouter(controller, { authenticate }) {
  const router = Router();

  router.post("/login", validate({ body: loginBody }), controller.login);
  router.get("/me", authenticate, controller.me);

  return router;
}

module.exports = { createAuthRouter };
