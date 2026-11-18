function toClientResponse(client) {
  return {
    id: client.id,
    trainerId: client.trainerId,
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email,
    phone: client.phone,
    goal: client.goal,
    createdAt: client.createdAt
  };
}

module.exports = { toClientResponse };
