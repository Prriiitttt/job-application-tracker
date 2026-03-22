import React from "react";
import "./Applied.css";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Applied({ applications, setApplications }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    company: "",
    role: "",
    date: "",
    status: "applied",
    notes: "",
  });
  const [errors, setErrors] = useState({});

  function handleAddBtn() {
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setFormData({
      company: "",
      role: "",
      date: "",
      status: "applied",
      notes: "",
    });
    setErrors({});
  }

  function validateForm() {
    const newErrors = {};
    if (!formData.company) newErrors.company = "Company is required";
    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.date) newErrors.date = "Date is required";
    return newErrors;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const foundErrors = validateForm();

    if (Object.keys(foundErrors).length > 0) {
      setErrors(foundErrors);
      return;
    }

    setErrors({});

    setApplications([...applications, { ...formData, id: Date.now() }]);
    setFormData({
      company: "",
      role: "",
      date: "",
      status: "applied",
      notes: "",
    });
    setShowForm(false);
  }

  function handleStatusChange(index, newStatus) {
    const updatedApplications = [...applications];
    updatedApplications[index].status = newStatus;
    setApplications(updatedApplications);
  }

  function getStatusStyle(status) {
    if (status === "applied")
      return { background: "rgba(79,142,247,0.15)", color: "#4f8ef7" };
    if (status === "interview")
      return { background: "rgba(0,229,160,0.15)", color: "#00e5a0" };
    if (status === "rejected")
      return { background: "rgba(255,107,107,0.15)", color: "#ff6b6b" };
  }

  function handleDelete(id) {
    const updatedApplications = applications.filter((app) => app.id !== id);
    setApplications(updatedApplications);
  }

  return (
    <motion.div
      className="home"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="application">
        <div className={`application-header ${showForm ? "blurred" : ""}`}>
          <h1>My Applications</h1>
          <button className="add-btn" onClick={handleAddBtn}>
            + Add New Application
          </button>
        </div>
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="application-form">
                <form onSubmit={handleSubmit}>
                  <h2>Add Application Form</h2>

                  <div className="form-field">
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      placeholder="Company Name"
                      onChange={(e) =>
                        setFormData({ ...formData, company: e.target.value })
                      }
                    />
                    {errors.company && (
                      <span className="error-msg">{errors.company}</span>
                    )}
                  </div>

                  <div className="form-field">
                    <input
                      type="text"
                      id="role"
                      name="role"
                      placeholder="Role"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                    />
                    {errors.role && (
                      <span className="error-msg">{errors.role}</span>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="date">Status</label>
                    <select
                      name="status"
                      id="status"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                    >
                      <option value="applied">Applied</option>
                      <option value="interview">Interview</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="date">Date Applied</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                    />
                    {errors.date && (
                      <span className="error-msg">{errors.date}</span>
                    )}
                  </div>

                  <div className="form-field">
                    <textarea
                      id="notes"
                      name="notes"
                      cols="11"
                      placeholder="Notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                    />
                  </div>
                  <input type="submit" value="Submit" />
                  <button type="button" onClick={cancelForm}>
                    Cancel
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`applications-table ${showForm ? "blurred" : ""}`}>
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Date</th>
                <th>Status</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application, index) => (
                <tr key={application.id}>
                  <td>{application.company}</td>
                  <td>{application.role}</td>
                  <td>{application.date}</td>
                  <td>
                    <select
                      name="status"
                      id={`status-${index}`}
                      value={application.status}
                      style={getStatusStyle(application.status)}
                      onChange={(e) =>
                        handleStatusChange(index, e.target.value)
                      }
                    >
                      <option value="applied">Applied</option>
                      <option value="rejected">Rejected</option>
                      <option value="interview">Interview</option>
                    </select>
                  </td>
                  <td>{application.notes}</td>
                  <td>
                    <button
                    className="delete-btn"
                    onClick={() => handleDelete(application.id)}
                  >🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
