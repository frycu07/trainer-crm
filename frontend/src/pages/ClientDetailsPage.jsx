import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";

const STATUS_LABELS = { SCHEDULED: "Zaplanowany", COMPLETED: "Zakończony", CANCELLED: "Odwołany" };

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
}

export default function ClientDetailsPage() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [packages, setPackages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [reloadCounter, setReloadCounter] = useState(0);

  // osobny blad dla kazdej sekcji, zeby baner byl przy formularzu, ktory go wywolal
  const [pageError, setPageError] = useState(null);
  const [packageError, setPackageError] = useState(null);
  const [sessionError, setSessionError] = useState(null);

  const [packageForm, setPackageForm] = useState({ name: "", totalSessions: "10", price: "", validUntil: "" });
  const [sessionForm, setSessionForm] = useState({ startsAt: "", durationMinutes: "60", notes: "" });

  useEffect(() => {
    Promise.all([
      api.get(`/clients/${id}`),
      api.get(`/packages?clientId=${id}`),
      api.get(`/sessions?clientId=${id}&limit=50`)
    ])
      .then(([clientData, packagesData, sessionsData]) => {
        setClient(clientData);
        setPackages(packagesData);
        setSessions(sessionsData.data);
      })
      .catch(setPageError);
  }, [id, reloadCounter]);

  function reload() {
    setReloadCounter(reloadCounter + 1);
  }

  async function handleAddPackage(event) {
    event.preventDefault();
    setPackageError(null);
    try {
      await api.post("/packages", {
        clientId: Number(id),
        name: packageForm.name,
        totalSessions: Number(packageForm.totalSessions),
        price: Number(packageForm.price),
        validUntil: packageForm.validUntil
      });
      setPackageForm({ name: "", totalSessions: "10", price: "", validUntil: "" });
      reload();
    } catch (err) {
      setPackageError(err);
    }
  }

  async function handleDeletePackage(pkg) {
    if (!window.confirm(`Usunąć pakiet "${pkg.name}"?`)) return;
    setPackageError(null);
    try {
      await api.delete(`/packages/${pkg.id}`);
      reload();
    } catch (err) {
      setPackageError(err);
    }
  }

  async function handleSchedule(event) {
    event.preventDefault();
    setSessionError(null);
    try {
      const body = {
        clientId: Number(id),
        // datetime-local nie ma strefy, new Date() traktuje go jako czas lokalny
        startsAt: new Date(sessionForm.startsAt).toISOString(),
        durationMinutes: Number(sessionForm.durationMinutes)
      };
      if (sessionForm.notes) body.notes = sessionForm.notes;

      await api.post("/sessions", body);
      setSessionForm({ startsAt: "", durationMinutes: "60", notes: "" });
      reload();
    } catch (err) {
      setSessionError(err);
    }
  }

  if (pageError) return <ErrorBanner error={pageError} />;
  if (!client) return <p className="center">Ładowanie...</p>;

  return (
    <div>
      <p><Link to="/clients">&larr; Wróć do klientów</Link></p>
      <h1>{client.firstName} {client.lastName}</h1>
      <div className="card">
        <p>E-mail: {client.email || "-"}</p>
        <p>Telefon: {client.phone || "-"}</p>
        <p>Cel treningowy: {client.goal || "-"}</p>
      </div>

      <h2>Pakiety</h2>
      <table>
        <thead>
          <tr>
            <th>Nazwa</th>
            <th>Wykorzystane</th>
            <th>Ważny do</th>
            <th>Cena</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => (
            <tr key={pkg.id}>
              <td>{pkg.name}</td>
              <td>{pkg.usedSessions} / {pkg.totalSessions}</td>
              <td>{pkg.validUntil}</td>
              <td>{pkg.price} zł</td>
              <td className="actions">
                <button className="danger" onClick={() => handleDeletePackage(pkg)}>Usuń</button>
              </td>
            </tr>
          ))}
          {packages.length === 0 && <tr><td colSpan="5">Klient nie ma pakietów.</td></tr>}
        </tbody>
      </table>

      <form className="card" onSubmit={handleAddPackage}>
        <h3>Dodaj pakiet</h3>
        <label>
          Nazwa
          <input value={packageForm.name} onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })} />
        </label>
        <label>
          Liczba treningów
          <input type="number" value={packageForm.totalSessions}
            onChange={(e) => setPackageForm({ ...packageForm, totalSessions: e.target.value })} />
        </label>
        <label>
          Cena (zł)
          <input type="number" step="0.01" value={packageForm.price}
            onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })} />
        </label>
        <label>
          Ważny do
          <input type="date" value={packageForm.validUntil}
            onChange={(e) => setPackageForm({ ...packageForm, validUntil: e.target.value })} />
        </label>
        <ErrorBanner error={packageError} />
        <div className="actions"><button type="submit">Dodaj pakiet</button></div>
      </form>

      <h2>Zaplanuj trening</h2>
      <form className="card" onSubmit={handleSchedule}>
        <label>
          Początek
          <input type="datetime-local" required value={sessionForm.startsAt}
            onChange={(e) => setSessionForm({ ...sessionForm, startsAt: e.target.value })} />
        </label>
        <label>
          Czas trwania (minuty)
          <input type="number" value={sessionForm.durationMinutes}
            onChange={(e) => setSessionForm({ ...sessionForm, durationMinutes: e.target.value })} />
        </label>
        <label>
          Notatka
          <textarea rows="2" value={sessionForm.notes}
            onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })} />
        </label>
        <ErrorBanner error={sessionError} />
        <div className="actions"><button type="submit">Zaplanuj</button></div>
      </form>

      <h2>Treningi klienta</h2>
      <table>
        <thead>
          <tr>
            <th>Termin</th>
            <th>Czas</th>
            <th>Status</th>
            <th>Notatka</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id}>
              <td>{formatDateTime(session.startsAt)}</td>
              <td>{session.durationMinutes} min</td>
              <td>{STATUS_LABELS[session.status]}</td>
              <td>{session.notes || "-"}</td>
            </tr>
          ))}
          {sessions.length === 0 && <tr><td colSpan="4">Brak treningów.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
