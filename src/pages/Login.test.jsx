import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "./Login";
import { supabase } from "../lib/supabase";

beforeEach(() => {
  vi.spyOn(supabase.auth, "signInWithPassword").mockResolvedValue({ data: {}, error: null });
  vi.spyOn(supabase.auth, "signUp").mockResolvedValue({ data: {}, error: null });
  vi.spyOn(supabase.auth, "signInWithOAuth").mockResolvedValue({ data: {}, error: null });
});

describe("Login page", () => {
  it("shows the email/password form by default", () => {
    render(<Login />);
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("toggles between Log In and Sign Up", async () => {
    const user = userEvent.setup();
    render(<Login />);
    await user.click(screen.getByText(/sign up/i));
    expect(screen.getAllByRole("heading", { name: /sign up/i })[0]).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<Login />);
    const password = screen.getByPlaceholderText("Password");
    expect(password).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(password).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("submits sign-in with email and password", async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByPlaceholderText("Email"), "user@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "secret123",
      });
    });
  });

  it("calls signUp when in sign-up mode", async () => {
    const user = userEvent.setup();
    render(<Login />);
    await user.click(screen.getByText(/^sign up$/i));
    await user.type(screen.getByPlaceholderText("Email"), "new@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "newpass1");
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "newpass1",
      });
    });
  });

  it("shows an error message when sign-in fails", async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid login credentials" },
    });
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByPlaceholderText("Email"), "x@y.com");
    await user.type(screen.getByPlaceholderText("Password"), "bad");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByText(/invalid login credentials/i)).toBeInTheDocument();
  });

  it("triggers Google OAuth on click", async () => {
    const user = userEvent.setup();
    render(<Login />);
    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({ provider: "google" });
  });

  it("triggers GitHub OAuth on click", async () => {
    const user = userEvent.setup();
    render(<Login />);
    await user.click(screen.getByRole("button", { name: /continue with github/i }));
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({ provider: "github" });
  });

  it("disables the submit button while a request is in flight", async () => {
    let resolve;
    supabase.auth.signInWithPassword.mockImplementationOnce(
      () => new Promise((r) => { resolve = r; })
    );
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByPlaceholderText("Email"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Password"), "pass1234");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    const submitBtn = screen.getByRole("button", { name: "" });
    expect(submitBtn).toBeDisabled();

    resolve({ data: {}, error: null });
  });

  it("shows OAuth error if the OAuth call fails", async () => {
    supabase.auth.signInWithOAuth.mockResolvedValueOnce({
      data: null,
      error: { message: "OAuth provider unavailable" },
    });
    const user = userEvent.setup();
    render(<Login />);
    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(await screen.findByText(/OAuth provider unavailable/i)).toBeInTheDocument();
  });
});
