import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import ClientForm from "../components/ClientForm.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";

const LIMIT = 10;

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  // searchInput to to, co wpisano; search to fraza, wg ktorej faktycznie szukamy
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  // null = formularz zamkniety, "new" = dodawanie, obiekt klienta = edycja
  const [editing, setEditing] = useState(null);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (search) params.set("q", search);

    api.get(`/clients?${params}`)
      .then((data) => {
        setClients(data.data);
        setPagination(data.pagination);
      })
      .catch(setError);
  }, [page, search, reloadCounter]);

  function reload() {
    setReloadCounter(reloadCounter + 1);
  }

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function handleSave(body) {
    if (editing === "new") {
      await api.post("/clients", body);
    } else {
      await api.put(`/clients/${editing.id}`, body);
    }
    setEditing(null);
    reload();
  }

  async function handleDelete(client) {
    if (!window.confirm(`Usunąć klienta ${client.firstName} ${client.lastName}?`)) return;
    setError(null);
    try {
      await api.delete(`/clients/${client.id}`);
      // usunięto ostatniego klienta na stronie - cofamy się o stronę
      if (clients.length === 1 && page > 1) setPage(page - 1);
      reload();
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Klienci</h1>
        <button onClick={() => setEditing("new")}>Dodaj klienta</button>
      </div>

      <form className="search" onSubmit={handleSearch}>
        <input
          placeholder="Szukaj po imieniu, nazwisku lub e-mailu"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit">Szukaj</button>
      </form>

      <ErrorBanner error={error} />

      {editing && (
        <ClientForm
          key={editing === "new" ? "new" : editing.id}
          client={editing === "new" ? null : editing}
          onSaved={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      <table>
        <thead>
          <tr>
            <th>Klient</th>
            <th>E-mail</th>
            <th>Telefon</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td><Link to={`/clients/${client.id}`}>{client.firstName} {client.lastName}</Link></td>
              <td>{client.email || "-"}</td>
              <td>{client.phone || "-"}</td>
              <td className="actions">
                <button className="secondary" onClick={() => setEditing(client)}>Edytuj</button>
                <button className="danger" onClick={() => handleDelete(client)}>Usuń</button>
              </td>
            </tr>
          ))}
          {clients.length === 0 && (
            <tr><td colSpan="4">Brak klientów.</td></tr>
          )}
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
