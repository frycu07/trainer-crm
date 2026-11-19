const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { app, setup, login, teardown, PASSWORD } = require("./helpers");

describe("auth i uprawnienia", () => {
  before(setup);
  after(teardown);

  it("logowanie: poprawne dane -> 200 i token, zle haslo -> 401", async () => {
    const ok = await request(app).post("/api/auth/login").send({ email: "trener1@test.pl", password: PASSWORD });
    assert.equal(ok.status, 200);
    assert.ok(ok.body.token);
    assert.equal(ok.body.user.role, "TRAINER");
    assert.equal(ok.body.user.passwordHash, undefined);

    const bad = await request(app).post("/api/auth/login").send({ email: "trener1@test.pl", password: "zle-haslo" });
    assert.equal(bad.status, 401);
    assert.equal(bad.body.error.code, "INVALID_CREDENTIALS");
  });

  it("GET /api/clients bez tokenu -> 401", async () => {
    const res = await request(app).get("/api/clients");
    assert.equal(res.status, 401);
    assert.ok(res.body.error.code);
  });

  it("POST /api/users: TRAINER -> 403, ADMIN -> 201", async () => {
    const body = { email: "nowy@test.pl", password: "haslo12345", fullName: "Nowy Trener", role: "TRAINER" };

    const trainerToken = await login("trener1@test.pl");
    const forbidden = await request(app).post("/api/users").set("Authorization", `Bearer ${trainerToken}`).send(body);
    assert.equal(forbidden.status, 403);

    const adminToken = await login("admin@test.pl");
    const created = await request(app).post("/api/users").set("Authorization", `Bearer ${adminToken}`).send(body);
    assert.equal(created.status, 201);
    assert.equal(created.body.email, "nowy@test.pl");
    assert.equal(created.body.passwordHash, undefined);
  });
});
