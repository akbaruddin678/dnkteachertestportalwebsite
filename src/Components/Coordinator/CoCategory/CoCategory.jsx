import React, { useState, useEffect } from "react";
import axios from "axios";

const Category = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get("/coordinator/dashboard", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setDashboardData(response.data.data);
        setLoading(false);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch dashboard data"
        );
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading)
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading campus data...</p>
      </div>
    );

  if (error)
    return (
      <div className="error-container">
        <div className="error-icon">!</div>
        <h3>Error Loading Data</h3>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          Retry
        </button>
      </div>
    );

  if (!dashboardData)
    return (
      <div className="empty-state">
        <h3>No Campus Data Found</h3>
        <p>There doesn't appear to be any data for this campus.</p>
      </div>
    );

  return (
    <>
    <style>{`
    /* ===========================
   Category.css — Coordinator Dashboard
   =========================== */

/* ---- CSS Variables (light theme) ---- */
:root {
  --bg: #f7f8fb;
  --surface: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --border: #e5e7eb;
  --primary: #2563eb;
  --primary-weak: #e8f0ff;
  --success: #16a34a;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #0ea5e9;

  --accent-1: #22c55e;
  /* students */
  --accent-2: #8b5cf6;
  /* courses */
  --accent-3: #06b6d4;
  /* attendance */

  --radius: 16px;
  --radius-sm: 12px;
  --shadow-1: 0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06);
  --shadow-2: 0 8px 24px rgba(16, 24, 40, 0.08);
  --shadow-3: 0 16px 40px rgba(16, 24, 40, 0.10);

  --trans: 180ms cubic-bezier(.2, .8, .2, 1);
}

/* ---- Base Reset ---- */
* {
  box-sizing: border-box;
}

html,
body,
#root {
  height: 100%;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ---- Helpers ---- */
.hidden {
  display: none !important;
}

.muted {
  color: var(--muted);
}

/* ---- Containers ---- */
.dashboard-cat {
  max-width: 1200px;
  margin: 24px auto 64px;
  padding: 0 20px;
  animation: fadeIn .5s ease both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ---- Header ---- */
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.dashboard-header h1 {
  font-size: clamp(22px, 2.4vw, 28px);
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  }
  
  .last-updated {
    font-size: 13px;
    color: var(--muted);
    background: var(--surface);
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: 999px;
  }
  
  /* ---- Grid ---- */
  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 18px;
  }
  
  /* ---- Card Base ---- */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-1);
    transition: transform var(--trans), box-shadow var(--trans), border-color var(--trans);
  }
  
  .card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-2);
    border-color: rgba(37, 99, 235, 0.18);
  }
  
  .card-header {
    padding: 16px 18px 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .card-header h2 {
    font-size: 16px;
    margin: 0;
    letter-spacing: .2px;
  }
  
  .card-badge {
    font-size: 12px;
    color: var(--primary);
    background: var(--primary-weak);
    border: 1px solid #d9e6ff;
    padding: 4px 10px;
    border-radius: 999px;
  }
  
  .card-content {
    padding: 8px 18px 18px;
  }
  
  /* ---- Specific Card Placements ---- */
  .campus-info {
    grid-column: span 6;
  }
  
  .stats-card {
    grid-column: span 2;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
  }
  
  .coordinators-card {
    grid-column: span 6;
  }
  
  .students-card {
    grid-column: span 12;
  }
  
  .courses-card {
    grid-column: span 12;
  }
  
  /* Responsive reflow */
  @media (max-width: 1100px) {
    .campus-info {
      grid-column: span 12;
    }
  
    .stats-card {
      grid-column: span 4;
    }
  
    .coordinators-card {
      grid-column: span 12;
    }
  }
  
  @media (max-width: 720px) {
    .stats-card {
      grid-column: span 12;
    }
  }
  
  /* ---- Campus Info ---- */
  .info-item {
    display: grid;
    grid-template-columns: 140px 1fr;
  gap: 10px;
  padding: 10px 0;
    border-bottom: 1px dashed var(--border);
}

.info-item:last-child {
  border-bottom: 0;
}

.info-label {
  color: var(--muted);
  font-size: 13px;
}

.info-value {
  font-weight: 600;
}

/* ---- Stat Cards ---- */
.stat-icon {
  flex: 0 0 auto;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 22px;
  background: #f8fafc;
  border: 1px solid var(--border);
}

.stat-content h3 {
  margin: 0 0 6px;
  font-size: 14px;
  color: var(--muted);
  font-weight: 600;
}

.stat-value {
  margin: 0;
  font-weight: 800;
  font-size: 26px;
  letter-spacing: -0.02em;
}

.stat-change {
  margin-top: 6px;
  font-size: 12px;
  color: var(--success);
}

/* Accents per stat */
.stats-card.students .stat-icon {
  background: rgba(34, 197, 94, .08);
  border-color: rgba(34, 197, 94, .18);
}

.stats-card.courses .stat-icon {
  background: rgba(139, 92, 246, .08);
  border-color: rgba(139, 92, 246, .18);
}

.stats-card.attendance .stat-icon {
  background: rgba(6, 182, 212, .08);
  border-color: rgba(6, 182, 212, .18);
}

/* ---- Coordinators ---- */
.coordinators-list {
  padding: 6px 12px 16px;
  display: grid;
  gap: 10px;
}

.coordinator-item {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: background var(--trans), border-color var(--trans);
}

.coordinator-item:hover {
  background: #f9fbff;
  border-color: rgba(37, 99, 235, 0.25);
}

.coordinator-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
    place-items: center;
    font-weight: 800;
    color: var(--primary);
    background: var(--primary-weak);
    border: 1px solid #dbe7ff;
}

.coordinator-details h4 {
  margin: 0 0 2px;
  font-size: 14px;
}

.coordinator-details p {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.coordinator-contact {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text);
}

/* ---- Buttons ---- */
.view-all-button,
.action-button,
.retry-button {
  appearance: none;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-weight: 600;
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: transform var(--trans), box-shadow var(--trans), border-color var(--trans), background var(--trans);
}

.view-all-button:hover,
.action-button:hover,
.retry-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-1);
  border-color: rgba(37, 99, 235, 0.35);
  background: #f9fbff;
}

.action-button {
  padding: 8px 14px;
}

/* ---- Students Table ---- */
.table-container {
  padding: 8px 16px 16px;
  overflow-x: auto;
  border-top: 1px solid var(--border);
}

.data-table {
  width: 100%;
  border-collapse: separate;
    border-spacing: 0;
    min-width: 720px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }
  
  .data-table thead th {
    text-align: left;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: var(--muted);
    background: #f9fafb;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
  }
  
  .data-table tbody td {
    padding: 14px;
    border-bottom: 1px solid var(--border);
    font-size: 14px;
  }
  
  .data-table tbody tr:last-child td {
    border-bottom: 0;
  }
        .data-table tbody tr:hover td {
          background: #fbfdff;
        }
        .student-info {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
    
        .student-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          font-weight: 800;
          font-size: 12px;
          color: var(--primary);
          background: var(--primary-weak);
          border: 1px solid #dbe7ff;
        }
                                        .status-badge {
                                          font-size: 12px;
                                          font-weight: 700;
                                          padding: 4px 10px;
                                          border-radius: 999px;
                                          border: 1px solid var(--border);
                                        }
    
                                                                                                                                                                                                                                                                .status-badge.verified {
                                                                                                                                                                                                                                                                  color: var(--success);
                                                                                                                                                                                                                                                                  background: rgba(22, 163, 74, 0.08);
                                                                                                                                                                                                                                                                  border-color: rgba(22, 163, 74, 0.25);
                                                                                                                                                                                                                                                                }

/* ---- Courses List ---- */
.courses-list {
  padding: 8px 12px 16px;
  display: grid;
  gap: 10px;
}

.course-item {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: background var(--trans), border-color var(--trans), transform var(--trans);
}

.course-item:hover {
  background: #f9fbff;
  border-color: rgba(37, 99, 235, 0.25);
  transform: translateY(-1px);
}

.course-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 20px;
  background: #f8fafc;
  border: 1px solid var(--border);
}

.course-details h4 {
  margin: 0 0 2px;
  font-size: 15px;
}

.course-code {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.course-teacher {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--text);
}

.course-actions {
  display: flex;
}

/* ---- Loading State ---- */
.loading-container,
.error-container,
.empty-state {
  max-width: 560px;
  margin: 120px auto;
  padding: 28px 24px;
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-1);
}

.loading-spinner {
  width: 38px;
  height: 38px;
  margin: 0 auto 12px;
  border-radius: 50%;
  border: 3px solid #e5e7eb;
  border-top-color: var(--primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container p {
  margin: 0;
  color: var(--muted);
}

/* ---- Error State ---- */
.error-icon {
  width: 44px;
  height: 44px;
  margin: 0 auto 10px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: var(--danger);
  font-weight: 800;
}

.error-container h3 {
  margin: 8px 0 6px;
}

.error-container p {
  margin: 0 0 14px;
  color: var(--muted);
}

.retry-button {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.retry-button:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

/* ---- Empty State ---- */
.empty-state h3 {
  margin: 0 0 6px;
}

.empty-state p {
  margin: 0;
  color: var(--muted);
}

/* ---- Scrollbar (WebKit) ---- */
.table-container::-webkit-scrollbar,
body::-webkit-scrollbar {
  height: 10px;
  width: 10px;
}

.table-container::-webkit-scrollbar-thumb,
body::-webkit-scrollbar-thumb {
  background: #d8dee9;
  border-radius: 999px;
  border: 2px solid #eef2f7;
}

.table-container::-webkit-scrollbar-track,
body::-webkit-scrollbar-track {
  background: #f3f5f9;
  border-radius: 999px;
}

/* ---- Small Screens Tweaks ---- */
@media (max-width: 540px) {
  .dashboard {
    margin-top: 16px;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }                                                                                                                                                                                                                                                 }
}
    `}</style>
    <div className="dashboard-cat">
      <header className="dashboard-header">
        <h1>{dashboardData.campus.name} Dashboard</h1>
        <div className="header-actions">
          <span className="last-updated">Updated just now</span>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Campus Info Card */}
        <div className="card campus-info">
          <div className="card-header">
            <h2>Campus Information</h2>
            <span className="card-badge">Primary</span>
          </div>
          <div className="card-content">
            <div className="info-item">
              <span className="info-label">Location</span>
              <span className="info-value">
                {dashboardData.campus.location || "Not specified"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Contact</span>
              <span className="info-value">
                {dashboardData.campus.contactNumber || "Not specified"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Address</span>
              <span className="info-value">
                {dashboardData.campus.address || "Not specified"}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="card stats-card students">
          <div className="stat-icon">👨‍🎓</div>
          <div className="stat-content">
            <h3>Students</h3>
            <p className="stat-value">{dashboardData.statistics.students}</p>
            <p className="stat-change">+5 this week</p>
          </div>
        </div>

        <div className="card stats-card courses">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Courses</h3>
            <p className="stat-value">{dashboardData.statistics.courses}</p>
            <p className="stat-change">+2 this month</p>
          </div>
        </div>

        <div className="card stats-card attendance">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Attendance</h3>
            <p className="stat-value">
              {dashboardData.statistics.attendanceRecords}
            </p>
            <p className="stat-change">92% rate</p>
          </div>
        </div>

        {/* Coordinators Card */}
        <div className="card coordinators-card">
          <div className="card-header">
            <h2>Campus Coordinators</h2>
            <span className="card-badge">
              {dashboardData.coordinators.length} total
            </span>
          </div>
          <div className="coordinators-list">
            {dashboardData.coordinators.map((coordinator) => (
              <div key={coordinator._id} className="coordinator-item">
                <div className="coordinator-avatar">
                  {coordinator.name.charAt(0)}
                </div>
                <div className="coordinator-details">
                  <h4>{coordinator.name}</h4>
                  <p>{coordinator.user.email}</p>
                  <p className="coordinator-contact">
                    <span>📞 {coordinator.contactNumber}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Students Card */}
        <div className="card students-card">
          <div className="card-header">
            <h2>Recent Students</h2>
            <button className="view-all-button">View All</button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentStudents.map((student) => (
                  <tr key={student._id}>
                    <td>
                      <div className="student-info">
                        <span className="student-avatar">
                          {student.name.charAt(0)}
                        </span>
                        {student.name}
                      </div>
                    </td>
                    <td>{student.email}</td>
                    <td>{student.phone}</td>
                    <td>
                      <span className="status-badge verified">Verified</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Courses Card */}
        <div className="card courses-card">
          <div className="card-header">
            <h2>Active Courses</h2>
            <button className="view-all-button">View All</button>
          </div>
          <div className="courses-list">
            {dashboardData.recentCourses.map((course) => (
              <div key={course._id} className="course-item">
                <div className="course-icon">📖</div>
                <div className="course-details">
                  <h4>{course.name}</h4>
                  <p className="course-code">{course.code}</p>
                  <p className="course-teacher">
                    {course.teacher?.name || "No teacher assigned"}
                  </p>
                </div>
                <div className="course-actions">
                  <button className="action-button">View</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Category;