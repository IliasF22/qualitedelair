import { NavLink, Route, Routes } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { ThresholdsPage } from "./pages/ThresholdsPage";
import "./App.css";

export default function App() {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <img
            className="logo"
            src="/logo-esiee.png"
            alt="ESIEE [it] — School of Digital Intelligence"
            width={200}
            height={48}
          />
        </div>
        <div className="title-block">
          <h1 className="app-title">Station qualité de l’air</h1>
          <p className="app-subtitle">
            Grove Air Quality v1.3 · DHT11 · Grove CO₂ · HM2201 (PM)
          </p>
        </div>
        <nav className="main-nav" aria-label="Navigation principale">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Dashboard
          </NavLink>
          <NavLink to="/historique" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Historique
          </NavLink>
          <NavLink to="/seuils" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Seuils &amp; repères
          </NavLink>
        </nav>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/historique" element={<HistoryPage />} />
          <Route path="/seuils" element={<ThresholdsPage />} />
        </Routes>
      </main>

      <footer className="footer">
        <span>
          Choisis la source des mesures sur le dashboard (simulation ou Raspberry Pi). Seuils expliqués dans l’onglet
          « Seuils &amp; repères ».
        </span>
      </footer>
    </div>
  );
}
