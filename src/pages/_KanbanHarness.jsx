import React, { useState, useCallback } from "react";
import Applied from "./Applied";

// Test-only harness used by Playwright to exercise touch DnD against
// the real Applied page without requiring auth. Mounted at ?harness=kanban
// in dev/preview builds via main.jsx.

// Set kanban view BEFORE Applied initializes its useState from storage.
if (typeof window !== "undefined") {
  window.localStorage.setItem("appliedViewMode", "kanban");
}

const fakeSession = { user: { id: "harness-user" } };

const seedApps = [
  { id: 1, company: "Acme", role: "Engineer", data: "2026-01-10", status: "applied", notes: "" },
  { id: 2, company: "Beta", role: "Designer", data: "2026-01-12", status: "applied", notes: "" },
  { id: 3, company: "Cog", role: "Manager", data: "2026-01-15", status: "interview", notes: "" },
];

export default function KanbanHarness() {
  const [apps, setApps] = useState(seedApps);

  const addApplication = useCallback(async (a) => {
    const created = { ...a, id: Date.now(), user_id: "harness-user" };
    setApps((prev) => [...prev, created]);
    return created;
  }, []);

  const updateApplication = useCallback(async (id, updates) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    // Surface the call to the test runner via window for assertions
    window.__lastUpdate = { id, updates };
  }, []);

  const deleteApplication = useCallback(async (id) => {
    setApps((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return (
    <div data-testid="kanban-harness" style={{ padding: 0, margin: 0 }}>
      <Applied
        applications={apps}
        addApplication={addApplication}
        updateApplication={updateApplication}
        deleteApplication={deleteApplication}
        session={fakeSession}
      />
    </div>
  );
}
