const { ConflictError } = require("../../errors/AppError");

// jedyne miejsce z zapytaniami do tabeli training_sessions; zwraca obiekty w camelCase
// trening zawsze przychodzi z danymi klienta (JOIN), bo lista pokazuje imie i nazwisko
function toEntity(row) {
  if (!row) return null;
  return {
    id: row.id,
    client: { id: row.client_id, firstName: row.client_first_name, lastName: row.client_last_name },
    clientId: row.client_id,
    trainerId: row.trainer_id,
    packageId: row.package_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at
  };
}

function createSessionsRepository(db) {
  function withClient(query) {
    return query
      .join("clients as c", "c.id", "s.client_id")
      .select("s.*", "c.first_name as client_first_name", "c.last_name as client_last_name");
  }

  async function findById(id) {
    return toEntity(await withClient(db("training_sessions as s")).where("s.id", id).first());
  }

  // wspolne warunki dla listy i zliczania (trainerId bez wartosci = ADMIN widzi wszystkich)
  function filtered({ trainerId, status, clientId, from, to }) {
    const query = db("training_sessions as s");
    if (trainerId !== undefined) query.where("s.trainer_id", trainerId);
    if (status) query.where("s.status", status);
    if (clientId) query.where("s.client_id", clientId);
    if (from) query.where("s.starts_at", ">=", from);
    if (to) query.where("s.starts_at", "<", to);
    return query;
  }

  return {
    findById,

    async findPage({ trainerId, status, clientId, from, to, page, limit }) {
      const filters = { trainerId, status, clientId, from, to };
      const rows = await withClient(filtered(filters))
        .orderBy("s.starts_at").orderBy("s.id")
        .limit(limit)
        .offset((page - 1) * limit);
      const [{ count }] = await filtered(filters).count("* as count");
      // count z pg to string
      return { rows: rows.map(toEntity), total: Number(count) };
    },

    // przedzialy polotwarte [start, end) - treningi stykajace sie nie koliduja
    async findOverlapping(trainerId, startsAt, endsAt) {
      const rows = await db("training_sessions")
        .where({ trainer_id: trainerId, status: "SCHEDULED" })
        .andWhere("starts_at", "<", endsAt)
        .andWhere("ends_at", ">", startsAt);
      return rows.map(toEntity);
    },

    // INSERT treningu i rezerwacja wejscia z pakietu w jednej transakcji - albo oba, albo zadne
    async createAndUsePackage({ clientId, trainerId, packageId, startsAt, endsAt, notes }) {
      const id = await db.transaction(async trx => {
        // warunek w WHERE pilnuje, ze pakiet nie zostal wyczerpany przez rownolegly request
        const updated = await trx("packages")
          .where({ id: packageId })
          .andWhere("used_sessions", "<", trx.ref("total_sessions"))
          .increment("used_sessions", 1);
        if (updated === 0) {
          throw new ConflictError("Client has no active package", "NO_ACTIVE_PACKAGE");
        }

        const [row] = await trx("training_sessions")
          .insert({
            client_id: clientId,
            trainer_id: trainerId,
            package_id: packageId,
            starts_at: startsAt,
            ends_at: endsAt,
            notes: notes ?? null
          })
          .returning("id");
        return row.id;
      });
      return findById(id);
    },

    async updateNotes(id, notes) {
      await db("training_sessions").where({ id }).update({ notes });
      return findById(id);
    }
  };
}

module.exports = { createSessionsRepository };
