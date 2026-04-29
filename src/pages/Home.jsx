import React from "react";
import "./Home.css";
import { motion } from "framer-motion";
import { countByStatus } from "../lib/applications";

export default function Home({ applications }) {
  const counts = countByStatus(applications);

  return (
    <motion.div
      className="home"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="home">
        <h1>Dashboard Overview</h1>
        <div className="tiles">
          <div className="tile total-Applications">
            <h2>Total Applications</h2>
            <p className="tile-count">{counts.total}</p>
          </div>
          <div className="tile applied">
            <h3>Applied</h3>
            <p className="tile-count">{counts.applied}</p>
          </div>
          <div className="tile interviews">
            <h3>Interviews</h3>
            <p className="tile-count">{counts.interview}</p>
          </div>
          <div className="tile rejected">
            <h3>Rejected</h3>
            <p className="tile-count">{counts.rejected}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
