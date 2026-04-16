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

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);

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

  const addApplication = useCallback(
    async (app) => {
      const newApp = { ...app, user_id: session.user.id };
      const { data, error } = await supabase
        .from("application")
        .insert(newApp)
        .select()
        .single();
      if (!error && data) setApplications((prev) => [...prev, data]);
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
    const { error } = await supabase
      .from("application")
      .delete()
      .eq("id", id);
    if (!error) {
      setApplications((prev) => prev.filter((app) => app.id !== id));
    }
  }, []);

  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: "/",
          element: <Layout session={session} />,
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
          ],
        },
      ]),
    [
      applications,
      session,
      addApplication,
      updateApplication,
      deleteApplication,
    ],
  );

  if (loading) return null;
  if (!session) return <Login />;

  return <RouterProvider router={router} />;
}

export default App;
