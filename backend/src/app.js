const express = require("express");
const authenticate = require("./middleware/authenticate");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const { createUsersRepository } = require("./modules/users/users.repository");
const { createAuthService } = require("./modules/auth/auth.service");
const { createAuthController } = require("./modules/auth/auth.controller");
const { createAuthRouter } = require("./modules/auth/auth.routes");

// buduje aplikacje, ale jej nie uruchamia (listen jest w server.js)
// config i db przychodza jako parametry - app nie czyta process.env
function createApp({ config, db }) {
  const app = express();

  app.use(express.json());

  const requireAuth = authenticate(config.JWT_SECRET);

  const usersRepository = createUsersRepository(db);
  const authService = createAuthService({
    usersRepository,
    jwtSecret: config.JWT_SECRET,
    jwtExpiresIn: config.JWT_EXPIRES_IN
  });

  // publiczne: health i logowanie (/me ma authenticate w routerze)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/api/auth", createAuthRouter(createAuthController(authService), { authenticate: requireAuth }));

  // wszystko ponizej wymaga tokenu - nowego endpointu nie da sie "zapomniec" zabezpieczyc
  app.use("/api", requireAuth);

  // kolejnosc ma znaczenie: najpierw 404 dla nieznanych sciezek, na samym koncu error handler
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
