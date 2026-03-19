import React from "react";
import { motion } from "framer-motion";
import "./Analytics.css";

export default function Analytics({ applications }) {
  function getStatusData() {
    const applied = applications.filter(
      (application) => application.status === "applied",
    );
    const rejected = applications.filter(
      (application) => application.status === "rejected",
    );
    const interview = applications.filter(
      (application) => application.status === "interview",
    );
    return [
      { name: "Applied", value: applied.length, color: "#4f8ef7" },
      { name: "Interview", value: interview.length, color: "#00e5a0" },
      { name: "Rejected", value: rejected.length, color: "#ff6b6b" },
    ];
  }

  function getWeeklyData() {
    const weeks = {}
    applications.forEach(app => {
      const date = new Date(app.date)
      const dayOfWeek = date.getDay()
      const daysToMonday = (dayOfWeek === 0) ? 6 : (dayOfWeek - 1)
      date.setDate(date.getDate() - daysToMonday)
      const weekLabel = date.toLocaleDateString('en-US', {
        month:"short", 
        day:"numeric"
      })
      weeks[weekLabel] = (weeks[weekLabel] || 0) + 1
    });

    return Object.keys(weeks).map(week => ({
      week: week, 
      count: weeks[week]
    }))
  }

  return (
    <motion.div
      className="Analytics"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div>building...🧱</div>
    </motion.div>
  );
}
