const { NotFoundError } = require("../../errors/AppError");

function createClientsService({ clientsRepository }) {
  // klient istnieje i nalezy do trenera (albo user jest ADMINem); w przeciwnym razie 404
  // cudzy klient = 404, a nie 403 - nie zdradzamy, ze taki zasob istnieje
  async function findAccessibleClient(id, currentUser) {
    const client = await clientsRepository.findById(id);
    if (!client || (currentUser.role !== "ADMIN" && client.trainerId !== currentUser.id)) {
      throw new NotFoundError("Client");
    }
    return client;
  }

  async function list({ page, limit, q }, currentUser) {
    const trainerId = currentUser.role === "ADMIN" ? undefined : currentUser.id;
    return clientsRepository.findPage({ trainerId, q, page, limit });
  }

  async function getById(id, currentUser) {
    return findAccessibleClient(id, currentUser);
  }

  async function create(input, currentUser) {
    return clientsRepository.create({ ...input, trainerId: currentUser.id });
  }

  async function update(id, input, currentUser) {
    await findAccessibleClient(id, currentUser);
    return clientsRepository.update(id, input);
  }

  async function remove(id, currentUser) {
    await findAccessibleClient(id, currentUser);
    await clientsRepository.remove(id);
  }

  return { list, getById, create, update, remove };
}

module.exports = { createClientsService };
