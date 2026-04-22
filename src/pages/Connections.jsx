import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, User, Loader2, Users, Compass } from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Connections.css";

export default function Connections({ session }) {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, [session]);

  async function loadConnections() {
    setLoading(true);

    const { data: acceptedData } = await supabase
      .from("connections")
      .select("*")
      .or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
      .eq("status", "accepted");

    if (acceptedData) {
      // Fetch profiles for the other user in each connection
      const otherIds = acceptedData.map((c) =>
        c.requester_id === session.user.id ? c.receiver_id : c.requester_id
      );
      const uniqueIds = [...new Set(otherIds)];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", uniqueIds);

      const profileMap = {};
      if (profiles) profiles.forEach((p) => (profileMap[p.id] = p));

      const enriched = acceptedData.map((c) => {
        const otherId = c.requester_id === session.user.id ? c.receiver_id : c.requester_id;
        return { ...c, otherUser: profileMap[otherId] || null };
      });
      setAccepted(enriched);
    }
    setLoading(false);
  }

  function getOtherUser(conn) {
    return conn.otherUser;
  }

  if (loading) {
    return (
      <div className="connections-page">
        <div className="connections-loading"><Loader2 size={24} className="spin" /></div>
      </div>
    );
  }

  return (
    <motion.div
      className="connections-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <h1>Connections</h1>

      <section className="connections-section">
        <h2>My Connections</h2>
        {accepted.length === 0 ? (
          <div className="connections-empty-state">
            <Users size={40} color="#64748b" />
            <p>No connections yet.</p>
            <button className="discover-cta-btn" onClick={() => navigate("/discover")}>
              <Compass size={16} />
              Discover People
            </button>
          </div>
        ) : (
          <div className="connections-list">
            {accepted.map((conn) => {
              const other = getOtherUser(conn);
              if (!other) return null;
              return (
                <div
                  key={conn.id}
                  className="connection-card clickable"
                  onClick={() => navigate(`/profile/${other.username}`)}
                >
                  <div className="connection-card-info">
                    <div className="connection-avatar">
                      {other.avatar_url ? (
                        <img src={other.avatar_url} alt={other.full_name} />
                      ) : (
                        <User size={24} />
                      )}
                    </div>
                    <div>
                      <span className="connection-name">{other.full_name || other.username}</span>
                      <span className="connection-username">@{other.username}</span>
                    </div>
                  </div>
                  <span className="connected-badge"><Check size={14} /> Connected</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </motion.div>
  );
}
