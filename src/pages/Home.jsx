import React from 'react'

export default function Home() {
  return (
    <div className='home'>
        <h1>Dashboard</h1>
        <p>Here's your job hunt at a glance!</p>
        <div className='tiles'>
          <div>Total Applications</div>
          <div>Applied</div>
          <div>Interviews</div>
          <div>Rejected</div>
        </div>
    </div>
  )
}

