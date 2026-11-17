const express = require("express");

// buduje aplikacje, ale jej nie uruchamia (listen jest w server.js)
// config przychodzi jako parametr - app nie czyta process.env
function createApp({ config }) {
  const app = express();

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}

module.exports = { createApp };
