const { toUserResponse } = require("../users/users.mapper");

function createAuthController(authService) {
  return {
    async login(req, res) {
      const { email, password } = req.validated.body;
      const { token, user } = await authService.login(email, password);
      res.json({ token, user: toUserResponse(user) });
    },

    async me(req, res) {
      const user = await authService.getMe(req.user.id);
      res.json(toUserResponse(user));
    }
  };
}

module.exports = { createAuthController };
