exports.up = async function (knex) {
  await knex.schema.createTable("packages", table => {
    table.increments("id").primary();
    // usuniecie klienta usuwa tez jego pakiety
    table.integer("client_id").notNullable().references("id").inTable("clients").onDelete("CASCADE");
    table.string("name", 100).notNullable();
    table.integer("total_sessions").notNullable();
    table.integer("used_sessions").notNullable().defaultTo(0);
    table.decimal("price", 10, 2).notNullable();
    table.date("valid_until").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // baza pilnuje spojnosci niezaleznie od kodu aplikacji
  await knex.raw("ALTER TABLE packages ADD CONSTRAINT packages_total_check CHECK (total_sessions > 0)");
  await knex.raw("ALTER TABLE packages ADD CONSTRAINT packages_used_check CHECK (used_sessions >= 0 AND used_sessions <= total_sessions)");
  await knex.raw("ALTER TABLE packages ADD CONSTRAINT packages_price_check CHECK (price >= 0)");
};

exports.down = async function (knex) {
  await knex.schema.dropTable("packages");
};
