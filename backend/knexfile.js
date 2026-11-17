// konfiguracja Knex - uzywana przez CLI (npx knex ...) i przez src/db/knex.js
// zmienne srodowiskowe tylko przez modul konfiguracji (walidacja + fail fast)
const config = require("./src/config");

module.exports = {
  client: "pg",
  connection: config.DATABASE_URL,
  pool: { min: 2, max: 10 },
  migrations: { directory: "./src/db/migrations" },
  seeds: { directory: "./src/db/seeds" }
};
