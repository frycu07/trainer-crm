// unit testy logiki treningow - bez bazy i bez Expressa
// repozytoria to zwykle obiekty z async funkcjami, "dzisiaj" ustawione na stala date
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createSessionsService, findUsablePackage } = require("../../src/modules/sessions/sessions.service");
const { NotFoundError, ValidationError, ConflictError } = require("../../src/errors/AppError");

const NOW = new Date("2026-12-01T08:00:00.000Z");
const trainer = { id: 2, role: "TRAINER" };
const client = { id: 1, trainerId: 2, firstName: "Jan", lastName: "Kowalski" };

function makePackage(overrides = {}) {
  return { id: 10, clientId: 1, name: "Pakiet 10", totalSessions: 10, usedSessions: 0, validUntil: "2027-03-31", ...overrides };
}

// zlozenie service z atrapami - kazdy test podmienia tylko to, co go interesuje
function setup({ packages = [makePackage()], overlapping = [], session = null } = {}) {
  const calls = { created: [], cancelled: [], events: [] };

  const sessionsRepository = {
    findOverlapping: async () => overlapping,
    createAndUsePackage: async (data) => {
      calls.created.push(data);
      return { id: 99, ...data };
    },
    findById: async () => session,
    cancelAndReleasePackage: async (id, packageId) => {
      calls.cancelled.push({ id, packageId });
      return { ...session, status: "CANCELLED" };
    },
    updateStatus: async (id, status) => ({ ...session, status })
  };
  const clientsRepository = { findById: async (id) => (id === client.id ? client : null) };
  const packagesRepository = { findByClientId: async () => packages };
  const eventBus = { emit: (name, payload) => calls.events.push({ name, payload }) };

  const service = createSessionsService({
    sessionsRepository, clientsRepository, packagesRepository, eventBus, now: () => NOW
  });
  return { service, calls };
}

// 1. findUsablePackage pomija pakiet bez wolnych wejsc
test("findUsablePackage skips a package with no free sessions", () => {
  const full = makePackage({ id: 1, totalSessions: 5, usedSessions: 5 });
  const free = makePackage({ id: 2, totalSessions: 5, usedSessions: 4 });

  assert.equal(findUsablePackage([full, free], new Date("2026-12-10T10:00:00Z")).id, 2);
  assert.equal(findUsablePackage([full], new Date("2026-12-10T10:00:00Z")), null);
});

// 2. findUsablePackage pomija przeterminowany i wybiera najwczesniej wygasajacy
test("findUsablePackage skips an expired package and picks the one expiring first", () => {
  const expired = makePackage({ id: 1, validUntil: "2026-12-05" });
  const late = makePackage({ id: 2, validUntil: "2027-06-30" });
  const early = makePackage({ id: 3, validUntil: "2027-01-31" });

  const found = findUsablePackage([expired, late, early], new Date("2026-12-10T10:00:00Z"));
  assert.equal(found.id, 3);
});

// 3. R1 - brak pakietu
test("schedule rejects with NO_ACTIVE_PACKAGE when the client has no package", async () => {
  const { service, calls } = setup({ packages: [] });

  await assert.rejects(
    service.schedule({ clientId: 1, startsAt: "2026-12-10T10:00:00Z", durationMinutes: 60 }, trainer),
    (err) => err instanceof ConflictError && err.code === "NO_ACTIVE_PACKAGE"
  );
  assert.equal(calls.created.length, 0);
});

// 4. R2 - trener zajety
test("schedule rejects with TRAINER_NOT_AVAILABLE when the slot overlaps", async () => {
  const { service, calls } = setup({ overlapping: [{ id: 5 }] });

  await assert.rejects(
    service.schedule({ clientId: 1, startsAt: "2026-12-10T10:00:00Z", durationMinutes: 60 }, trainer),
    (err) => err instanceof ConflictError && err.code === "TRAINER_NOT_AVAILABLE"
  );
  assert.equal(calls.created.length, 0);
});

// 5. R3 - data w przeszlosci
test("schedule rejects a date in the past with a ValidationError", async () => {
  const { service } = setup();

  await assert.rejects(
    service.schedule({ clientId: 1, startsAt: "2026-11-30T10:00:00Z", durationMinutes: 60 }, trainer),
    (err) => err instanceof ValidationError && err.details[0].field === "startsAt"
  );
});

// 6. sukces - poprawny pakiet i endsAt
test("schedule creates the session with the right package and endsAt", async () => {
  const { service, calls } = setup({ packages: [makePackage({ id: 7 })] });

  await service.schedule({ clientId: 1, startsAt: "2026-12-10T10:00:00Z", durationMinutes: 90 }, trainer);

  assert.equal(calls.created.length, 1);
  assert.equal(calls.created[0].packageId, 7);
  assert.equal(calls.created[0].trainerId, 2);
  assert.equal(calls.created[0].endsAt.toISOString(), "2026-12-10T11:30:00.000Z");
});

// 7. R5 - za pozno na odwolanie
test("cancel rejects with CANCELLATION_TOO_LATE less than 24 h before the start", async () => {
  const session = { id: 1, trainerId: 2, packageId: 10, status: "SCHEDULED", startsAt: new Date("2026-12-02T07:00:00Z") };
  const { service, calls } = setup({ session });

  await assert.rejects(
    service.cancel(1, trainer),
    (err) => err instanceof ConflictError && err.code === "CANCELLATION_TOO_LATE"
  );
  assert.equal(calls.cancelled.length, 0);
});

test("cancel releases the package when there are more than 24 h left", async () => {
  const session = { id: 1, trainerId: 2, packageId: 10, status: "SCHEDULED", startsAt: new Date("2026-12-05T10:00:00Z") };
  const { service, calls } = setup({ session });

  const result = await service.cancel(1, trainer);

  assert.equal(result.status, "CANCELLED");
  assert.deepEqual(calls.cancelled, [{ id: 1, packageId: 10 }]);
});

// 8. R4 - niedozwolone przejscia statusow
test("cancel and complete reject with INVALID_STATUS_TRANSITION for a COMPLETED session", async () => {
  const session = { id: 1, trainerId: 2, packageId: 10, status: "COMPLETED", startsAt: new Date("2026-12-20T10:00:00Z") };
  const { service } = setup({ session });
  const isInvalidTransition = (err) => err instanceof ConflictError && err.code === "INVALID_STATUS_TRANSITION";

  await assert.rejects(service.cancel(1, trainer), isInvalidTransition);
  await assert.rejects(service.complete(1, trainer), isInvalidTransition);
});

// ownership
test("schedule returns NotFoundError for another trainer's client", async () => {
  const { service } = setup();

  await assert.rejects(
    service.schedule({ clientId: 1, startsAt: "2026-12-10T10:00:00Z", durationMinutes: 60 }, { id: 3, role: "TRAINER" }),
    (err) => err instanceof NotFoundError
  );
});

// mechanizm asynchroniczny - service tylko emituje zdarzenia
test("schedule emits session.scheduled and package.exhausted when the last session is used", async () => {
  const { service, calls } = setup({ packages: [makePackage({ totalSessions: 3, usedSessions: 2 })] });

  await service.schedule({ clientId: 1, startsAt: "2026-12-10T10:00:00Z", durationMinutes: 60 }, trainer);
  // emisja jest w setImmediate, wiec czekamy, az petla zdarzen ja wykona
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(calls.events.map((e) => e.name), ["session.scheduled", "package.exhausted"]);
  assert.equal(calls.events[0].payload.clientName, "Jan Kowalski");
  assert.equal(calls.events[1].payload.packageName, "Pakiet 10");
});
