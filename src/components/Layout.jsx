import React from "react";
import "./Layout.css";
import { Outlet } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { House, ListFilterPlus, ChartPie, Rocket } from "lucide-react";

export default function Layout() {
  return (
    <div className="layout">
      <div className="mobile-header">
        <Rocket size={44} color="#4f8ef7" />
        <span>JobTrackr</span>
      </div>
      <aside>
        <nav>
          <Rocket size={32} color="#4f8ef7" />
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