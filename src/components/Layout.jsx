import React from "react";
import "./Layout.css";
import { Outlet } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { House, ListFilterPlus, ChartPie} from "lucide-react";

export default function Layout() {
  return (
    <div className="layout">
      <div className="mobile-header">
        <img src="/src/assets/appIcon.png" alt="JobTrackr" />
        <span>JobTrackr</span>
      </div>
      <aside>
        <nav>
          <img src="/src/assets/appIcon.png" alt="Job Tracker Logo" />
          <NavLink
            className={({ isActive }) => (isActive ? "is-active" : "")}
            end
            to="/"
          >
            <House size={28} />
          </NavLink>
          <NavLink
            to="/applied"
            className={({ isActive }) => (isActive ? "is-active" : "")}
          >
            <ListFilterPlus size={28} />
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) => (isActive ? "is-active" : "")}
          >
            <ChartPie size={28} />
          </NavLink>
        </nav>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
