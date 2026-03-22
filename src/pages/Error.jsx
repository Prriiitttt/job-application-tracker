import React from "react";
import { useNavigate } from "react-router-dom";
import "./Error.css";

export default function Error() {
  const navigate = useNavigate();

  return (
    <div className="error-page">
      <h1 className="error-heading">404🐛</h1>
      <h2 className="error-desc">SIKEEE!!</h2>
      <p className="error-text">The page you're looking for doesn't exist</p>
      <button className="error-btn" onClick={() => navigate("/")}>
        Back to Home
      </button>
    </div>
  );
}