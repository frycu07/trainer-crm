// wspolne narzedzia testow integracyjnych
// NODE_ENV=test ustawia skrypt npm - config sam podmienia baze na testowa
const request = require("supertest");
const bcrypt = require("bcryptjs");
const { EventEmitter } = require("node:events");
const config = require("../../src/config");
const { createDb } = require("../../src/db/knex");
const { createApp } = require("../../src/app");

// TRUNCATE ponizej wyczyscilby baze deweloperska - bez NODE_ENV=test nie startujemy
if (config.NODE_ENV !== "test") {
  throw new Error("Integration tests need NODE_ENV=test (use npm run test:integration)");
}

const PASSWORD = "haslo12345";

const db = createDb(config);
const app = createApp({ config, db, eventBus: new EventEmitter() });

// migracje, czysta baza i trzech uzytkownikow: admin oraz dwoch trenerow
async function setup() {
  await db.migrate.latest({ directory: "./src/db/migrations" });
  await db.raw("TRUNCATE users, clients, packages, training_sessions, notifications RESTART IDENTITY CASCADE");

  // 4 rundy bcrypt wystarcza w testach i sa szybkie
  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  await db("users").insert([
    { email: "admin@test.pl", password_hash: passwordHash, full_name: "Admin", role: "ADMIN" },
    { email: "trener1@test.pl", password_hash: passwordHash, full_name: "Trener Jeden", role: "TRAINER" },
    { email: "trener2@test.pl", password_hash: passwordHash, full_name: "Trener Dwa", role: "TRAINER" }
  ]);
}

async function login(email) {
  const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
  return res.body.token;
}

async function teardown() {
  await db.destroy();
}

module.exports = { app, db, setup, login, teardown, PASSWORD };
