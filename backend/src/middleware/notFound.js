const { NotFoundError } = require("../errors/AppError");

// rejestrowany po wszystkich routes - jak request tu doszedl, to nikt go nie obsluzyl
module.exports = (req, res, next) => next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
