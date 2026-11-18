const { toClientResponse } = require("./clients.mapper");
const { buildPagination } = require("../../utils/pagination");

function createClientsController(clientsService) {
  return {
    async list(req, res) {
      const query = req.validated.query;
      const { rows, total } = await clientsService.list(query, req.user);
      res.json({
        data: rows.map(toClientResponse),
        pagination: buildPagination(query.page, query.limit, total)
      });
    },

    async getById(req, res) {
      const client = await clientsService.getById(req.validated.params.id, req.user);
      res.json(toClientResponse(client));
    },

    async create(req, res) {
      const client = await clientsService.create(req.validated.body, req.user);
      res.status(201).location(`/api/clients/${client.id}`).json(toClientResponse(client));
    },

    async update(req, res) {
      const client = await clientsService.update(req.validated.params.id, req.validated.body, req.user);
      res.json(toClientResponse(client));
    },

    async remove(req, res) {
      await clientsService.remove(req.validated.params.id, req.user);
      res.status(204).end();
    }
  };
}

module.exports = { createClientsController };
