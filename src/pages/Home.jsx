import React from "react";
import { useState } from "react";
import "./Home.css";

export default function Home() {

  const [applications, setApplications] = useState(() => {
      const savedApplications = localStorage.getItem("applications");
      return savedApplications ? JSON.parse(savedApplications) : [];
    });

  console.log(applications)
  
  const appliedApplication = applications.filter((application) => application.status === "applied" ||  application.status === "Applied")
  const rejectedApplication = applications.filter((application) => application.status === "rejected" ||  application.status === "Rejected")
  const interviewSetup = applications.filter((application) => application.status === "interview" ||  application.status === "Interview")

  return (
    <div className="home">
      <h1>Dashboard Overview</h1>
      <div className="tiles">
        <div className="tile total-Applications">
          <h2>Total Applications</h2>
          <p className="tile-count">{applications.length}</p>
        </div>
        <div className="tile applied">
          <h3>Applied</h3>
          <p className="tile-count">{appliedApplication.length}</p>
        </div>
        <div className="tile interviews">
          <h3>Interviews</h3>
          <p className="tile-count">{interviewSetup.length}</p>
        </div>
        <div className="tile rejected">
          <h3>Rejected</h3>
          <p className="tile-count">{rejectedApplication.length}</p>
        </div>
      </div>
    </div>
  );
}
