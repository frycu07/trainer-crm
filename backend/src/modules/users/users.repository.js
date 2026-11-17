// jedyne miejsce z zapytaniami do tabeli users; zwraca obiekty w camelCase
function toEntity(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    fullName: row.full_name,
    role: row.role,
    createdAt: row.created_at
  };
}

function createUsersRepository(db) {
  return {
    async findByEmail(email) {
      return toEntity(await db("users").where({ email }).first());
    },

    async findById(id) {
      return toEntity(await db("users").where({ id }).first());
    },

    async findAll() {
      const rows = await db("users").orderBy("id");
      return rows.map(toEntity);
    },

    async create({ email, passwordHash, fullName, role }) {
      const [row] = await db("users")
        .insert({ email, password_hash: passwordHash, full_name: fullName, role })
        .returning("*");
      return toEntity(row);
    },

    // zwraca liczbe usunietych wierszy (0 = nie bylo takiego uzytkownika)
    async remove(id) {
      return db("users").where({ id }).del();
    }
  };
}

module.exports = { createUsersRepository };
