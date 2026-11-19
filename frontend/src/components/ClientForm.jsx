import { useState } from "react";
import ErrorBanner from "./ErrorBanner.jsx";

// jeden formularz do dodawania i edycji: przy edycji dostaje klienta w prop client
export default function ClientForm({ client, onSaved, onCancel }) {
  const [form, setForm] = useState({
    firstName: client?.firstName ?? "",
    lastName: client?.lastName ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    goal: client?.goal ?? ""
  });
  const [error, setError] = useState(null);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    // puste pola opcjonalne nie jadą do API (backend zapisze je jako null)
    const body = {};
    for (const [key, value] of Object.entries(form)) {
      if (value !== "" || key === "firstName" || key === "lastName") body[key] = value;
    }

    try {
      await onSaved(body);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>{client ? "Edycja klienta" : "Nowy klient"}</h2>
      <label>
        Imię
        <input name="firstName" value={form.firstName} onChange={handleChange} />
      </label>
      <label>
        Nazwisko
        <input name="lastName" value={form.lastName} onChange={handleChange} />
      </label>
      <label>
        E-mail
        <input name="email" value={form.email} onChange={handleChange} />
      </label>
      <label>
        Telefon
        <input name="phone" value={form.phone} onChange={handleChange} />
      </label>
      <label>
        Cel treningowy
        <textarea name="goal" rows="2" value={form.goal} onChange={handleChange} />
      </label>
      <ErrorBanner error={error} />
      <div className="actions">
        <button type="submit">Zapisz</button>
        <button type="button" className="secondary" onClick={onCancel}>Anuluj</button>
      </div>
    </form>
  );
}
