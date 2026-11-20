import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";

const emptyForm = { fullName: "", email: "", password: "" };

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    api.get("/users").then(setUsers).catch(setError);
  }, [reloadCounter]);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    try {
      // formularz dodaje trenerów; konto admina powstaje przy seedzie
      await api.post("/users", { ...form, role: "TRAINER" });
      setForm(emptyForm);
      setReloadCounter(reloadCounter + 1);
    } catch (err) {
      setFormError(err);
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Usunąć użytkownika ${user.fullName}?`)) return;
    setError(null);
    try {
      await api.delete(`/users/${user.id}`);
      setReloadCounter(reloadCounter + 1);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div>
      <h1>Użytkownicy</h1>
      <ErrorBanner error={error} />

      <table>
        <thead>
          <tr>
            <th>Imię i nazwisko</th>
            <th>E-mail</th>
            <th>Rola</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.fullName}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td className="actions">
                {user.id !== currentUser.id && (
                  <button className="danger" onClick={() => handleDelete(user)}>Usuń</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form className="card" onSubmit={handleSubmit}>
        <h2>Dodaj trenera</h2>
        <label>
          Imię i nazwisko
          <input name="fullName" value={form.fullName} onChange={handleChange} />
        </label>
        <label>
          E-mail
          <input name="email" value={form.email} onChange={handleChange} />
        </label>
        <label>
          Hasło (min. 8 znaków)
          <input name="password" type="password" value={form.password} onChange={handleChange} />
        </label>
        <ErrorBanner error={formError} />
        <div className="actions"><button type="submit">Dodaj trenera</button></div>
      </form>
    </div>
  );
}
