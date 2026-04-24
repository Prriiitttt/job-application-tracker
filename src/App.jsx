import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./lib/supabase";
import "./App.css";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Applied from "./pages/Applied";
import Analytics from "./pages/Analytics";
import Error from "./pages/Error";
import Login from "./pages/Login";
import Loading from "./components/Loading";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import Connections from "./pages/Connections";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [applications, setApplications] = useState([]);
  const [unreadMap, setUnreadMap] = useState({});

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setSession(session),
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setApplications([]);
      return;
    }
    supabase
      .from("application")
      .select("*")
      .eq("user_id", session.user.id)
      .order("data", { ascending: false })
      .then(({ data }) => {
        if (data) setApplications(data);
      });
  }, [session]);

  const loadUnread = useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase.rpc("get_unread_conversations");
    if (error) {
      console.warn("Could not load unread state:", error.message);
      return;
    }
    if (!data) return;
    const map = {};
    data.forEach((r) => { map[r.other_user_id] = r.has_unread; });
    setUnreadMap(map);
  }, [session]);

  const markUnreadRead = useCallback((userId) => {
    setUnreadMap((prev) => ({ ...prev, [userId]: false }));
  }, []);

  useEffect(() => {
    if (!session) return;
    loadUnread();
    const channel = supabase
      .channel(`user-messages:${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (payload.new.sender_id !== session.user.id) loadUnread();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, loadUnread]);

  const hasUnreadMessages = Object.values(unreadMap).some(Boolean);

  const addApplication = useCallback(
    async (app) => {
      const newApp = { ...app, user_id: session.user.id };
      const { data, error } = await supabase
        .from("application")
        .insert(newApp)
        .select()
        .single();
      if (!error && data) {
        setApplications((prev) => [...prev, data]);
        return data;
      }
    },
    [session],
  );

  const updateApplication = useCallback(async (id, updates) => {
    const { error } = await supabase
      .from("application")
      .update(updates)
      .eq("id", id);
    if (!error) {
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, ...updates } : app)),
      );
    }
  }, []);

  const deleteApplication = useCallback(async (id) => {
    const app = applications.find((a) => a.id === id);
    const { error } = await supabase
      .from("application")
      .delete()
      .eq("id", id);
    if (!error) {
      if (app?.resume_url) {
        await supabase.storage.from("resumes").remove([app.resume_url]);
      }
      setApplications((prev) => prev.filter((app) => app.id !== id));
    }
  }, [applications]);

  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: "/",
          element: (
            <Layout
              session={session}
              onSignOut={handleSignOut}
              hasUnreadMessages={hasUnreadMessages}
            />
          ),
          errorElement: <Error />,
          children: [
            {
              index: true,
              element: <Home applications={applications} />,
            },
            {
              path: "applied",
              element: (
                <Applied
                  applications={applications}
                  addApplication={addApplication}
                  updateApplication={updateApplication}
                  deleteApplication={deleteApplication}
                  session={session}
                />
              ),
            },
            {
              path: "analytics",
              element: (
                <Analytics
                  applications={applications}
                  session={session}
                />
              ),
            },
            {
              path: "profile/me",
              element: <Profile session={session} isOwn={true} />,
            },
            {
              path: "profile/:username",
              element: <Profile session={session} />,
            },
            {
              path: "discover",
              element: <Discover session={session} />,
            },
            {
              path: "connections",
              element: (
                <Connections
                  session={session}
                  unreadMap={unreadMap}
                  onMarkedRead={markUnreadRead}
                />
              ),
            },
          ],
        },
      ]),
    [
      applications,
      session,
      addApplication,
      updateApplication,
      deleteApplication,
      handleSignOut,
      unreadMap,
      hasUnreadMessages,
      markUnreadRead,
    ],
  );

  if (loading) return <Loading message="Loading" />;
  if (signingOut) return <Loading message="Signing out" />;
  if (!session) return <Login />;

  return <RouterProvider router={router} />;
}

export default App;
