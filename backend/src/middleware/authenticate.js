const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../errors/AppError");

const ROLES = ["ADMIN", "TRAINER"];

// middleware factory - sekret przychodzi z modulu konfiguracji, nie z process.env
function authenticate(jwtSecret) {
  return (req, res, next) => {
    const header = req.get("Authorization");
    if (!header) {
      return next(new UnauthorizedError("Authentication required"));
    }

    // dokladnie "Bearer <token>" - Basic ..., samo "Bearer", dodatkowe spacje/czesci -> 401
    // nazwa schematu bez rozrozniania wielkosci liter (RFC 7235)
    const [scheme, token, ...rest] = header.split(" ");
    if (scheme.toLowerCase() !== "bearer" || !token || rest.length > 0) {
      return next(new UnauthorizedError("Authorization header must be: Bearer <token>"));
    }

    let payload;
    try {
      // algorytm jawnie na whiteliscie - token z alg: none albo RS256 zostanie odrzucony
      payload = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(new UnauthorizedError("Token expired", "TOKEN_EXPIRED"));
      }
      // JsonWebTokenError: zly podpis, zmieniony payload, uszkodzony token
      return next(new UnauthorizedError("Invalid token", "INVALID_TOKEN"));
    }

    // podpis sie zgadza, ale i tak sprawdzam ksztalt claimow
    const id = Number(payload.sub);
    if (!Number.isInteger(id) || id <= 0 || !ROLES.includes(payload.role)) {
      return next(new UnauthorizedError("Invalid token", "INVALID_TOKEN"));
    }

    // jedyne wiarygodne zrodlo tozsamosci w dalszej czesci requestu
    req.user = { id, role: payload.role };
    next();
  };
}

module.exports = authenticate;
