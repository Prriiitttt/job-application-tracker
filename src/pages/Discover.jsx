import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, UserPlus, Check, Clock, Loader2, User } from "lucide-react";
import { supabase } from "../lib/supabase";
import { findConnection, filterDiscoverUsers } from "../lib/connections";
import "./Discover.css";

export default function Discover({ session }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadData();
  }, [session]);

  async function loadData() {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", session.user.id)
      .order("created_at", { ascending: false });

    const { data: conns } = await supabase
      .from("connections")
      .select("*")
      .or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
      .neq("status", "declined");

    if (profiles) setUsers(profiles);
    if (conns) setConnections(conns);
    setLoading(false);
  }

  function getConnectionStatus(userId) {
    return findConnection(connections, session.user.id, userId);
  }

  async function handleConnect(userId) {
    setActionLoading(userId);
    // Check if other user already sent us a request
    const existing = connections.find(
      (c) => c.requester_id === userId && c.receiver_id === session.user.id && c.status === "pending"
    );

    if (existing) {
      await supabase.from("connections").update({ status: "accepted" }).eq("id", existing.id);
      setConnections((prev) =>
        prev.map((c) => (c.id === existing.id ? { ...c, status: "accepted" } : c))
      );
    } else {
      const { data } = await supabase
        .from("connections")
        .insert({ requester_id: session.user.id, receiver_id: userId, status: "pending" })
        .select()
        .single();
      if (data) setConnections((prev) => [...prev, data]);
    }
    setActionLoading(null);
  }

  const filteredUsers = filterDiscoverUsers(users, connections, session.user.id, query);

  return (
    <motion.div
      className="discover-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <h1>Discover People</h1>
      <div className="discover-search">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search by name or username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="discover-loading"><Loader2 size={24} className="spin" /></div>
      ) : filteredUsers.length === 0 ? (
        <div className="discover-empty">
          <p>No users found.</p>
        </div>
      ) : (
        <div className="discover-list">
          {filteredUsers.map((user) => {
            const conn = getConnectionStatus(user.id);
            return (
              <div key={user.id} className="discover-card">
                <div
                  className="discover-card-info"
                  onClick={() => navigate(`/profile/${user.username}`)}
                >
                  <div className="discover-avatar">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <div>
                    <span className="discover-name">{user.full_name || user.username}</span>
                    <span className="discover-username">@{user.username}</span>
                  </div>
                </div>
                <div className="discover-card-action">
                  {!conn && (
                    <button
                      className="connect-btn"
                      onClick={() => handleConnect(user.id)}
                      disabled={actionLoading === user.id}
                    >
                      {actionLoading === user.id ? <Loader2 size={14} className="spin" /> : <UserPlus size={14} />}
                      Connect
                    </button>
                  )}
                  {conn && conn.status === "pending" && conn.requester_id === session.user.id && (
                    <button className="connect-btn pending" disabled><Clock size={14} /> Pending</button>
                  )}
                  {conn && conn.status === "pending" && conn.receiver_id === session.user.id && (
                    <button className="connect-btn accept" onClick={() => handleConnect(user.id)} disabled={actionLoading === user.id}>
                      <Check size={14} /> Accept
                    </button>
                  )}
                  {conn && conn.status === "accepted" && (
                    <button className="connect-btn connected" disabled><Check size={14} /> Connected</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
