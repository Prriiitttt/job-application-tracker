import React from "react";
import "./Applied.css";
import { useState, useEffect } from "react";

export default function Applied() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    company: "",
    role: "",
    date: "",
    status: "Applied",
    notes: "",
  });
  const [applications, setApplications] = useState(() => {
    const savedApplications = localStorage.getItem("applications");
    return savedApplications ? JSON.parse(savedApplications) : [];
  });

  function handleAddBtn() {
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setApplications([...applications, {...formData, id: Date.now()}]);
    setFormData({
      company: "",
      role: "",
      date: "",
      status: "Applied",
      notes: "",
    });
    setShowForm(false);
  }

  useEffect(() => {
    localStorage.setItem("applications", JSON.stringify(applications));
  }, [applications]);

  function handleStatusChange(index, newStatus) {
    const updatedApplications = [...applications]
    updatedApplications[index].status = newStatus
    setApplications(updatedApplications)
  }

  function getStatusStyle(status) {
  if (status === "Applied" || "applied")   return { background: "rgba(79,142,247,0.15)",  color: "#4f8ef7" }
  if (status === "Interview" || "interview") return { background: "rgba(0,229,160,0.15)",   color: "#00e5a0" }
  if (status === "Rejected" || "rejected")  return { background: "rgba(255,107,107,0.15)", color: "#ff6b6b" }
} 

  return (
    <div className="application">
      <div className="application-header">
        <h1>My Applications</h1>
        <button className="add-btn" onClick={handleAddBtn}>
          + Add New Application
        </button>
      </div>
      {showForm && (
        <div className="application-form">
          <form onSubmit={handleSubmit}>
            <label htmlFor="company">Company: </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
            />
            <label htmlFor="role">Role:</label>
            <input
              type="text"
              id="role"
              name="role"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
            />
            <label htmlFor="date">Date:</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
            <label htmlFor="status">Status:</label>
            <select
              name="status"
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="applied">Applied</option>
              <option value="rejected">Rejected</option>
              <option value="interview">Interview</option>
            </select>
            <label htmlFor="notes">Notes:</label>
            <textarea
              id="notes"
              name="notes"
              cols="11"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
            <input type="submit" value="Submit" />
            <button type="button" onClick={cancelForm}>
              Cancel
            </button>
          </form>
        </div>
      )}
      <div className="applications-table">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Date</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application, index) => (
              <tr key={application.id}>
                <td>{application.company}</td>
                <td>{application.role}</td>
                <td>{application.date}</td>
                <td>
                  <select name="status" id={`status-${index}`} value={application.status} style={getStatusStyle(application.status)} 
                    onChange={(e) => handleStatusChange(index, e.target.value)}
                  >
                    <option value="applied">Applied</option>
                    <option value="rejected">Rejected</option>
                    <option value="interview">Interview</option>
                  </select>
                </td>
                <td>{application.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
