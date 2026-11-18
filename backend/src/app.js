const express = require("express");
const authenticate = require("./middleware/authenticate");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const { createUsersRepository } = require("./modules/users/users.repository");
const { createUsersService } = require("./modules/users/users.service");
const { createUsersController } = require("./modules/users/users.controller");
const { createUsersRouter } = require("./modules/users/users.routes");

const { createClientsRepository } = require("./modules/clients/clients.repository");
const { createClientsService } = require("./modules/clients/clients.service");
const { createClientsController } = require("./modules/clients/clients.controller");
const { createClientsRouter } = require("./modules/clients/clients.routes");

const { createPackagesRepository } = require("./modules/packages/packages.repository");
const { createPackagesService } = require("./modules/packages/packages.service");
const { createPackagesController } = require("./modules/packages/packages.controller");
const { createPackagesRouter } = require("./modules/packages/packages.routes");

const { createSessionsRepository } = require("./modules/sessions/sessions.repository");
const { createSessionsService } = require("./modules/sessions/sessions.service");
const { createSessionsController } = require("./modules/sessions/sessions.controller");
const { createSessionsRouter } = require("./modules/sessions/sessions.routes");
const { createAuthService } = require("./modules/auth/auth.service");
const { createAuthController } = require("./modules/auth/auth.controller");
const { createAuthRouter } = require("./modules/auth/auth.routes");

// buduje aplikacje, ale jej nie uruchamia (listen jest w server.js)
// config, db i now przychodza jako parametry - app nie czyta process.env, a testy moga ustawic "dzisiaj"
function createApp({ config, db, now = () => new Date() }) {
  const app = express();

  app.use(express.json());

  const requireAuth = authenticate(config.JWT_SECRET);

  const usersRepository = createUsersRepository(db);
  const authService = createAuthService({
    usersRepository,
    jwtSecret: config.JWT_SECRET,
    jwtExpiresIn: config.JWT_EXPIRES_IN
  });

  const usersService = createUsersService({ usersRepository, bcryptRounds: config.BCRYPT_ROUNDS });

  const clientsRepository = createClientsRepository(db);
  const sessionsRepository = createSessionsRepository(db);
  const clientsService = createClientsService({ clientsRepository, sessionsRepository });

  const packagesRepository = createPackagesRepository(db);
  const packagesService = createPackagesService({ packagesRepository, clientsService });

  const sessionsService = createSessionsService({ sessionsRepository, clientsRepository, packagesRepository, now });

  // publiczne: health i logowanie (/me ma authenticate w routerze)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/api/auth", createAuthRouter(createAuthController(authService), { authenticate: requireAuth }));

  // wszystko ponizej wymaga tokenu - nowego endpointu nie da sie "zapomniec" zabezpieczyc
  app.use("/api", requireAuth);
  app.use("/api/users", createUsersRouter(createUsersController(usersService)));
  app.use("/api/clients", createClientsRouter(createClientsController(clientsService)));
  app.use("/api/packages", createPackagesRouter(createPackagesController(packagesService)));
  app.use("/api/sessions", createSessionsRouter(createSessionsController(sessionsService)));

  // kolejnosc ma znaczenie: najpierw 404 dla nieznanych sciezek, na samym koncu error handler
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
