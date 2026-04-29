import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./Home";

describe("Home dashboard", () => {
  it("shows zero counts for an empty applications list", () => {
    render(<Home applications={[]} />);
    expect(screen.getByText("Total Applications")).toBeInTheDocument();
    const counts = screen.getAllByText("0");
    expect(counts).toHaveLength(4);
  });

  it("renders accurate counts for each status", () => {
    const apps = [
      { id: 1, status: "applied" },
      { id: 2, status: "applied" },
      { id: 3, status: "interview" },
      { id: 4, status: "rejected" },
      { id: 5, status: "rejected" },
      { id: 6, status: "rejected" },
    ];
    render(<Home applications={apps} />);

    expect(screen.getByRole("heading", { name: "Total Applications" })).toBeInTheDocument();
    expect(screen.getByText("Applied").nextSibling.textContent).toBe("2");
    expect(screen.getByText("Interviews").nextSibling.textContent).toBe("1");
    expect(screen.getByText("Rejected").nextSibling.textContent).toBe("3");
  });

  it("renders the dashboard heading", () => {
    render(<Home applications={[]} />);
    expect(screen.getByRole("heading", { name: "Dashboard Overview" })).toBeInTheDocument();
  });
});
