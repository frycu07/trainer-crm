import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";

const LIMIT = 10;
const STATUS_LABELS = { SCHEDULED: "Zaplanowany", COMPLETED: "Zakończony", CANCELLED: "Odwołany" };

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
}

export default function SessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [reloadCounter, setReloadCounter] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (status) params.set("status", status);

    api.get(`/sessions?${params}`)
      .then((data) => {
        setSessions(data.data);
        setPagination(data.pagination);
      })
      .catch(setError);
  }, [page, status, reloadCounter]);

  function handleStatusChange(event) {
    setStatus(event.target.value);
    setPage(1);
  }

  // jedna funkcja dla trzech akcji: zakoncz, odwolaj, usun
  async function runAction(action) {
    setError(null);
    try {
      await action();
      setReloadCounter(reloadCounter + 1);
    } catch (err) {
      setError(err);
    }
  }

  function handleDelete(session) {
    if (!window.confirm("Usunąć ten trening?")) return;
    // usunięcie ostatniego wiersza na stronie cofa o stronę
    if (sessions.length === 1 && page > 1) setPage(page - 1);
    runAction(() => api.delete(`/sessions/${session.id}`));
  }

  return (
    <div>
      <h1>Treningi</h1>

      <div className="search">
        <select value={status} onChange={handleStatusChange}>
          <option value="">Wszystkie statusy</option>
          <option value="SCHEDULED">Zaplanowane</option>
          <option value="COMPLETED">Zakończone</option>
          <option value="CANCELLED">Odwołane</option>
        </select>
      </div>

      <ErrorBanner error={error} />

      <table>
        <thead>
          <tr>
            <th>Termin</th>
            <th>Klient</th>
            <th>Czas</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id}>
              <td>{formatDateTime(session.startsAt)}</td>
              <td>
                <Link to={`/clients/${session.client.id}`}>
                  {session.client.firstName} {session.client.lastName}
                </Link>
              </td>
              <td>{session.durationMinutes} min</td>
              <td>{STATUS_LABELS[session.status]}</td>
              <td className="actions">
                {session.status === "SCHEDULED" && (
                  <>
                    <button onClick={() => runAction(() => api.patch(`/sessions/${session.id}/complete`))}>Zakończ</button>
                    <button className="secondary" onClick={() => runAction(() => api.patch(`/sessions/${session.id}/cancel`))}>Odwołaj</button>
                  </>
                )}
                {user.role === "ADMIN" && (
                  <button className="danger" onClick={() => handleDelete(session)}>Usuń</button>
                )}
              </td>
            </tr>
          ))}
          {sessions.length === 0 && <tr><td colSpan="5">Brak treningów.</td></tr>}
        </tbody>
      </table>

      <div className="pagination">
        <button className="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Poprzednia</button>
        <span>strona {pagination.page} z {pagination.totalPages || 1}</span>
        <button className="secondary" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Następna</button>
      </div>
    </div>
  );
}
