import React from "react";
import { Rocket } from "lucide-react";
import "./Loading.css";

export default function Loading({ message }) {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <Rocket size={40} color="#4f8ef7" className="loading-rocket" />
        <div className="loading-spinner"></div>
        {message && <p className="loading-message">{message}</p>}
      </div>
    </div>
  );
}
