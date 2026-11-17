const { ForbiddenError, UnauthorizedError } = require("../errors/AppError");

// kontrola roli - decyzja zalezy tylko od roli i endpointu, wiec nadaje sie do middleware
// (ownership wymaga danych z bazy, dlatego jest w service)
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Requires role: ${allowedRoles.join(" or ")}`));
    }
    next();
  };
}

module.exports = authorize;
