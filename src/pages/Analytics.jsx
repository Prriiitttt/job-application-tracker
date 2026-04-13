import React from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
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

export default function Analytics({ applications, session }) {
  const [weeklyGoal, setWeeklyGoal] = useState(
    session.user.user_metadata?.weeklyGoal ?? 5,
  );

  useEffect(() => {
    if (weeklyGoal === "") return;
    supabase.auth.updateUser({ data: { weeklyGoal } });
  }, [weeklyGoal]);

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
      const date = new Date(app.data);
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

  function getStreak() {
    const allDates = new Set(applications.map((app) => app.data));
    const today = new Date();
    let streak = 0;

    while (allDates.has(today.toISOString().split("T")[0])) {
      streak++;
      today.setDate(today.getDate() - 1);
    }
    return streak;
  }

  function getThisWeekCount() {
    const date = new Date();
    const todayString = date.toISOString().split("T")[0];

    const dayOfWeek = date.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    date.setDate(date.getDate() - daysToMonday);
    const mondayString = date.toISOString().split("T")[0];
    const finalCount = applications.filter(
      (app) => app.data >= mondayString && app.data <= todayString,
    );
    return finalCount.length;
  }

  const count = getThisWeekCount();
  const percentage = Math.min((count / (weeklyGoal || 1)) * 100, 100);

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
          <h3>Applications Per Week</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={getWeeklyData()}>
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4f8ef7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={230}>
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
        <div className="streak-card">
          <h3>Application Streak</h3>
          <div className="streak-count">
            <span>{getStreak()}</span>
            <span>{"\uD83D\uDD25"}</span>
          </div>
          <p>day streak</p>
        </div>
        <div className="goal-tracker">
          <h3>Weekly Goal</h3>
          <div className="goal-input">
            <span>Apply To</span>
            <input
              type="number"
              value={weeklyGoal}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setWeeklyGoal("");
                  return;
                }
                const val = Number(raw);
                if (val >= 1) setWeeklyGoal(val);
              }}
            />
            <span>Job this week</span>
          </div>
          <div className="goal-progress">
            <span>
              {count} of {weeklyGoal} applied
            </span>
            <span>{Math.round(percentage)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{
                width: `${percentage}%`,
                background: percentage >= 100 ? "#4f8ef7" : "#00e5a0",
              }}
            ></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
