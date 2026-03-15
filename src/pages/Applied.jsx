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
    const savedApplications = localStorage.getItem("applications")
    return savedApplications ? JSON.parse(savedApplications) : []
  });

  function handleAddBtn() {
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setApplications([...applications, formData]);
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
    localStorage.setItem("applications", JSON.stringify(applications))
  }, [applications])
  

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
      <div className="applications-table"></div>
    </div>
  );
}
