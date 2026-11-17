// DTO wyjsciowe - jawna lista pol, dzieki temu passwordHash nigdy nie wycieknie
function toUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt
  };
}

module.exports = { toUserResponse };
