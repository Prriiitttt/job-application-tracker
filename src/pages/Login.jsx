import React, { useState } from "react";
import { motion } from "framer-motion";
import { Rocket, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    }

    setLoading(false);
  }

  return (
    <motion.div
      className="login-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="login-mobile-header">
        <Rocket size={44} color="#4f8ef7" />
        <span>JobTrackr</span>
      </div>
      <div className="login-brand">
        <Rocket size={40} color="#4f8ef7" />
        <span>JobTrackr</span>
      </div>
      <div className="login-card">
        <h1>{isSignUp ? "Sign Up" : "Log In"}</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? (
              <span className="btn-spinner"></span>
            ) : isSignUp ? (
              "Sign Up"
            ) : (
              "Log In"
            )}
          </button>
        </form>
        <p className="toggle-auth">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <span onClick={() => { setIsSignUp(!isSignUp); setError(""); }}>
            {isSignUp ? "Log In" : "Sign Up"}
          </span>
        </p>
      </div>
    </motion.div>
  );
}
