import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, UserPlus, Check, X, Clock, Loader2, Lock } from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Profile.css";

export default function Profile({ session, isOwn }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ total: 0, applied: 0, interview: 0, rejected: 0 });
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({ full_name: "", bio: "" });
  const [connectLoading, setConnectLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [username, isOwn, session]);

  async function loadProfile() {
    setLoading(true);
    let profileData;

    if (isOwn) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      profileData = data;
    } else {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();
      profileData = data;
    }

    if (!profileData) {
      setLoading(false);
      return;
    }

    setProfile(profileData);
    setEditData({ full_name: profileData.full_name || "", bio: profileData.bio || "" });

    const isOwnCheck = isOwn || profileData.id === session.user.id;

    // Fetch connection status if viewing someone else
    let conn = null;
    if (!isOwnCheck) {
      const { data } = await supabase
        .from("connections")
        .select("*")
        .or(
          `and(requester_id.eq.${session.user.id},receiver_id.eq.${profileData.id}),and(requester_id.eq.${profileData.id},receiver_id.eq.${session.user.id})`
        )
        .neq("status", "declined")
        .maybeSingle();
      conn = data;
      setConnection(conn);
    }

    // Only fetch stats if own profile or connected
    if (isOwnCheck || (conn && conn.status === "accepted")) {
      const { data: statsRows } = await supabase.rpc("get_profile_application_stats", {
        target_user_id: profileData.id,
      });

      const row = Array.isArray(statsRows) ? statsRows[0] : statsRows;
      if (row) {
        setStats({
          total: Number(row.total) || 0,
          applied: Number(row.applied) || 0,
          interview: Number(row.interview) || 0,
          rejected: Number(row.rejected) || 0,
        });
      }
    }

    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editData.full_name, bio: editData.bio })
      .eq("id", session.user.id);
    if (!error) {
      setProfile((prev) => ({ ...prev, ...editData }));
    }
    setSaving(false);
  }

  async function handleConnect() {
    setConnectLoading(true);
    // Check if other user already sent us a request
    const { data: existing } = await supabase
      .from("connections")
      .select("*")
      .eq("requester_id", profile.id)
      .eq("receiver_id", session.user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      await supabase.from("connections").update({ status: "accepted" }).eq("id", existing.id);
      setConnection({ ...existing, status: "accepted" });
    } else {
      const { data } = await supabase
        .from("connections")
        .insert({ requester_id: session.user.id, receiver_id: profile.id, status: "pending" })
        .select()
        .single();
      if (data) setConnection(data);
    }
    setConnectLoading(false);
  }

  async function handleAccept() {
    setConnectLoading(true);
    await supabase.from("connections").update({ status: "accepted" }).eq("id", connection.id);
    setConnection((prev) => ({ ...prev, status: "accepted" }));
    setConnectLoading(false);
  }

  async function handleDecline() {
    setConnectLoading(true);
    await supabase.from("connections").update({ status: "declined" }).eq("id", connection.id);
    setConnection(null);
    setConnectLoading(false);
  }

  function getConnectionButton() {
    if (!connection) {
      return (
        <button className="connect-btn" onClick={handleConnect} disabled={connectLoading}>
          {connectLoading ? <Loader2 size={16} className="spin" /> : <UserPlus size={16} />}
          Connect
        </button>
      );
    }
    if (connection.status === "pending" && connection.requester_id === session.user.id) {
      return <button className="connect-btn pending" disabled><Clock size={16} /> Pending</button>;
    }
    if (connection.status === "pending" && connection.receiver_id === session.user.id) {
      return (
        <div className="connect-actions">
          <button className="connect-btn accept" onClick={handleAccept} disabled={connectLoading}>
            <Check size={16} /> Accept
          </button>
          <button className="connect-btn decline" onClick={handleDecline} disabled={connectLoading}>
            <X size={16} /> Decline
          </button>
        </div>
      );
    }
    if (connection.status === "accepted") {
      return <button className="connect-btn connected" disabled><Check size={16} /> Connected</button>;
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading"><Loader2 size={24} className="spin" /></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <h1>User not found</h1>
      </div>
    );
  }

  const isOwnProfile = isOwn || profile.id === session.user.id;

  return (
    <motion.div
      className="profile-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <h1 className="profile-page-title">{isOwnProfile ? "My Profile" : "Profile"}</h1>
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} />
            ) : (
              <User size={40} />
            )}
          </div>
          <div className="profile-info">
            <h1>{profile.full_name || profile.username}</h1>
            <p className="profile-username">@{profile.username}</p>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          </div>
        </div>
        {!isOwnProfile && (
          <div className="profile-connection">{getConnectionButton()}</div>
        )}
      </div>

      {isOwnProfile || (connection && connection.status === "accepted") ? (
        <div className="profile-stats">
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card">
            <span className="stat-value stat-applied">{stats.applied}</span>
            <span className="stat-label">Applied</span>
          </div>
          <div className="stat-card">
            <span className="stat-value stat-interview">{stats.interview}</span>
            <span className="stat-label">Interview</span>
          </div>
          <div className="stat-card">
            <span className="stat-value stat-rejected">{stats.rejected}</span>
            <span className="stat-label">Rejected</span>
          </div>
        </div>
      ) : !isOwnProfile && (
        <div className="profile-private">
          <Lock size={20} />
          <p>Connect with {profile.full_name || profile.username} to see their application stats.</p>
        </div>
      )}

      {isOwnProfile && (
        <div className="profile-edit">
          <h2>Edit Profile</h2>
          <div className="edit-field">
            <label>Full Name</label>
            <input
              type="text"
              value={editData.full_name}
              onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
              placeholder="Your full name"
            />
          </div>
          <div className="edit-field">
            <label>Bio</label>
            <textarea
              value={editData.bio}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
              placeholder="Tell others about yourself"
              rows={3}
            />
          </div>
          <button className="save-btn" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={16} className="spin" /> : null}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      )}
    </motion.div>
  );
}
