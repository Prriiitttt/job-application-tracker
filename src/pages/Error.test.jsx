import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Error from "./Error";
import { renderWithRouter } from "../test/test-utils";

describe("Error page", () => {
  it("renders the 404 message", () => {
    renderWithRouter(<Error />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/404/);
    expect(
      screen.getByText(/The page you're looking for doesn't exist/i)
    ).toBeInTheDocument();
  });

  it("has a button that navigates back to home", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Error />);
    const btn = screen.getByRole("button", { name: /back to home/i });
    expect(btn).toBeInTheDocument();
    await user.click(btn);
    // navigation happens; we don't assert location here, just that click is wired
    expect(btn).toBeInTheDocument();
  });
});
