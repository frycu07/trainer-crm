const { NotFoundError, ValidationError, ConflictError } = require("../../errors/AppError");

// R4: dozwolone przejscia statusow - wszystko inne to 409
const ALLOWED_TRANSITIONS = {
  SCHEDULED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: []
};

// R5: odwolac mozna najpozniej 24 h przed startem
const CANCELLATION_LIMIT_MS = 24 * 60 * 60 * 1000;

function assertTransition(from, to) {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new ConflictError(`Cannot change session status from ${from} to ${to}`, "INVALID_STATUS_TRANSITION");
  }
}

// czysta funkcja (bez bazy) - latwa do unit testu
// pakiet nadaje sie, gdy ma wolne wejscia i jest wazny w dniu treningu; wygrywa ten, ktory wygasa najwczesniej
function findUsablePackage(packages, startsAt) {
  const day = startsAt.toISOString().slice(0, 10);
  return packages
    .filter((p) => p.usedSessions < p.totalSessions && p.validUntil >= day)
    .sort((a, b) => a.validUntil.localeCompare(b.validUntil))[0] ?? null;
}

// zaleznosci przychodza z zewnatrz - unit testy podstawiaja zwykle obiekty zamiast bazy
// now tez jest wstrzykiwane, zeby test mogl ustawic "dzisiaj" na stala date
function createSessionsService({ sessionsRepository, clientsRepository, packagesRepository, now = () => new Date() }) {
  // klient istnieje i nalezy do trenera (albo user jest ADMINem); w przeciwnym razie 404
  async function findAccessibleClient(id, currentUser) {
    const client = await clientsRepository.findById(id);
    if (!client || (currentUser.role !== "ADMIN" && client.trainerId !== currentUser.id)) {
      throw new NotFoundError("Client");
    }
    return client;
  }

  async function findAccessibleSession(id, currentUser) {
    const session = await sessionsRepository.findById(id);
    if (!session || (currentUser.role !== "ADMIN" && session.trainerId !== currentUser.id)) {
      throw new NotFoundError("Session");
    }
    return session;
  }

  async function schedule(input, currentUser) {
    const client = await findAccessibleClient(input.clientId, currentUser);

    // R3: nie planujemy w przeszlosci
    const startsAt = new Date(input.startsAt);
    if (startsAt < now()) {
      throw new ValidationError([
        { location: "body", field: "startsAt", message: "startsAt must be in the future" }
      ]);
    }
    const endsAt = new Date(startsAt.getTime() + input.durationMinutes * 60 * 1000);

    // R2: trener nie moze miec dwoch nakladajacych sie treningow
    // trener treningu to trener klienta (ADMIN planuje w imieniu trenera klienta)
    const overlapping = await sessionsRepository.findOverlapping(client.trainerId, startsAt, endsAt);
    if (overlapping.length > 0) {
      throw new ConflictError("Trainer already has a session in this time slot", "TRAINER_NOT_AVAILABLE");
    }

    // R1: potrzebny aktywny pakiet
    const packages = await packagesRepository.findByClientId(client.id);
    const pkg = findUsablePackage(packages, startsAt);
    if (!pkg) {
      throw new ConflictError("Client has no active package", "NO_ACTIVE_PACKAGE");
    }

    // INSERT + rezerwacja wejscia w jednej transakcji (ukrytej w repozytorium)
    return sessionsRepository.createAndUsePackage({
      clientId: client.id,
      trainerId: client.trainerId,
      packageId: pkg.id,
      startsAt,
      endsAt,
      notes: input.notes
    });
  }

  async function list(query, currentUser) {
    const trainerId = currentUser.role === "ADMIN" ? undefined : currentUser.id;
    return sessionsRepository.findPage({ ...query, trainerId });
  }

  async function getById(id, currentUser) {
    return findAccessibleSession(id, currentUser);
  }

  async function updateNotes(id, notes, currentUser) {
    await findAccessibleSession(id, currentUser);
    return sessionsRepository.updateNotes(id, notes);
  }

  async function complete(id, currentUser) {
    const session = await findAccessibleSession(id, currentUser);
    assertTransition(session.status, "COMPLETED");
    return sessionsRepository.updateStatus(id, "COMPLETED");
  }

  async function cancel(id, currentUser) {
    const session = await findAccessibleSession(id, currentUser);
    assertTransition(session.status, "CANCELLED");

    if (session.startsAt.getTime() - now().getTime() < CANCELLATION_LIMIT_MS) {
      throw new ConflictError("Session can be cancelled at least 24 hours before it starts", "CANCELLATION_TOO_LATE");
    }

    // zmiana statusu i zwrot wejscia do pakietu - jedna transakcja w repozytorium
    return sessionsRepository.cancelAndReleasePackage(id, session.packageId);
  }

  // endpoint tylko dla ADMINa (authorize w routes); usuwamy wylacznie trening, ktory juz nie jest zaplanowany
  async function remove(id) {
    const session = await sessionsRepository.findById(id);
    if (!session) throw new NotFoundError("Session");
    if (session.status === "SCHEDULED") {
      throw new ConflictError("Scheduled session must be cancelled or completed before deleting", "SESSION_STILL_SCHEDULED");
    }
    await sessionsRepository.remove(id);
  }

  return { schedule, list, getById, updateNotes, complete, cancel, remove };
}

module.exports = { createSessionsService, findUsablePackage, ALLOWED_TRANSITIONS };
