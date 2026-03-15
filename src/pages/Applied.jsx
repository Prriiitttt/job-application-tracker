import React from 'react'
import "./Applied.css"

export default function Applied () {
  return (
    <div className='application'>
      <div className="application-header">
        <h1>My Applications</h1>
        <button className='add-btn'>+ Add New Application</button>
      </div>
      <div className="applications-table"></div>
    </div>
  )
}


