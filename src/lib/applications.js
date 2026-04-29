export const APPLICATION_STATUSES = ["applied", "interview", "rejected"];

export function countByStatus(applications) {
  const base = { total: 0, applied: 0, interview: 0, rejected: 0 };
  if (!Array.isArray(applications)) return base;
  return applications.reduce(
    (acc, app) => {
      acc.total += 1;
      if (app && APPLICATION_STATUSES.includes(app.status)) {
        acc[app.status] += 1;
      }
      return acc;
    },
    { ...base }
  );
}

export function filterApplications(applications, { status = "all", search = "" } = {}) {
  if (!Array.isArray(applications)) return [];
  const q = (search || "").toLowerCase();
  return applications.filter((app) => {
    if (!app) return false;
    const statusOk = status === "all" || app.status === status;
    if (!statusOk) return false;
    if (!q) return true;
    const company = (app.company || "").toLowerCase();
    const role = (app.role || "").toLowerCase();
    return company.includes(q) || role.includes(q);
  });
}

export function getStatusChartData(applications) {
  const c = countByStatus(applications);
  return [
    { name: "Applied", value: c.applied, color: "#4f8ef7" },
    { name: "Interview", value: c.interview, color: "#00e5a0" },
    { name: "Rejected", value: c.rejected, color: "#ff6b6b" },
  ];
}

function parseCalendarDate(input) {
  // YYYY-MM-DD is parsed as UTC by Date(). For calendar-day data we want
  // local-date semantics so weekly bucketing doesn't shift across timezones.
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, day] = input.split("-").map(Number);
    return new Date(y, m - 1, day);
  }
  return new Date(input);
}

function mondayOf(date) {
  const d = parseCalendarDate(date);
  if (isNaN(d.getTime())) return null;
  const dayOfWeek = d.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setDate(d.getDate() - daysToMonday);
  return d;
}

export function getWeeklyData(applications, { limit = 6 } = {}) {
  if (!Array.isArray(applications)) return [];
  const weeks = {};
  applications.forEach((app) => {
    if (!app || !app.data) return;
    const monday = mondayOf(app.data);
    if (!monday) return;
    const weekLabel = monday.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    weeks[weekLabel] = (weeks[weekLabel] || 0) + 1;
  });
  return Object.keys(weeks)
    .map((week) => ({ week, count: weeks[week] }))
    .slice(-limit);
}

function isoDate(date) {
  return date.toISOString().split("T")[0];
}

export function getStreak(applications, today = new Date()) {
  if (!Array.isArray(applications)) return 0;
  const dates = new Set(applications.filter((a) => a && a.data).map((a) => a.data));
  const cursor = new Date(today);
  let streak = 0;
  while (dates.has(isoDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getThisWeekCount(applications, today = new Date()) {
  if (!Array.isArray(applications)) return 0;
  const todayStr = isoDate(today);
  const monday = mondayOf(today);
  if (!monday) return 0;
  const mondayStr = isoDate(monday);
  return applications.filter(
    (app) => app && app.data && app.data >= mondayStr && app.data <= todayStr
  ).length;
}

export function getStatusStyle(status) {
  if (status === "applied") return { background: "rgba(79,142,247,0.15)", color: "#4f8ef7" };
  if (status === "interview") return { background: "rgba(0,229,160,0.15)", color: "#00e5a0" };
  if (status === "rejected") return { background: "rgba(255,107,107,0.15)", color: "#ff6b6b" };
  return undefined;
}
