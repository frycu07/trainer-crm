const { toSessionResponse } = require("./sessions.mapper");
const { buildPagination } = require("../../utils/pagination");

function createSessionsController(sessionsService) {
  return {
    async list(req, res) {
      const query = req.validated.query;
      const { rows, total } = await sessionsService.list(query, req.user);
      res.json({
        data: rows.map(toSessionResponse),
        pagination: buildPagination(query.page, query.limit, total)
      });
    },

    async getById(req, res) {
      const session = await sessionsService.getById(req.validated.params.id, req.user);
      res.json(toSessionResponse(session));
    },

    async create(req, res) {
      const session = await sessionsService.schedule(req.validated.body, req.user);
      res.status(201).location(`/api/sessions/${session.id}`).json(toSessionResponse(session));
    },

    async updateNotes(req, res) {
      const session = await sessionsService.updateNotes(req.validated.params.id, req.validated.body.notes, req.user);
      res.json(toSessionResponse(session));
    },

    async complete(req, res) {
      const session = await sessionsService.complete(req.validated.params.id, req.user);
      res.json(toSessionResponse(session));
    },

    async cancel(req, res) {
      const session = await sessionsService.cancel(req.validated.params.id, req.user);
      res.json(toSessionResponse(session));
    },

    async remove(req, res) {
      await sessionsService.remove(req.validated.params.id);
      res.status(204).end();
    }
  };
}

module.exports = { createSessionsController };
