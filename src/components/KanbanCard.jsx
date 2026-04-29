import React, { memo } from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

function KanbanCard({ app, onDragStart, onTouchStart, onViewResume }) {
  return (
    <motion.div
      className="kanban-card"
      draggable
      onDragStart={(e) => onDragStart(e, app.id)}
      onTouchStart={(e) => onTouchStart(e, app.id)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <span className="kanban-card-company">{app.company}</span>
      <span className="kanban-card-role">{app.role}</span>
      <span className="kanban-card-date">{app.data}</span>
      {app.resume_url && (
        <button
          className="kanban-resume-btn"
          onClick={(e) => {
            e.stopPropagation();
            onViewResume(app.resume_url);
          }}
        >
          <FileText size={12} />
          <span>Resume</span>
        </button>
      )}
    </motion.div>
  );
}

export default memo(KanbanCard, (prev, next) => {
  // Re-render only when the underlying application data changes.
  return (
    prev.app === next.app &&
    prev.onDragStart === next.onDragStart &&
    prev.onTouchStart === next.onTouchStart &&
    prev.onViewResume === next.onViewResume
  );
});
