import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

export function fakeSession(overrides = {}) {
  return {
    user: {
      id: "test-user",
      email: "test@example.com",
      ...overrides,
    },
  };
}

export function renderWithRouter(ui, { initialEntries = ["/"], path = "/" } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path={path} element={ui} />
        <Route path="*" element={ui} />
      </Routes>
    </MemoryRouter>
  );
}

// Build a fake supabase channel that records subscriptions and lets tests
// trigger postgres_changes / broadcast events on demand.
export function makeFakeChannel() {
  const handlers = { postgres_changes: [], broadcast: [] };
  let subscribed = false;

  const channel = {
    on(event, _config, cb) {
      if (event === "postgres_changes") handlers.postgres_changes.push(cb);
      if (event === "broadcast") handlers.broadcast.push(cb);
      return channel;
    },
    subscribe(cb) {
      subscribed = true;
      cb && cb("SUBSCRIBED");
      return channel;
    },
    send: () => Promise.resolve(),
    unsubscribe: () => Promise.resolve(),
    __triggerInsert(payload) {
      handlers.postgres_changes.forEach((h) => h({ eventType: "INSERT", new: payload }));
    },
    __triggerBroadcast(payload) {
      handlers.broadcast.forEach((h) => h({ payload }));
    },
    __isSubscribed: () => subscribed,
  };
  return channel;
}
