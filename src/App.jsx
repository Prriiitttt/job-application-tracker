import {createBrowserRouter, RouterProvider} from "react-router-dom"
import './App.css'
import Layout from "./components/Layout"
import Home from "./pages/Home"
import Applied from "./pages/Applied"
import Analytics from "./pages/Analytics"

const router = createBrowserRouter (
    [
      {
        path: "/", 
        element: <Layout />,
        errorElement:<div>404 - Page not found</div>,
        children: [
          {
            index: true,
            element:<Home />
          }, 
          {
            path: "applied",
            element:<Applied />
          }, 
          {
            path: "analytics",
            element:<Analytics />
          },
        ]
      }
    ]
  )

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
