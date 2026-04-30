import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Avatar, { __test__ } from "./Avatar";

describe("Avatar — initials helpers", () => {
  it("returns first + last initial for two-word names", () => {
    expect(__test__.deriveInitials("Alice Wonder")).toBe("AW");
  });

  it("returns single initial for one-word names", () => {
    expect(__test__.deriveInitials("Cher")).toBe("C");
  });

  it("uppercases lowercase input", () => {
    expect(__test__.deriveInitials("alice wonder")).toBe("AW");
  });

  it("handles emoji and unicode as single graphemes", () => {
    expect(__test__.deriveInitials("北京 旅人")).toBe("北旅");
  });

  it("returns ? for empty/missing names", () => {
    expect(__test__.deriveInitials(null)).toBe("?");
    expect(__test__.deriveInitials("")).toBe("?");
    expect(__test__.deriveInitials("   ")).toBe("?");
  });

  it("derives a stable color from the seed", () => {
    expect(__test__.colorFor("Alice")).toBe(__test__.colorFor("Alice"));
    expect(__test__.colorFor("Alice")).not.toBe(__test__.colorFor("Bob"));
  });
});

describe("Avatar — render states", () => {
  it("renders <img> when avatarUrl is present", () => {
    render(<Avatar avatarUrl="https://cdn.example/me.jpg" name="Alice Wonder" />);
    const img = screen.getByRole("img", { name: /alice wonder/i });
    expect(img.tagName).toBe("IMG");
    expect(img).toHaveAttribute("src", "https://cdn.example/me.jpg");
  });

  it("falls back to initials when avatarUrl is missing", () => {
    render(<Avatar avatarUrl={null} name="Alice Wonder" />);
    expect(screen.getByText("AW")).toBeInTheDocument();
    // No <img> in this state
    expect(document.querySelector("img")).not.toBeInTheDocument();
  });

  it("falls back to initials when the image fires onError", () => {
    const { container } = render(
      <Avatar avatarUrl="https://broken.example/x.jpg" name="Alice Wonder" />
    );
    fireEvent.error(container.querySelector("img"));
    expect(screen.getByText("AW")).toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("uses '?' when avatarUrl missing AND name missing", () => {
    render(<Avatar avatarUrl={null} name={null} />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("resets error state when avatarUrl prop changes", () => {
    const { rerender, container } = render(
      <Avatar avatarUrl="https://broken.example/x.jpg" name="A" />
    );
    fireEvent.error(container.querySelector("img"));
    // After error: no <img>, initials span visible
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.querySelector(".avatar-initials")).toBeInTheDocument();

    rerender(<Avatar avatarUrl="https://newcdn.example/y.jpg" name="A" />);
    // New URL: new <img> rendered, initials span gone
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://newcdn.example/y.jpg"
    );
    expect(container.querySelector(".avatar-initials")).not.toBeInTheDocument();
  });
});
