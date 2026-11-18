// jedyne miejsce z zapytaniami do tabeli clients; zwraca obiekty w camelCase
function toEntity(row) {
  if (!row) return null;
  return {
    id: row.id,
    trainerId: row.trainer_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    goal: row.goal,
    createdAt: row.created_at
  };
}

function toRow(data) {
  return {
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email ?? null,
    phone: data.phone ?? null,
    goal: data.goal ?? null
  };
}

function createClientsRepository(db) {
  // wspolne warunki dla listy i zliczania (trainerId bez wartosci = ADMIN widzi wszystkich)
  function filtered({ trainerId, q }) {
    const query = db("clients");
    if (trainerId !== undefined) query.where({ trainer_id: trainerId });
    if (q) {
      // % i _ wpisane przez uzytkownika szukamy dosłownie, nie jako wzorce
      const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
      query.where(builder => builder
        .whereILike("first_name", pattern)
        .orWhereILike("last_name", pattern)
        .orWhereILike("email", pattern));
    }
    return query;
  }

  return {
    async findPage({ trainerId, q, page, limit }) {
      const rows = await filtered({ trainerId, q })
        .orderBy("last_name").orderBy("first_name").orderBy("id")
        .limit(limit)
        .offset((page - 1) * limit);
      const [{ count }] = await filtered({ trainerId, q }).count("* as count");
      // count z pg to string
      return { rows: rows.map(toEntity), total: Number(count) };
    },

    async findById(id) {
      return toEntity(await db("clients").where({ id }).first());
    },

    async create(data) {
      const [row] = await db("clients")
        .insert({ trainer_id: data.trainerId, ...toRow(data) })
        .returning("*");
      return toEntity(row);
    },

    async update(id, data) {
      const [row] = await db("clients").where({ id }).update(toRow(data)).returning("*");
      return toEntity(row);
    },

    async remove(id) {
      return db("clients").where({ id }).del();
    }
  };
}

module.exports = { createClientsRepository };
