const { NotFoundError } = require("../../errors/AppError");

const LIST_LIMIT = 50;

function createNotificationsService({ notificationsRepository }) {
  // zawsze tylko wlasne powiadomienia - takze dla ADMINa
  async function list(currentUser) {
    return notificationsRepository.findByUser(currentUser.id, LIST_LIMIT);
  }

  async function markRead(id, currentUser) {
    const notification = await notificationsRepository.findById(id);
    // cudze powiadomienie = 404, nie zdradzamy, ze istnieje
    if (!notification || notification.userId !== currentUser.id) {
      throw new NotFoundError("Notification");
    }
    return notificationsRepository.markRead(id);
  }

  return { list, markRead };
}

module.exports = { createNotificationsService };
