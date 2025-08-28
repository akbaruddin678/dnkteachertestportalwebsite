import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CoCategory.css";

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
  );
};

export default Category;