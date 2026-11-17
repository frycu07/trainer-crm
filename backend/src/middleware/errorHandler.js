const { AppError } = require("../errors/AppError");

// bledy constraints z PostgreSQL (SQLSTATE) -> odpowiedz HTTP
// celowo bez err.detail / err.constraint - tam sa nazwy tabel, kolumn i wartosci
const DB_ERRORS = {
  "23505": { status: 409, code: "UNIQUE_VIOLATION", message: "Resource already exists" },
  "23503": { status: 409, code: "FOREIGN_KEY_VIOLATION", message: "Related resource does not exist or is still in use" },
  "23514": { status: 400, code: "CHECK_VIOLATION", message: "Data violates a database rule" }
};

// jedyne miejsce, ktore zamienia bledy na odpowiedz HTTP
// next musi byc w sygnaturze (4 parametry), inaczej Express nie uzna tego za error handler
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details ?? [] }
    });
  }

  // blad z express.json() przy zepsutym body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: { code: "INVALID_JSON", message: "Request body is not valid JSON", details: [] }
    });
  }

  const dbError = DB_ERRORS[err.code];
  if (dbError) {
    // szczegoly tylko w logach serwera
    console.warn(`db error ${err.code}: ${err.constraint ?? err.message}`);
    return res.status(dbError.status).json({
      error: { code: dbError.code, message: dbError.message, details: [] }
    });
  }

  // cala reszta - stack tylko do logow, klient dostaje ogolny komunikat
  console.error(err);

  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Unexpected error", details: [] }
  });
}

module.exports = errorHandler;
