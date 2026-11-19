import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ClientsPage from "./pages/ClientsPage.jsx";

// strony placeholderowe - kolejne commity zastepuja je prawdziwymi widokami
function Placeholder({ title }) {
  return <h1>{title}</h1>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/:id" element={<Placeholder title="Szczegóły klienta" />} />
        <Route path="/sessions" element={<Placeholder title="Treningi" />} />
        <Route path="/notifications" element={<Placeholder title="Powiadomienia" />} />
        <Route
          path="/users"
          element={<ProtectedRoute role="ADMIN"><Placeholder title="Użytkownicy" /></ProtectedRoute>}
        />
      </Route>
      <Route path="*" element={<Navigate to="/clients" replace />} />
    </Routes>
  );
}
