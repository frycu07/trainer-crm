// data w strefie trenera, np. "01.12.2026, 11:00"
const dateFormat = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Warsaw"
});

function formatDate(date) {
  return dateFormat.format(date);
}

// listenery dzialaja poza obsluga requestu - odpowiedz HTTP nie czeka na zapis powiadomienia
// blad listenera nie moze wywrocic aplikacji, dlatego try/catch i tylko log
function registerNotificationListeners({ eventBus, notificationsRepository }) {
  eventBus.on("session.scheduled", async (event) => {
    try {
      await notificationsRepository.create({
        userId: event.trainerId,
        message: `Zaplanowano trening: ${event.clientName}, ${formatDate(event.startsAt)}`
      });
    } catch (err) {
      console.error("notification listener failed", err);
    }
  });

  eventBus.on("package.exhausted", async (event) => {
    try {
      await notificationsRepository.create({
        userId: event.trainerId,
        message: `Pakiet "${event.packageName}" klienta ${event.clientName} zostal wykorzystany`
      });
    } catch (err) {
      console.error("notification listener failed", err);
    }
  });
}

module.exports = { registerNotificationListeners };
