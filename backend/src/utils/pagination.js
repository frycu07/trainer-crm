// wspolny ksztalt "pagination" w odpowiedziach list
function buildPagination(page, limit, total) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

module.exports = { buildPagination };
