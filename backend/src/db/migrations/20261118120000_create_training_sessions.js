exports.up = async function (knex) {
  await knex.schema.createTable("training_sessions", table => {
    table.increments("id").primary();
    table.integer("client_id").notNullable().references("id").inTable("clients").onDelete("CASCADE");
    table.integer("trainer_id").notNullable().references("id").inTable("users");
    // domyslne NO ACTION (nie RESTRICT) - przy usuwaniu klienta kaskada najpierw usuwa treningi, potem pakiety;
    // a samo usuniecie pakietu z treningami dalej konczy sie bledem FK (23503 -> 409)
    table.integer("package_id").notNullable().references("id").inTable("packages");
    table.timestamp("starts_at", { useTz: true }).notNullable();
    table.timestamp("ends_at", { useTz: true }).notNullable();
    table.string("status", 20).notNullable().defaultTo("SCHEDULED");
    table.text("notes").nullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // lista treningow trenera po dacie
    table.index(["trainer_id", "starts_at"]);
  });

  await knex.raw("ALTER TABLE training_sessions ADD CONSTRAINT training_sessions_status_check CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED'))");
  await knex.raw("ALTER TABLE training_sessions ADD CONSTRAINT training_sessions_time_check CHECK (ends_at > starts_at)");
};

exports.down = async function (knex) {
  await knex.schema.dropTable("training_sessions");
};
