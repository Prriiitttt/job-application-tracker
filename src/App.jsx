import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import "./App.css";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Applied from "./pages/Applied";
import Analytics from "./pages/Analytics";
import Error from "./pages/Error";

function App() {
  const [applications, setApplications] = useState(() => {
    const savedApplications = localStorage.getItem("applications");
    return savedApplications ? JSON.parse(savedApplications) : [];
  });

  useEffect(() => {
    localStorage.setItem("applications", JSON.stringify(applications));
  }, [applications]);

  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: "/",
          element: <Layout />,
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
                  setApplications={setApplications}
                />
              ),
            },
            {
              path: "analytics",
              element: <Analytics applications={applications}/>,
            },
          ],
        },
      ]),
    [applications],
  );

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
