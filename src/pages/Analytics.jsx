import React from "react";
import { motion } from "framer-motion";
import "./Analytics.css";
import {
  BarChart,
  Bar,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { PieChart, Pie, Cell } from "recharts";

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
    const weeks = {};
    applications.forEach((app) => {
      const date = new Date(app.date);
      const dayOfWeek = date.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      date.setDate(date.getDate() - daysToMonday);
      const weekLabel = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      weeks[weekLabel] = (weeks[weekLabel] || 0) + 1;
    });

    return Object.keys(weeks)
      .map((week) => ({
        week: week,
        count: weeks[week],
      }))
      .slice(-6);
  }

  return (
    <motion.div
      className="analytics"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <h1>Job Application Analytics</h1>
      <div className="analytics-charts">
        <div className="chart-card">
          <ResponsiveContainer width="80%" height={300}>
            <BarChart data={getWeeklyData()}>
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4f8ef7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <ResponsiveContainer width="80%" height={300}>
            <PieChart>
              <Pie
                data={getStatusData()}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={100}
              >
                {getStatusData().map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
