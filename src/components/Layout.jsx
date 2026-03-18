import React from "react";
import "./Layout.css";
import { Outlet } from "react-router-dom";
import { NavLink } from "react-router-dom";

export default function Layout() {
  return (
    <div className="layout">
      <aside>
        <nav>
          <img src="/src/assets/appIcon.png" alt="Job Tracker Logo" />
          <NavLink
            className={({ isActive }) => (isActive ? "is-active" : "")}
            end
            to="/"
          >
            <img src="/src/assets/homeIcon.png" alt="" />
          </NavLink>
          <NavLink
            to="/applied"
            className={({ isActive }) => (isActive ? "is-active" : "")}
          >
            <img src="/src/assets/appliedIcon.png" alt="" />
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) => (isActive ? "is-active" : "")}
          >
            <img src="/src/assets/analyticsIcon.png" alt="" />
          </NavLink>
        </nav>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
