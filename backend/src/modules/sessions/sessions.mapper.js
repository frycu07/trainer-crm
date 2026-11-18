function toSessionResponse(session) {
  return {
    id: session.id,
    client: {
      id: session.client.id,
      firstName: session.client.firstName,
      lastName: session.client.lastName
    },
    trainerId: session.trainerId,
    packageId: session.packageId,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    durationMinutes: (session.endsAt - session.startsAt) / 60000,
    status: session.status,
    notes: session.notes,
    createdAt: session.createdAt
  };
}

module.exports = { toSessionResponse };
