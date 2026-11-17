// konto administratora - seed jest idempotentny i nie kasuje zadnych danych
const bcrypt = require("bcryptjs");
const config = require("../../config");

exports.seed = async function (knex) {
  if (!config.ADMIN_EMAIL || !config.ADMIN_PASSWORD) {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set - skipping admin seed");
    return;
  }

  const passwordHash = await bcrypt.hash(config.ADMIN_PASSWORD, config.BCRYPT_ROUNDS);

  // jesli admin juz istnieje, nic sie nie dzieje
  await knex("users")
    .insert({ email: config.ADMIN_EMAIL, password_hash: passwordHash, full_name: "Administrator", role: "ADMIN" })
    .onConflict("email")
    .ignore();
};
