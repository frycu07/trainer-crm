const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { app, setup, login, teardown } = require("./helpers");

// termin za 3 dni o 10:00 UTC - zawsze w przyszlosci
function futureStart(hour) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 3);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

describe("treningi", () => {
  let auth;

  before(async () => {
    await setup();
    auth = { Authorization: `Bearer ${await login("trener1@test.pl")}` };
  });
  after(teardown);

  it("pelny scenariusz: brak pakietu 409, pakiet -> 201 i usedSessions=1, nakladajacy sie termin 409", async () => {
    const client = await request(app).post("/api/clients").set(auth).send({ firstName: "Jan", lastName: "Kowalski" });
    const clientId = client.body.id;
    const startsAt = futureStart(10);

    // R1: klient nie ma pakietu
    const noPackage = await request(app).post("/api/sessions").set(auth)
      .send({ clientId, startsAt, durationMinutes: 60 });
    assert.equal(noPackage.status, 409);
    assert.equal(noPackage.body.error.code, "NO_ACTIVE_PACKAGE");

    // pakiet wazny miesiac od dzisiaj
    const validUntil = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const pkg = await request(app).post("/api/packages").set(auth)
      .send({ clientId, name: "Pakiet 10", totalSessions: 10, price: 800, validUntil });
    assert.equal(pkg.status, 201);

    const created = await request(app).post("/api/sessions").set(auth)
      .send({ clientId, startsAt, durationMinutes: 60 });
    assert.equal(created.status, 201);
    assert.equal(created.body.status, "SCHEDULED");

    const packages = await request(app).get(`/api/packages?clientId=${clientId}`).set(auth);
    assert.equal(packages.body[0].usedSessions, 1);

    // R2: ten sam termin zajety
    const overlap = await request(app).post("/api/sessions").set(auth)
      .send({ clientId, startsAt, durationMinutes: 60 });
    assert.equal(overlap.status, 409);
    assert.equal(overlap.body.error.code, "TRAINER_NOT_AVAILABLE");

    // mechanizm asynchroniczny: po zaplanowaniu trener dostaje powiadomienie
    await new Promise((resolve) => setTimeout(resolve, 100));
    const notifications = await request(app).get("/api/notifications").set(auth);
    assert.equal(notifications.status, 200);
    assert.ok(notifications.body.length >= 1);
  });
});
