import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "./ErrorBoundary";

function Bomb({ message = "boom" }) {
  throw new Error(message);
}

beforeEach(() => {
  // React logs the caught error to console.error. Silence it for clean test output.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ErrorBoundary", () => {
  it("renders children when no error is thrown", () => {
    render(
      <ErrorBoundary>
        <div>safe child</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("safe child")).toBeInTheDocument();
  });

  it("shows the default fallback UI when a child throws", () => {
    render(
      <ErrorBoundary scope="Profile">
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/profile hit an unexpected error/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("calls onError with the thrown error", () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <Bomb message="kaboom" />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toBe("kaboom");
  });

  it("renders a custom fallback function when provided", () => {
    const fallback = ({ error, reset }) => (
      <div>
        <span>custom: {error.message}</span>
        <button onClick={reset}>retry</button>
      </div>
    );
    render(
      <ErrorBoundary fallback={fallback}>
        <Bomb message="tea pot" />
      </ErrorBoundary>
    );
    expect(screen.getByText("custom: tea pot")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("Try Again resets the boundary so it re-renders children", async () => {
    const user = userEvent.setup();
    let shouldThrow = true;
    function MaybeThrow() {
      if (shouldThrow) throw new Error("oops");
      return <div>recovered</div>;
    }
    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    shouldThrow = false;
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(screen.getByText("recovered")).toBeInTheDocument();
  });
});
