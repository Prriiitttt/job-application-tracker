import React from "react";
import "./Applied.css";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList } from "lucide-react";

export default function Applied({
  applications,
  addApplication,
  updateApplication,
  deleteApplication,
}) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    company: "",
    role: "",
    data: "",
    status: "applied",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [statusOpen, setStatusOpen] = useState(false);

  const statusOptions = [
    { value: "applied", label: "Applied" },
    { value: "interview", label: "Interview" },
  ];

  function handleAddBtn() {
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setFormData({
      company: "",
      role: "",
      data: "",
      status: "applied",
      notes: "",
    });
    setErrors({});
  }

  function validateForm() {
    const newErrors = {};
    if (!formData.company) newErrors.company = "Company is required";
    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.data) newErrors.data = "Date is required";
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

    addApplication(formData);
    setFormData({
      company: "",
      role: "",
      data: "",
      status: "applied",
      notes: "",
    });
    setShowForm(false);
  }

  function handleStatusChange(id, newStatus) {
    updateApplication(id, { status: newStatus });
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
    deleteApplication(id);
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
          {applications.length > 0 && (
            <button className="add-btn" onClick={handleAddBtn}>
              + Add New Application
            </button>
          )}
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
                    <label htmlFor="status">Status</label>
                    <div className="custom-select">
                      <button
                        type="button"
                        className="custom-select-button"
                        onClick={() => setStatusOpen(!statusOpen)}
                      >
                        <span>
                          {
                            statusOptions.find(
                              (o) => o.value === formData.status,
                            )?.label
                          }
                        </span>
                        <span className="custom-select-caret">
                          {statusOpen ? "\u25B4" : "\u25BE"}
                        </span>
                      </button>
                      {statusOpen && (
                        <ul className="custom-select-list">
                          {statusOptions.map((opt) => (
                            <li
                              key={opt.value}
                              className={
                                formData.status === opt.value ? "selected" : ""
                              }
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  status: opt.value,
                                });
                                setStatusOpen(false);
                              }}
                            >
                              {opt.label}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="data">Date Applied</label>
                    <input
                      type="date"
                      id="data"
                      name="data"
                      value={formData.data}
                      onChange={(e) =>
                        setFormData({ ...formData, data: e.target.value })
                      }
                    />
                    {errors.data && (
                      <span className="error-msg">{errors.data}</span>
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

        {applications.length === 0 ? (
          <motion.div
            className={`empty-state ${showForm ? "blurred" : ""}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <ClipboardList size={48} color="#4f8ef7" />
            <h2>No applications yet</h2>
            <p>Start tracking your job search by adding your first application.</p>
            <button className="add-btn" onClick={handleAddBtn}>
              + Add New Application
            </button>
          </motion.div>
        ) : (
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
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td data-label="Company">{application.company}</td>
                    <td data-label="Role">{application.role}</td>
                    <td data-label="Date">{application.data}</td>
                    <td data-label="Status">
                      <select
                        name="status"
                        id={`status-${application.id}`}
                        value={application.status}
                        style={getStatusStyle(application.status)}
                        onChange={(e) =>
                          handleStatusChange(application.id, e.target.value)
                        }
                      >
                        <option value="applied">Applied</option>
                        <option value="rejected">Rejected</option>
                        <option value="interview">Interview</option>
                      </select>
                    </td>
                    <td data-label="Notes">{application.notes}</td>
                    <td data-label="">
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(application.id)}
                      >
                        {"\uD83D\uDDD1\uFE0F"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
