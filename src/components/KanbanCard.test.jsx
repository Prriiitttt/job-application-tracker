import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import KanbanCard from "./KanbanCard";

const baseApp = {
  id: 1,
  company: "Acme",
  role: "Engineer",
  data: "2026-01-10",
  status: "applied",
};

describe("KanbanCard", () => {
  it("renders company, role, and date", () => {
    render(
      <KanbanCard
        app={baseApp}
        onDragStart={vi.fn()}
        onTouchStart={vi.fn()}
        onViewResume={vi.fn()}
      />
    );
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Engineer")).toBeInTheDocument();
    expect(screen.getByText("2026-01-10")).toBeInTheDocument();
  });

  it("does not render the resume button when no resume_url", () => {
    render(
      <KanbanCard
        app={baseApp}
        onDragStart={vi.fn()}
        onTouchStart={vi.fn()}
        onViewResume={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: /resume/i })).not.toBeInTheDocument();
  });

  it("shows the resume button and calls onViewResume on click", async () => {
    const user = userEvent.setup();
    const onViewResume = vi.fn();
    render(
      <KanbanCard
        app={{ ...baseApp, resume_url: "me/cv.pdf" }}
        onDragStart={vi.fn()}
        onTouchStart={vi.fn()}
        onViewResume={onViewResume}
      />
    );
    await user.click(screen.getByRole("button", { name: /resume/i }));
    expect(onViewResume).toHaveBeenCalledWith("me/cv.pdf");
  });

  it("invokes onDragStart with the app id", () => {
    const onDragStart = vi.fn();
    const { container } = render(
      <KanbanCard
        app={baseApp}
        onDragStart={onDragStart}
        onTouchStart={vi.fn()}
        onViewResume={vi.fn()}
      />
    );
    fireEvent.dragStart(container.querySelector(".kanban-card"));
    expect(onDragStart).toHaveBeenCalled();
    expect(onDragStart.mock.calls[0][1]).toBe(1);
  });

  it("invokes onTouchStart with the app id", () => {
    const onTouchStart = vi.fn();
    const { container } = render(
      <KanbanCard
        app={baseApp}
        onDragStart={vi.fn()}
        onTouchStart={onTouchStart}
        onViewResume={vi.fn()}
      />
    );
    fireEvent.touchStart(container.querySelector(".kanban-card"));
    expect(onTouchStart).toHaveBeenCalled();
    expect(onTouchStart.mock.calls[0][1]).toBe(1);
  });
});
