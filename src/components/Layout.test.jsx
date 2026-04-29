import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Layout from "./Layout";
import { renderWithRouter, fakeSession } from "../test/test-utils";

describe("Layout", () => {
  it("renders the navigation sidebar", () => {
    renderWithRouter(
      <Layout session={fakeSession()} onSignOut={() => {}} hasUnreadMessages={false} />
    );
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("does NOT render the unread badge when hasUnreadMessages is false", () => {
    renderWithRouter(
      <Layout session={fakeSession()} onSignOut={() => {}} hasUnreadMessages={false} />
    );
    expect(screen.queryByLabelText(/unread messages/i)).not.toBeInTheDocument();
  });

  it("renders the unread badge when hasUnreadMessages is true", () => {
    renderWithRouter(
      <Layout session={fakeSession()} onSignOut={() => {}} hasUnreadMessages={true} />
    );
    expect(screen.getByLabelText(/unread messages/i)).toBeInTheDocument();
  });

  it("calls onSignOut when a logout button is clicked", async () => {
    const onSignOut = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <Layout session={fakeSession()} onSignOut={onSignOut} hasUnreadMessages={false} />
    );
    // Both desktop and mobile logout buttons share the "Log out" accessible name.
    const logoutButtons = screen.getAllByRole("button", { name: /log out/i });
    await user.click(logoutButtons[0]);
    expect(onSignOut).toHaveBeenCalled();
  });
});
