import React from "react";
import "./Layout.css";
import { Outlet } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { House, ListFilterPlus, ChartPie, Rocket, LogOut, Compass, Users } from "lucide-react";

export default function Layout({ session, onSignOut }) {
  return (
    <div className="layout">
      <div className="mobile-header">
        <Rocket size={44} color="#4f8ef7" />
        <span>JobTrackr</span>
        <button className="mobile-logout-btn" onClick={onSignOut}>
          <LogOut size={20} />
        </button>
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
          <NavLink
            to="/discover"
            className={({ isActive }) => (isActive ? "is-active" : "")}
          >
            <Compass size={28} />
          </NavLink>
          <NavLink
            to="/connections"
            className={({ isActive }) => (isActive ? "is-active" : "")}
          >
            <Users size={28} />
          </NavLink>
          <button className="logout-btn" onClick={onSignOut}>
            <LogOut size={28} />
          </button>
        </nav>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
