const { toPackageResponse } = require("./packages.mapper");

function createPackagesController(packagesService) {
  return {
    async list(req, res) {
      const packages = await packagesService.listByClient(req.validated.query.clientId, req.user);
      res.json(packages.map(toPackageResponse));
    },

    async create(req, res) {
      const pkg = await packagesService.create(req.validated.body, req.user);
      res.status(201).location(`/api/packages/${pkg.id}`).json(toPackageResponse(pkg));
    },

    async update(req, res) {
      const pkg = await packagesService.update(req.validated.params.id, req.validated.body, req.user);
      res.json(toPackageResponse(pkg));
    },

    async remove(req, res) {
      await packagesService.remove(req.validated.params.id, req.user);
      res.status(204).end();
    }
  };
}

module.exports = { createPackagesController };
