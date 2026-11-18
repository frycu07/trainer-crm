// jedyne miejsce z zapytaniami do tabeli packages; zwraca obiekty w camelCase
function toEntity(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    totalSessions: row.total_sessions,
    usedSessions: row.used_sessions,
    price: row.price, // numeric z pg to string - zamienia mapper
    validUntil: row.valid_until, // string YYYY-MM-DD (parser DATE w db/knex.js)
    createdAt: row.created_at
  };
}

function createPackagesRepository(db) {
  return {
    async findByClientId(clientId) {
      const rows = await db("packages").where({ client_id: clientId }).orderBy("valid_until").orderBy("id");
      return rows.map(toEntity);
    },

    async findById(id) {
      return toEntity(await db("packages").where({ id }).first());
    },

    async create({ clientId, name, totalSessions, price, validUntil }) {
      const [row] = await db("packages")
        .insert({ client_id: clientId, name, total_sessions: totalSessions, price, valid_until: validUntil })
        .returning("*");
      return toEntity(row);
    },

    async update(id, { name, totalSessions, price, validUntil }) {
      const [row] = await db("packages")
        .where({ id })
        .update({ name, total_sessions: totalSessions, price, valid_until: validUntil })
        .returning("*");
      return toEntity(row);
    },

    async remove(id) {
      return db("packages").where({ id }).del();
    }
  };
}

module.exports = { createPackagesRepository };
