const { Router } = require("express");
const validate = require("../../middleware/validate");
const { clientIdParams, clientBody, listClientsQuery } = require("./clients.schemas");

// ownership (czyj to klient) sprawdza service - routes pilnuja tylko ksztaltu requestu
function createClientsRouter(controller) {
  const router = Router();

  router.get("/", validate({ query: listClientsQuery }), controller.list);
  router.post("/", validate({ body: clientBody }), controller.create);
  router.get("/:id", validate({ params: clientIdParams }), controller.getById);
  router.put("/:id", validate({ params: clientIdParams, body: clientBody }), controller.update);
  router.delete("/:id", validate({ params: clientIdParams }), controller.remove);

  return router;
}

module.exports = { createClientsRouter };
