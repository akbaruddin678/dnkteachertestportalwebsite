import React, { useEffect, useState } from "react";
import {
  FaBook,
  FaUsers,
  FaChalkboardTeacher,
  FaBuilding,
  FaSync,
} from "react-icons/fa";

const TeacherCampusDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState(null);

  const API_BASE = "/api/v1";

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await fetch(`${API_BASE}/teacher/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch dashboard data");
      }
    } catch (err) {
      setError(err.message || "An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "400px" }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="ms-3">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          <h4 className="alert-heading">Error</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchDashboard}>
            <FaSync className="me-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning">No dashboard data available</div>
      </div>
    );
  }

  const { teacher, campus, courses } = dashboardData;

  return (
    <div className="container-fluid py-4">
      {/* Header Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">
                <FaChalkboardTeacher className="me-2" />
                Teacher Dashboard
              </h1>
              <p className="text-muted mb-0">
                Welcome back, {teacher?.name || "Teacher"}
              </p>
            </div>
            <button
              className="btn btn-outline-primary"
              onClick={fetchDashboard}
            >
              <FaSync className="me-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                  <FaBuilding className="text-primary" size={24} />
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Campus</h6>
                  <h4 className="mb-0">{campus?.name || "N/A"}</h4>
                  <small className="text-muted">{campus?.location || ""}</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                  <FaUsers className="text-success" size={24} />
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Total Students</h6>
                  <h4 className="mb-0">{campus?.totalStudents || 0}</h4>
                  <small className="text-muted">In campus</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                  <FaBook className="text-info" size={24} />
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Total Courses</h6>
                  <h4 className="mb-0">{campus?.totalCourses || 0}</h4>
                  <small className="text-muted">Available</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campus Details */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <FaBuilding className="me-2" />
                Campus Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p>
                    <strong>Name:</strong> {campus?.name || "N/A"}
                  </p>
                  <p>
                    <strong>Location:</strong> {campus?.location || "N/A"}
                  </p>
                </div>
                <div className="col-md-6">
                  <p>
                    <strong>Address:</strong> {campus?.address || "N/A"}
                  </p>
                  <p>
                    <strong>Contact:</strong> {campus?.contactNumber || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Information */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <FaChalkboardTeacher className="me-2" />
                Teacher Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p>
                    <strong>Name:</strong> {teacher?.name || "N/A"}
                  </p>
                  <p>
                    <strong>Contact:</strong> {teacher?.contactNumber || "N/A"}
                  </p>
                </div>
                <div className="col-md-6">
                  <p>
                    <strong>Specialization:</strong>{" "}
                    {teacher?.subjectSpecialization || "N/A"}
                  </p>
                  <p>
                    <strong>Qualifications:</strong>{" "}
                    {teacher?.qualifications || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <FaBook className="me-2" />
                Available Courses ({courses?.length || 0})
              </h5>
            </div>
            <div className="card-body">
              {courses && courses.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Course Name</th>
                        <th>Code</th>
                        <th>Description</th>
                        <th>Credit Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => (
                        <tr key={course._id}>
                          <td>{course.name}</td>
                          <td>
                            <span className="badge bg-secondary">
                              {course.code}
                            </span>
                          </td>
                          <td>{course.description || "No description"}</td>
                          <td>
                            <span className="badge bg-info">
                              {course.creditHours || 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FaBook size={48} className="text-muted mb-3" />
                  <p className="text-muted">No courses available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherCampusDashboard;
