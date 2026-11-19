import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

// bez zalogowanego uzytkownika wracamy na /login, z prop role wpuszczamy tylko ta role
export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="center">Ładowanie...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/clients" replace />;

  return children;
}
