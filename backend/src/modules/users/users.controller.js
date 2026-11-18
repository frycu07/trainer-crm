const { toUserResponse } = require("./users.mapper");

function createUsersController(usersService) {
  return {
    async list(req, res) {
      const users = await usersService.list();
      res.json(users.map(toUserResponse));
    },

    async create(req, res) {
      const user = await usersService.create(req.validated.body);
      res.status(201).location(`/api/users/${user.id}`).json(toUserResponse(user));
    },

    async remove(req, res) {
      await usersService.remove(req.validated.params.id, req.user);
      res.status(204).end();
    }
  };
}

module.exports = { createUsersController };
