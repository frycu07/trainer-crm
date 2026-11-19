import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  // zalogowany nie potrzebuje formularza
  if (user) return <Navigate to="/clients" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate("/clients");
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div className="login-box">
      <h1>Trainer CRM</h1>
      <form onSubmit={handleSubmit}>
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Hasło
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <ErrorBanner error={error} />
        <button type="submit">Zaloguj</button>
      </form>
    </div>
  );
}
