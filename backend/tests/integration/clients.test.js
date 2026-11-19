const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { app, setup, login, teardown } = require("./helpers");

describe("klienci", () => {
  let tokenA;
  let tokenB;

  before(async () => {
    await setup();
    tokenA = await login("trener1@test.pl");
    tokenB = await login("trener2@test.pl");
  });
  after(teardown);

  it("CRUD klienta: 201 -> 200 -> 200 -> 204 -> 404, bledne body -> 400", async () => {
    const auth = { Authorization: `Bearer ${tokenA}` };

    const created = await request(app).post("/api/clients").set(auth).send({ firstName: "Jan", lastName: "Kowalski" });
    assert.equal(created.status, 201);
    const id = created.body.id;

    const found = await request(app).get(`/api/clients/${id}`).set(auth);
    assert.equal(found.status, 200);
    assert.equal(found.body.firstName, "Jan");

    const updated = await request(app).put(`/api/clients/${id}`).set(auth).send({ firstName: "Janusz", lastName: "Kowalski" });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.firstName, "Janusz");

    const removed = await request(app).delete(`/api/clients/${id}`).set(auth);
    assert.equal(removed.status, 204);

    const gone = await request(app).get(`/api/clients/${id}`).set(auth);
    assert.equal(gone.status, 404);

    const invalid = await request(app).post("/api/clients").set(auth).send({ firstName: "", trainerId: 2 });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.error.code, "VALIDATION_ERROR");
  });

  it("trener B nie widzi klienta trenera A (404) i nie ma go na liscie", async () => {
    const created = await request(app).post("/api/clients").set("Authorization", `Bearer ${tokenA}`)
      .send({ firstName: "Anna", lastName: "Nowak" });
    const id = created.body.id;

    const asB = await request(app).get(`/api/clients/${id}`).set("Authorization", `Bearer ${tokenB}`);
    assert.equal(asB.status, 404);

    const list = await request(app).get("/api/clients").set("Authorization", `Bearer ${tokenB}`);
    assert.equal(list.status, 200);
    assert.equal(list.body.data.length, 0);
    assert.equal(list.body.pagination.total, 0);
  });
});
