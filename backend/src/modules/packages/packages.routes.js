const { Router } = require("express");
const validate = require("../../middleware/validate");
const { packageIdParams, listPackagesQuery, createPackageBody, updatePackageBody } = require("./packages.schemas");

function createPackagesRouter(controller) {
  const router = Router();

  router.get("/", validate({ query: listPackagesQuery }), controller.list);
  router.post("/", validate({ body: createPackageBody }), controller.create);
  router.put("/:id", validate({ params: packageIdParams, body: updatePackageBody }), controller.update);
  router.delete("/:id", validate({ params: packageIdParams }), controller.remove);

  return router;
}

module.exports = { createPackagesRouter };
