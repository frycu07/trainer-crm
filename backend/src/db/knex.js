const knex = require("knex");
const pg = require("pg");

// DATE (oid 1082) zostaje stringiem YYYY-MM-DD - bez przesuniec przez strefe czasowa
pg.types.setTypeParser(1082, (value) => value);

// jedna pula polaczen na cala aplikacje
function createDb(config) {
  return knex({
    client: "pg",
    connection: config.DATABASE_URL,
    pool: { min: 2, max: 10 }
  });
}

module.exports = { createDb };
