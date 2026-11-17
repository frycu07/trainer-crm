exports.up = async function (knex) {
  await knex.schema.createTable("users", table => {
    table.increments("id").primary();
    // UNIQUE w bazie - gwarancja takze przy rownoleglych zapytaniach
    table.string("email", 255).notNullable().unique();
    table.string("password_hash", 255).notNullable();
    table.string("full_name", 100).notNullable();
    table.string("role", 20).notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'TRAINER'))");
};

exports.down = async function (knex) {
  await knex.schema.dropTable("users");
};
