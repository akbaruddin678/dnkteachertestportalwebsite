import React, { useState, useEffect } from "react";
import {
  getCampusDashboard,
  getCampusStudents,
  getCampusCoursescor,
  getTeachers,
} from "../../../services/api";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getCampusDashboard();
      setDashboardData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch dashboard data");
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div
        className="dashboard"
        style={{
          padding: "20px",
          minHeight: "calc(100vh - 80px)",
          backgroundColor: "#f8f9fa",
        }}
      >
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "400px" }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="dashboard"
        style={{
          padding: "20px",
          minHeight: "calc(100vh - 80px)",
          backgroundColor: "#f8f9fa",
        }}
      >
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error!</h4>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="btn btn-danger">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <div
        className="dashboard"
        style={{
          padding: "20px",
          minHeight: "calc(100vh - 80px)",
          backgroundColor: "#f8f9fa",
        }}
      >
        <div className="alert alert-warning" role="alert">
          No data available
        </div>
      </div>
    );
  }

  const { campus, statistics, recentStudents, recentCourses, coordinators } =
    dashboardData;

  return (
    <div
      className="dashboard"
      style={{
        padding: "20px",
        minHeight: "calc(100vh - 80px)",
        backgroundColor: "#f8f9fa",
      }}
    >
      {/* Header */}

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div
            className="card h-100"
            style={{
              border: "none",
              borderRadius: "10px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "50%",
                    backgroundColor: "#e3f2fd",
                    color: "#1976d2",
                    marginRight: "15px",
                  }}
                >
                  <i className="fas fa-users" style={{ fontSize: "24px" }}></i>
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#2c3e50",
                      margin: "0",
                    }}
                  >
                    {statistics.students}
                  </h2>
                  <p style={{ color: "#7f8c8d", margin: "0" }}>
                    Total Students
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div
            className="card h-100"
            style={{
              border: "none",
              borderRadius: "10px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "50%",
                    backgroundColor: "#e8f5e9",
                    color: "#388e3c",
                    marginRight: "15px",
                  }}
                >
                  <i className="fas fa-book" style={{ fontSize: "24px" }}></i>
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#2c3e50",
                      margin: "0",
                    }}
                  >
                    {statistics.courses}
                  </h2>
                  <p style={{ color: "#7f8c8d", margin: "0" }}>Total Courses</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div
            className="card h-100"
            style={{
              border: "none",
              borderRadius: "10px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "50%",
                    backgroundColor: "#f3e5f5",
                    color: "#7b1fa2",
                    marginRight: "15px",
                  }}
                >
                  <i
                    className="fas fa-clipboard-check"
                    style={{ fontSize: "24px" }}
                  ></i>
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#2c3e50",
                      margin: "0",
                    }}
                  >
                    {statistics.attendanceRecords}
                  </h2>
                  <p style={{ color: "#7f8c8d", margin: "0" }}>
                    Attendance Records
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Students and Courses */}
      <div className="row mb-4">
        {/* Recent Students */}
        <div className="col-lg-6 mb-3">
          <div
            className="card h-100"
            style={{
              border: "none",
              borderRadius: "10px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="card-body">
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#2c3e50",
                  marginBottom: "16px",
                }}
              >
                Recent Students
              </h3>
              {recentStudents && recentStudents.length > 0 ? (
                <div>
                  {recentStudents.map((student) => (
                    <div
                      key={student._id}
                      className="d-flex justify-content-between align-items-center p-3 border-bottom"
                    >
                      <div>
                        <p
                          style={{
                            fontWeight: "500",
                            color: "#2c3e50",
                            margin: "0",
                          }}
                        >
                          {student.name}
                        </p>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#7f8c8d",
                            margin: "0",
                          }}
                        >
                          {student.email}
                        </p>
                      </div>
                      <span style={{ fontSize: "14px", color: "#7f8c8d" }}>
                        {student.phone}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#7f8c8d" }}>No students found</p>
              )}
              <div className="mt-3">
                <a
                  href="/students"
                  style={{
                    color: "#1976d2",
                    textDecoration: "none",
                    fontWeight: "500",
                  }}
                >
                  View all students →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Courses */}
        <div className="col-lg-6 mb-3">
          <div
            className="card h-100"
            style={{
              border: "none",
              borderRadius: "10px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="card-body">
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#2c3e50",
                  marginBottom: "16px",
                }}
              >
                Recent Courses
              </h3>
              {recentCourses && recentCourses.length > 0 ? (
                <div>
                  {recentCourses.map((course) => (
                    <div
                      key={course._id}
                      className="d-flex justify-content-between align-items-center p-3 border-bottom"
                    >
                      <div>
                        <p
                          style={{
                            fontWeight: "500",
                            color: "#2c3e50",
                            margin: "0",
                          }}
                        >
                          {course.name}
                        </p>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#7f8c8d",
                            margin: "0",
                          }}
                        >
                          {course.code}
                        </p>
                      </div>
                      <span style={{ fontSize: "14px", color: "#7f8c8d" }}>
                        {course.teacher
                          ? course.teacher.name
                          : "No teacher assigned"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#7f8c8d" }}>No courses found</p>
              )}
              <div className="mt-3">
                <a
                  href="/courses"
                  style={{
                    color: "#1976d2",
                    textDecoration: "none",
                    fontWeight: "500",
                  }}
                >
                  View all courses →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campus Information */}
      <div
        className="card"
        style={{
          border: "none",
          borderRadius: "10px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="card-body">
          <h3
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#2c3e50",
              marginBottom: "16px",
            }}
          >
            Campus Information
          </h3>
          <div className="row">
            <div className="col-md-6">
              <p style={{ color: "#7f8c8d", marginBottom: "8px" }}>
                <span style={{ fontWeight: "500", color: "#2c3e50" }}>
                  Name:
                </span>{" "}
                {campus.name}
              </p>
              <p style={{ color: "#7f8c8d", marginBottom: "8px" }}>
                <span style={{ fontWeight: "500", color: "#2c3e50" }}>
                  Location:
                </span>{" "}
                {campus.location}
              </p>
              <p style={{ color: "#7f8c8d", marginBottom: "8px" }}>
                <span style={{ fontWeight: "500", color: "#2c3e50" }}>
                  Address:
                </span>{" "}
                {campus.address}
              </p>
            </div>
            <div className="col-md-6">
              <p style={{ color: "#7f8c8d", marginBottom: "8px" }}>
                <span style={{ fontWeight: "500", color: "#2c3e50" }}>
                  Contact:
                </span>{" "}
                {campus.contactNumber}
              </p>
              <p style={{ color: "#7f8c8d", marginBottom: "8px" }}>
                <span style={{ fontWeight: "500", color: "#2c3e50" }}>
                  Coordinators:
                </span>{" "}
                {coordinators?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
