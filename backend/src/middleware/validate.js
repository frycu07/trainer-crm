const { ValidationError } = require("../errors/AppError");

// middleware factory - validate({ params, query, body })
// zbiera bledy ze wszystkich czesci requestu i zwraca je naraz
function validate(schemas) {
  return (req, res, next) => {
    const validated = {};
    const details = [];

    for (const part of ["params", "query", "body"]) {
      if (!schemas[part]) continue;

      const result = schemas[part].safeParse(req[part] ?? {});

      if (!result.success) {
        for (const issue of result.error.issues) {
          details.push({
            location: part,
            // przy nieznanym polu path jest pusty, wtedy biore nazwe klucza z issue.keys
            field: issue.path.length > 0 ? issue.path.join(".") : (issue.keys ?? []).join(", "),
            message: issue.message
          });
        }
        continue;
      }

      validated[part] = result.data;
    }

    if (details.length > 0) {
      return next(new ValidationError(details));
    }

    // w Express 5 req.query jest getterem, dlatego osobne pole
    req.validated = validated;
    next();
  };
}

module.exports = validate;
