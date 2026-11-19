// jedyne miejsce z zapytaniami do tabeli notifications; zwraca obiekty w camelCase
function toEntity(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    message: row.message,
    isRead: row.is_read,
    createdAt: row.created_at
  };
}

function createNotificationsRepository(db) {
  return {
    async create({ userId, message }) {
      const [row] = await db("notifications").insert({ user_id: userId, message }).returning("*");
      return toEntity(row);
    },

    // najnowsze pierwsze
    async findByUser(userId, limit) {
      const rows = await db("notifications")
        .where({ user_id: userId })
        .orderBy("created_at", "desc").orderBy("id", "desc")
        .limit(limit);
      return rows.map(toEntity);
    },

    async findById(id) {
      return toEntity(await db("notifications").where({ id }).first());
    },

    async markRead(id) {
      const [row] = await db("notifications").where({ id }).update({ is_read: true }).returning("*");
      return toEntity(row);
    }
  };
}

module.exports = { createNotificationsRepository };
