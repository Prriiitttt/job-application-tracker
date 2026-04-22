import React from "react";
import "./Applied.css";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Search, Download, List, LayoutGrid, Plus, FileText, Upload, X, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Applied({
  applications,
  addApplication,
  updateApplication,
  deleteApplication,
  session,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("appliedViewMode") || "list";
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const touchState = useRef({ id: null, clone: null, originColumn: null });
  const columnRefs = useRef({});

  const filteredApplications = applications.filter((app) => {
    const matchesStatus =
      filterStatus === "all" || app.status === filterStatus;
    const matchesSearch =
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusOptions = [
    { value: "applied", label: "Applied" },
    { value: "interview", label: "Interview" },
  ];

  function handleViewModeChange(mode) {
    setViewMode(mode);
    localStorage.setItem("appliedViewMode", mode);
  }

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
    setResumeFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function validateForm() {
    const newErrors = {};
    if (!formData.company) newErrors.company = "Company is required";
    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.data) newErrors.data = "Date is required";
    else if (formData.data > new Date().toISOString().split("T")[0])
      newErrors.data = "Date cannot be in the future";
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const foundErrors = validateForm();

    if (Object.keys(foundErrors).length > 0) {
      setErrors(foundErrors);
      return;
    }

    setErrors({});
    setUploading(true);

    const created = await addApplication(formData);
    if (created && resumeFile) {
      const filePath = `${session.user.id}/${created.id}-${resumeFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, resumeFile);
      if (!uploadError) {
        await updateApplication(created.id, { resume_url: filePath });
      }
    }

    setUploading(false);
    setResumeFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFormData({
      company: "",
      role: "",
      data: "",
      status: "applied",
      notes: "",
    });
    setShowForm(false);
  }

  function handleResumeChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, resume: "File must be under 5MB" }));
      e.target.value = "";
      return;
    }
    setErrors((prev) => {
      const { resume, ...rest } = prev;
      return rest;
    });
    setResumeFile(file);
  }

  async function handleViewResume(resumeUrl) {
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(resumeUrl, 60);
    if (!error && data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  }

  async function handleRemoveResume(id, resumeUrl) {
    await supabase.storage.from("resumes").remove([resumeUrl]);
    await updateApplication(id, { resume_url: null });
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

  const kanbanColumns = [
    { status: "applied", label: "Applied", color: "#4f8ef7" },
    { status: "interview", label: "Interview", color: "#00e5a0" },
    { status: "rejected", label: "Rejected", color: "#ff6b6b" },
  ];

  function handleDragStart(e, id) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e, status) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  }

  function handleDragLeave() {
    setDragOverColumn(null);
  }

  function handleDrop(e, newStatus) {
    e.preventDefault();
    if (draggedId) {
      updateApplication(draggedId, { status: newStatus });
      setDraggedId(null);
      setDragOverColumn(null);
    }
  }

  const handleTouchStart = useCallback((e, id) => {
    const card = e.currentTarget;
    const touch = e.touches[0];
    const rect = card.getBoundingClientRect();
    const clone = card.cloneNode(true);
    clone.className = "kanban-card kanban-card-dragging";
    clone.style.width = rect.width + "px";
    clone.style.left = rect.left + "px";
    clone.style.top = rect.top + "px";
    document.body.appendChild(clone);
    const app = applications.find((a) => a.id === id);
    touchState.current = {
      id,
      clone,
      originColumn: app?.status,
      offsetX: touch.clientX - rect.left,
      offsetY: touch.clientY - rect.top,
    };
    setDraggedId(id);
  }, [applications]);

  const handleTouchMove = useCallback((e) => {
    const { clone, offsetX, offsetY } = touchState.current;
    if (!clone) return;
    e.preventDefault();
    const touch = e.touches[0];
    clone.style.left = touch.clientX - offsetX + "px";
    clone.style.top = touch.clientY - offsetY + "px";
    let found = null;
    for (const [status, el] of Object.entries(columnRefs.current)) {
      const r = el.getBoundingClientRect();
      if (touch.clientX >= r.left && touch.clientX <= r.right &&
          touch.clientY >= r.top && touch.clientY <= r.bottom) {
        found = status;
        break;
      }
    }
    setDragOverColumn(found);
  }, []);

  const handleTouchEnd = useCallback(() => {
    const { id, clone } = touchState.current;
    if (clone) {
      clone.remove();
    }
    if (id && dragOverColumn) {
      updateApplication(id, { status: dragOverColumn });
    }
    touchState.current = { id: null, clone: null, originColumn: null };
    setDraggedId(null);
    setDragOverColumn(null);
  }, [dragOverColumn, updateApplication]);

  useEffect(() => {
    if (!draggedId) return;
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [draggedId, handleTouchMove, handleTouchEnd]);

  function exportToCSV() {
    const headers = ["Company", "Role", "Date", "Status", "Notes"];
    const rows = applications.map((app) => [
      app.company,
      app.role,
      app.data,
      app.status,
      app.notes || "",
    ]);
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "applications.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <motion.div
      className="application"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div>
        <div className={`application-header ${showForm ? "blurred" : ""}`}>
          <h1>My Applications</h1>
          {applications.length > 0 && (
            <div className="header-controls">
              <select
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="view-toggle">
                <button
                  className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => handleViewModeChange("list")}
                >
                  <List size={18} />
                </button>
                <button
                  className={`view-toggle-btn ${viewMode === "kanban" ? "active" : ""}`}
                  onClick={() => handleViewModeChange("kanban")}
                >
                  <LayoutGrid size={18} />
                </button>
              </div>
            </div>
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
                <fieldset disabled={uploading} style={{ border: "none", padding: 0, margin: 0 }}>
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
                      max={new Date().toISOString().split("T")[0]}
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

                  <div className="form-field">
                    <label>Resume (optional)</label>
                    <div
                      className="file-upload-area"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeChange}
                        hidden
                      />
                      {resumeFile ? (
                        uploading ? (
                          <div className="file-uploading">
                            <Loader2 size={16} className="form-spinner" />
                            <span>Uploading resume...</span>
                          </div>
                        ) : (
                          <div className="file-selected">
                            <FileText size={16} />
                            <span className="file-name">{resumeFile.name}</span>
                            <button
                              type="button"
                              className="file-remove-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setResumeFile(null);
                                fileInputRef.current.value = "";
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="file-placeholder">
                          <Upload size={16} />
                          <span>Click to upload PDF, DOC, or DOCX</span>
                        </div>
                      )}
                    </div>
                    {errors.resume && (
                      <span className="error-msg">{errors.resume}</span>
                    )}
                  </div>
                  <button type="submit" className="submit-btn" disabled={uploading}>
                    {uploading && <Loader2 size={16} className="form-spinner" />}
                    {uploading ? "Saving..." : "Submit"}
                  </button>
                  <button type="button" onClick={cancelForm} disabled={uploading}>
                    Cancel
                  </button>
                </form>
                </fieldset>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {applications.length > 0 && (
          <div className={`search-filter-bar ${showForm ? "blurred" : ""}`}>
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by company or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="add-btn" onClick={handleAddBtn}>
              <Plus size={14} />
              <span className="add-btn-label">Add Application</span>
            </button>
            <button className="export-btn" onClick={exportToCSV}>
              <Download size={14} />
              <span className="export-label">Export to CSV</span>
            </button>
          </div>
        )}

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
        ) : viewMode === "list" ? (
          <div className={`applications-table ${showForm ? "blurred" : ""}`}>
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Resume</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application) => (
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
                    <td data-label="Resume">
                      {application.resume_url && (
                        <button
                          className="view-resume-btn"
                          onClick={() =>
                            handleViewResume(application.resume_url)
                          }
                        >
                          <FileText size={14} />
                          <span>View</span>
                        </button>
                      )}
                    </td>
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
            {filteredApplications.length === 0 && (
              <motion.div
                className="empty-state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Search size={40} color="#64748b" />
                <h2>No results found</h2>
                <p>Try a different search term or filter.</p>
              </motion.div>
            )}
          </div>
        ) : (
          <div className={`kanban-board ${showForm ? "blurred" : ""}`}>
            {kanbanColumns.map((col) => {
              const columnApps = filteredApplications.filter(
                (app) => app.status === col.status,
              );
              return (
                <div
                  key={col.status}
                  className={`kanban-column${dragOverColumn === col.status && draggedId ? " kanban-column-dragover" : ""}`}
                  ref={(el) => (columnRefs.current[col.status] = el)}
                  onDragOver={(e) => handleDragOver(e, col.status)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.status)}
                >
                  <div className="kanban-column-header">
                    <span
                      className="kanban-column-dot"
                      style={{ background: col.color }}
                    ></span>
                    <span>{col.label}</span>
                    <span className="kanban-column-count">
                      {columnApps.length}
                    </span>
                  </div>
                  <div className="kanban-cards">
                    {columnApps.map((app) => (
                      <motion.div
                        key={app.id}
                        className="kanban-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onTouchStart={(e) => handleTouchStart(e, app.id)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="kanban-card-company">
                          {app.company}
                        </span>
                        <span className="kanban-card-role">{app.role}</span>
                        <span className="kanban-card-date">{app.data}</span>
                        {app.resume_url && (
                          <button
                            className="kanban-resume-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewResume(app.resume_url);
                            }}
                          >
                            <FileText size={12} />
                            <span>Resume</span>
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
