import React from "react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import {
  getStatusChartData,
  getWeeklyData,
  getStreak,
  getThisWeekCount,
} from "../lib/applications";
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
import { BarChart3 } from "lucide-react";

export default function Analytics({ applications, session }) {
  const [weeklyGoal, setWeeklyGoal] = useState(5);
  const isInitialRender = useRef(true);

  useEffect(() => {
    supabase
      .from("user_settings")
      .select("weekly_goal")
      .eq("user_id", session.user.id)
      .single()
      .then(({ data }) => {
        if (data) setWeeklyGoal(data.weekly_goal);
      });
  }, [session]);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    if (weeklyGoal === "") return;
    supabase
      .from("user_settings")
      .upsert({ user_id: session.user.id, weekly_goal: weeklyGoal })
      .then(() => {});
  }, [weeklyGoal, session]);

  const statusData = getStatusChartData(applications);
  const weeklyData = getWeeklyData(applications);
  const streak = getStreak(applications);
  const count = getThisWeekCount(applications);
  const goalNumber = Number(weeklyGoal);
  const hasValidGoal = Number.isFinite(goalNumber) && goalNumber > 0;
  const percentage = hasValidGoal ? Math.min((count / goalNumber) * 100, 100) : 0;

  return (
    <motion.div
      className="analytics"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <h1>Job Application Analytics</h1>
      {applications.length === 0 ? (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <BarChart3 size={48} color="#4f8ef7" />
          <h2>No data yet</h2>
          <p>Charts and insights will appear here once you add your first application.</p>
        </motion.div>
      ) : (
      <div className="analytics-charts">
        <div className="chart-card">
          <h2>Applications Per Week</h2>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4f8ef7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h2>Status Breakdown</h2>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={100}
              >
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="streak-card">
          <h2>Application Streak</h2>
          <div className="streak-count">
            <span>{streak}</span>
            <span>{"\uD83D\uDD25"}</span>
          </div>
          <p>day streak</p>
        </div>
        <div className="goal-tracker">
          <h2>Weekly Goal</h2>
          <div className="goal-input">
            <span>Apply To</span>
            <input
              type="number"
              aria-label="Weekly application goal"
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
      )}
    </motion.div>
  );
}
