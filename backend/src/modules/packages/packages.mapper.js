function toPackageResponse(pkg) {
  return {
    id: pkg.id,
    clientId: pkg.clientId,
    name: pkg.name,
    totalSessions: pkg.totalSessions,
    usedSessions: pkg.usedSessions,
    remainingSessions: pkg.totalSessions - pkg.usedSessions,
    price: Number(pkg.price),
    validUntil: pkg.validUntil,
    createdAt: pkg.createdAt
  };
}

module.exports = { toPackageResponse };
