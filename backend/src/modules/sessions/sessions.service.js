const { NotFoundError, ValidationError, ConflictError } = require("../../errors/AppError");

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

  return { schedule, list, getById, updateNotes };
}

module.exports = { createSessionsService, findUsablePackage };
