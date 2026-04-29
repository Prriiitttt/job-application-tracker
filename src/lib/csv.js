export function csvEscape(value) {
  const s = value === null || value === undefined ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(rows) {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

export const APPLICATION_CSV_HEADERS = ["Company", "Role", "Date", "Status", "Notes"];

export function applicationsToCSV(applications) {
  const rows = (applications || []).map((app) => [
    app.company,
    app.role,
    app.data,
    app.status,
    app.notes || "",
  ]);
  return toCsv([APPLICATION_CSV_HEADERS, ...rows]);
}
