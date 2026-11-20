import { useEffect, useState } from "react";
import { api } from "../api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/notifications").then(setNotifications).catch(setError);
  }, [reloadCounter]);

  async function handleMarkRead(notification) {
    setError(null);
    try {
      await api.patch(`/notifications/${notification.id}/read`);
      setReloadCounter(reloadCounter + 1);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div>
      <h1>Powiadomienia</h1>
      <ErrorBanner error={error} />

      {notifications.map((notification) => (
        <div key={notification.id} className={notification.isRead ? "notification" : "notification unread"}>
          <div>
            <p>{notification.message}</p>
            <small>{new Date(notification.createdAt).toLocaleString("pl-PL")}</small>
          </div>
          {!notification.isRead && (
            <button className="secondary" onClick={() => handleMarkRead(notification)}>
              Oznacz jako przeczytane
            </button>
          )}
        </div>
      ))}
      {notifications.length === 0 && <p>Brak powiadomień.</p>}
    </div>
  );
}
