// unit testy logiki klientow - bez bazy i bez Expressa
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createClientsService } = require("../../src/modules/clients/clients.service");
const { NotFoundError, ConflictError } = require("../../src/errors/AppError");

const clientOfTrainer2 = { id: 1, trainerId: 2, firstName: "Jan", lastName: "Kowalski" };

function setup({ scheduledCount = 0 } = {}) {
  const calls = { removed: [], pages: [] };
  const clientsRepository = {
    findById: async (id) => (id === clientOfTrainer2.id ? clientOfTrainer2 : null),
    remove: async (id) => calls.removed.push(id),
    findPage: async (params) => {
      calls.pages.push(params);
      return { rows: [], total: 0 };
    }
  };
  const sessionsRepository = { countScheduledByClient: async () => scheduledCount };
  return { service: createClientsService({ clientsRepository, sessionsRepository }), calls };
}

// 9. ownership
test("a trainer does not see another trainer's client (NotFoundError)", async () => {
  const { service } = setup();
  const otherTrainer = { id: 3, role: "TRAINER" };

  await assert.rejects(service.getById(1, otherTrainer), (err) => err instanceof NotFoundError);
  await assert.rejects(service.update(1, { firstName: "X", lastName: "Y" }, otherTrainer), (err) => err instanceof NotFoundError);
});

test("the owner and an ADMIN can see the client", async () => {
  const { service } = setup();

  assert.equal((await service.getById(1, { id: 2, role: "TRAINER" })).id, 1);
  assert.equal((await service.getById(1, { id: 99, role: "ADMIN" })).id, 1);
});

test("list filters by trainer for TRAINER and not for ADMIN", async () => {
  const { service, calls } = setup();

  await service.list({ page: 1, limit: 10 }, { id: 2, role: "TRAINER" });
  await service.list({ page: 1, limit: 10 }, { id: 99, role: "ADMIN" });

  assert.equal(calls.pages[0].trainerId, 2);
  assert.equal(calls.pages[1].trainerId, undefined);
});

// 10. R6 - klient z zaplanowanymi treningami
test("remove rejects with CLIENT_HAS_SCHEDULED_SESSIONS when the client has scheduled sessions", async () => {
  const { service, calls } = setup({ scheduledCount: 2 });

  await assert.rejects(
    service.remove(1, { id: 2, role: "TRAINER" }),
    (err) => err instanceof ConflictError && err.code === "CLIENT_HAS_SCHEDULED_SESSIONS"
  );
  assert.equal(calls.removed.length, 0);
});

test("remove deletes the client when there are no scheduled sessions", async () => {
  const { service, calls } = setup({ scheduledCount: 0 });

  await service.remove(1, { id: 2, role: "TRAINER" });

  assert.deepEqual(calls.removed, [1]);
});
