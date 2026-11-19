import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div>
      <header className="topbar">
        <span className="brand">Trainer CRM</span>
        <nav>
          <NavLink to="/clients">Klienci</NavLink>
          <NavLink to="/sessions">Treningi</NavLink>
          <NavLink to="/notifications">Powiadomienia</NavLink>
          {user.role === "ADMIN" && <NavLink to="/users">Użytkownicy</NavLink>}
        </nav>
        <span className="user">
          {user.fullName}
          <button onClick={handleLogout}>Wyloguj</button>
        </span>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
