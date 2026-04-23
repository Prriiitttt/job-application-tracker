import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { User, Loader2, Users, Compass, MessageCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import ChatView from "../components/ChatView";
import "./Connections.css";

export default function Connections({ session }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [accepted, setAccepted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [unreadMap, setUnreadMap] = useState({});
  const didProcessOpenChatRef = useRef(false);

  useEffect(() => {
    loadConnections();
    loadUnread();
  }, [session]);

  useEffect(() => {
    const channel = supabase
      .channel(`user-messages:${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (payload.new.sender_id !== session.user.id) {
            loadUnread();
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session.user.id]);

  useEffect(() => {
    if (didProcessOpenChatRef.current) return;
    const target = location.state?.openChatWith;
    if (!target || loading) return;
    const conn = accepted.find((c) => {
      const otherId = c.requester_id === session.user.id ? c.receiver_id : c.requester_id;
      return otherId === target;
    });
    if (conn?.otherUser) {
      setActiveChatUser(conn.otherUser);
      didProcessOpenChatRef.current = true;
    }
  }, [loading, accepted, location.state, session.user.id]);

  async function loadUnread() {
    const { data, error } = await supabase.rpc("get_unread_conversations");
    if (error) {
      console.warn("Could not load unread state:", error.message);
      return;
    }
    if (!data) return;
    const map = {};
    data.forEach((r) => { map[r.other_user_id] = r.has_unread; });
    setUnreadMap(map);
  }

  function handleMarkedRead(userId) {
    setUnreadMap((prev) => ({ ...prev, [userId]: false }));
  }

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
      <div className={`connections-layout ${activeChatUser ? "with-chat" : ""}`}>
        <section className="connections-section connections-main">
          <h1>Connections</h1>
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
                const isActive = activeChatUser?.id === other.id;
                return (
                  <div
                    key={conn.id}
                    className={`connection-card ${isActive ? "is-active" : ""}`}
                  >
                    <div
                      className="connection-card-info clickable"
                      onClick={() => navigate(`/profile/${other.username}`)}
                    >
                      <div className="connection-avatar">
                        {other.avatar_url ? (
                          <img src={other.avatar_url} alt={other.full_name} />
                        ) : (
                          <User size={24} />
                        )}
                      </div>
                      <div>
                        <span className="connection-name">
                          {other.full_name || other.username}
                          {unreadMap[other.id] && (
                            <span className="connection-unread-dot" aria-label="Unread messages" />
                          )}
                        </span>
                        <span className="connection-username">@{other.username}</span>
                      </div>
                    </div>
                    <div className="connection-card-actions">
                      <button
                        className="connection-message-btn"
                        onClick={() => setActiveChatUser(other)}
                        aria-label={`Message ${other.full_name || other.username}`}
                      >
                        <MessageCircle size={16} />
                        Message
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <AnimatePresence>
          {activeChatUser && (
            <ChatView
              key={activeChatUser.id}
              session={session}
              otherUser={activeChatUser}
              onClose={() => setActiveChatUser(null)}
              onMarkedRead={handleMarkedRead}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
