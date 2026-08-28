import { useEffect, useState } from "react";
import { api } from "./api.js";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  const [reviewer, setReviewer] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api
      .me()
      .then((res) => setReviewer(res.name))
      .catch(() => setReviewer(null))
      .finally(() => setChecking(false));
  }, []);

  if (checking) return null;

  if (!reviewer) return <Login onLogin={setReviewer} />;

  return <Dashboard reviewer={reviewer} onLogout={() => setReviewer(null)} />;
}
