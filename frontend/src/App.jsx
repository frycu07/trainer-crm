import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ClientsPage from "./pages/ClientsPage.jsx";
import ClientDetailsPage from "./pages/ClientDetailsPage.jsx";
import SessionsPage from "./pages/SessionsPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/:id" element={<ClientDetailsPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route
          path="/users"
          element={<ProtectedRoute role="ADMIN"><UsersPage /></ProtectedRoute>}
        />
      </Route>
      <Route path="*" element={<Navigate to="/clients" replace />} />
    </Routes>
  );
}
