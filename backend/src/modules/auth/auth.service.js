const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../../errors/AppError");

function createAuthService({ usersRepository, jwtSecret, jwtExpiresIn }) {
  async function login(email, password) {
    const user = await usersRepository.findByEmail(email);
    const passwordOk = user ? await bcrypt.compare(password, user.passwordHash) : false;

    // jeden komunikat dla zlego emaila i zlego hasla - nie zdradzamy, ktore konta istnieja
    if (!user || !passwordOk) {
      throw new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    // w tokenie tylko id i rola - JWT jest podpisany, ale nie zaszyfrowany
    const token = jwt.sign({ role: user.role }, jwtSecret, {
      subject: String(user.id),
      expiresIn: jwtExpiresIn,
      algorithm: "HS256"
    });

    return { token, user };
  }

  async function getMe(userId) {
    const user = await usersRepository.findById(userId);
    // token poprawny, ale konta juz nie ma
    if (!user) throw new UnauthorizedError("User no longer exists", "INVALID_TOKEN");
    return user;
  }

  return { login, getMe };
}

module.exports = { createAuthService };
