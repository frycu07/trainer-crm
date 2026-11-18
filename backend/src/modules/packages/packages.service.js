const { ConflictError, NotFoundError } = require("../../errors/AppError");

// dostep do pakietu = dostep do jego klienta, dlatego service pyta clientsService
function createPackagesService({ packagesRepository, clientsService }) {
  async function findAccessiblePackage(id, currentUser) {
    const pkg = await packagesRepository.findById(id);
    if (!pkg) throw new NotFoundError("Package");
    // cudzy klient -> 404 (rzuca clientsService)
    await clientsService.getById(pkg.clientId, currentUser);
    return pkg;
  }

  async function listByClient(clientId, currentUser) {
    await clientsService.getById(clientId, currentUser);
    return packagesRepository.findByClientId(clientId);
  }

  async function create(input, currentUser) {
    await clientsService.getById(input.clientId, currentUser);
    return packagesRepository.create(input);
  }

  async function update(id, input, currentUser) {
    const pkg = await findAccessiblePackage(id, currentUser);

    // nie mozna zmniejszyc pakietu ponizej liczby wejsc, ktore juz zarezerwowano lub wykorzystano
    if (input.totalSessions < pkg.usedSessions) {
      throw new ConflictError("Total sessions cannot be lower than used sessions", "PACKAGE_TOTAL_BELOW_USED");
    }

    return packagesRepository.update(id, input);
  }

  async function remove(id, currentUser) {
    await findAccessiblePackage(id, currentUser);
    // pakiet z treningami zatrzyma baza (FK 23503) -> errorHandler zamieni to na 409
    await packagesRepository.remove(id);
  }

  return { listByClient, create, update, remove };
}

module.exports = { createPackagesService };
