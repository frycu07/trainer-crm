exports.up = async function (knex) {
  await knex.schema.createTable("clients", table => {
    table.increments("id").primary();
    // klient nalezy do trenera - na tym opiera sie ownership
    table.integer("trainer_id").notNullable().references("id").inTable("users");
    table.string("first_name", 50).notNullable();
    table.string("last_name", 50).notNullable();
    table.string("email", 255).nullable();
    table.string("phone", 20).nullable();
    table.text("goal").nullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTable("clients");
};
