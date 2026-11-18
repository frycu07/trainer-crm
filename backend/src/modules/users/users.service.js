const bcrypt = require("bcryptjs");
const { ConflictError, NotFoundError } = require("../../errors/AppError");

function createUsersService({ usersRepository, bcryptRounds }) {
  async function list() {
    return usersRepository.findAll();
  }

  async function create({ email, password, fullName, role }) {
    // email zawsze malymi literami - "Jan@X.pl" i "jan@x.pl" to jedno konto
    const normalizedEmail = email.toLowerCase();

    // ladny komunikat w typowym przypadku; gwarancje daje UNIQUE w bazie (errorHandler -> 409)
    if (await usersRepository.findByEmail(normalizedEmail)) {
      throw new ConflictError("Email already in use", "EMAIL_TAKEN");
    }

    const passwordHash = await bcrypt.hash(password, bcryptRounds);
    return usersRepository.create({ email: normalizedEmail, passwordHash, fullName, role });
  }

  async function remove(id, currentUser) {
    if (id === currentUser.id) {
      throw new ConflictError("You cannot delete your own account", "CANNOT_DELETE_SELF");
    }

    const deleted = await usersRepository.remove(id);
    if (deleted === 0) throw new NotFoundError("User");
  }

  return { list, create, remove };
}

module.exports = { createUsersService };
