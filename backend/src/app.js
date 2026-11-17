const express = require("express");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

// buduje aplikacje, ale jej nie uruchamia (listen jest w server.js)
// config przychodzi jako parametr - app nie czyta process.env
function createApp({ config }) {
  const app = express();

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // kolejnosc ma znaczenie: najpierw 404 dla nieznanych sciezek, na samym koncu error handler
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
