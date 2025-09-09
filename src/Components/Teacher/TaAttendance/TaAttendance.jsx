import React, { useEffect, useMemo, useState } from "react";
import { FaSync, FaSave, FaUsers, FaCalendarAlt } from "react-icons/fa";

// const API_BASE = "http://localhost:5000/api/v1";
const API_BASE = import.meta.env?.VITE_API_BASE || "/api/v1";
const UI_STATUSES = ["Present", "Absent", "Half Day", "Leave", "Other"];

const uiToDb = (s) =>
  s === "Present"
    ? "present"
    : s === "Absent"
    ? "absent"
    : s === "Other"
    ? "other"
    : s;

const dbToUi = (s) =>
  s === "present"
    ? "Present"
    : s === "absent"
    ? "Absent"
    : s === "other"
    ? "Other"
    : s;

const Attendance = () => {
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // NEW: search query state
  const [bulkStatus, setBulkStatus] = useState(""); // NEW: bulk status select state

  const token = localStorage.getItem("token");
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;

  if (user) {
    console.log(user.id);
    console.log(user.role); // "teacher"
    console.log(user.email); // "testing1@gmail.com"
  }

  // Fetch students from teacher's campus
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");
      // console.log(user.id);
      const response = await fetch(`${API_BASE}/teacher/studentdetails`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
      if (data.success) {
        setStudents(data.data.students || []);
      } else {
        throw new Error(data.message || "Failed to load students");
      }
    } catch (err) {
      setError(err.message || "Error loading students");
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance for selected date
  const fetchAttendance = async () => {
    if (!selectedDate) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/attendance?date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Convert array of attendance records to object keyed by student ID
          const recordsObj = {};
          data.data.forEach((record) => {
            recordsObj[record.student._id] = {
              status: dbToUi(record.status),
              reason: record.reason || "",
            };
          });
          setAttendanceRecords(recordsObj);
        }
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      fetchAttendance();
    }
  }, [selectedDate, students]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: status,
        ...(status !== "Other" ? { reason: "" } : {}),
      },
    }));
  };

  const handleReasonChange = (studentId, reason) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        reason: reason,
      },
    }));
  };

  // NEW: bulk status change for ALL students
  const handleBulkStatusChange = (status) => {
    setBulkStatus(status);
    setAttendanceRecords((prev) => {
      const next = { ...prev };
      students.forEach((s) => {
        const existing = next[s._id] || {};
        next[s._id] = {
          ...existing,
          status: status, // empty string "" will mean Not Marked
          ...(status !== "Other"
            ? { reason: "" }
            : existing.reason
            ? { reason: existing.reason }
            : { reason: "" }),
        };
      });
      return next;
    });
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const attendanceData = Object.entries(attendanceRecords)
        .filter(([_, record]) => record.status)
        .map(([studentId, record]) => ({
          studentId,
          status: uiToDb(record.status),
          reason: record.reason || "",
          date: selectedDate,
        }));

      const response = await fetch(`${API_BASE}/attendance/bulk`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate,
          attendances: attendanceData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save attendance: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setSuccess("Attendance saved successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        throw new Error(data.message || "Failed to save attendance");
      }
    } catch (err) {
      setError(err.message || "Error saving attendance");
    } finally {
      setSaving(false);
    }
  };

  const getStatusCounts = () => {
    const counts = {
      Present: 0,
      Absent: 0,
      "Half Day": 0,
      Leave: 0,
      Other: 0,
      "Not Marked": 0,
    };

    students.forEach((student) => {
      const record = attendanceRecords[student._id];
      if (record && record.status) {
        counts[record.status] = (counts[record.status] || 0) + 1;
      } else {
        counts["Not Marked"] += 1;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  // NEW: memoized filtered list by name
  const filteredStudents = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => (s.name || "").toLowerCase().includes(q));
  }, [students, searchQuery]);

  if (loading && students.length === 0) {
    return (
      <div className="container-fluid py-4">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "400px" }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="ms-3">Loading students...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">
                <FaUsers className="me-2" />
                Attendance Management
              </h1>
              <p className="text-muted mb-0">
                Mark attendance for students in your campus
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-primary"
                onClick={fetchStudents}
                disabled={loading}
              >
                <FaSync className="me-2" />
                Refresh
              </button>
              <button
                className="btn btn-primary"
                onClick={saveAttendance}
                disabled={saving}
              >
                <FaSave className="me-2" />
                {saving ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}
      {success && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          {success}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess("")}
          ></button>
        </div>
      )}

      {/* Date Selection, Summary, Filters */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3 mb-md-0">
          <div className="card h-100">
            <div className="card-body">
              <label htmlFor="attendanceDate" className="form-label">
                <FaCalendarAlt className="me-2" />
                Select Date
              </label>
              <input
                type="date"
                className="form-control"
                id="attendanceDate"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title">Attendance Summary</h6>
              <div className="row">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="col-4 mb-2">
                    <div
                      className={`badge bg-${getStatusBadgeColor(
                        status
                      )} w-100`}
                    >
                      {status}: {count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Search + Bulk status controls */}
      <div className="row mb-3">
        <div className="col-md-6 mb-3 mb-md-0">
          <div className="input-group">
            <span className="input-group-text">Search</span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">Set status for all</span>
            <select
              className="form-select"
              value={bulkStatus}
              onChange={(e) => handleBulkStatusChange(e.target.value)}
            >
              <option value="">Not Marked</option>
              {UI_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Students Attendance</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Reason (if Other)</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => {
                  const record = attendanceRecords[student._id] || {};
                  return (
                    <tr key={student._id}>
                      <td>{index + 1}</td>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.phone}</td>
                      <td>
                        <select
                          className={`form-select form-select-sm ${getStatusClass(
                            record.status
                          )}`}
                          value={record.status || ""}
                          onChange={(e) =>
                            handleStatusChange(student._id, e.target.value)
                          }
                        >
                          <option value="">Not Marked</option>
                          {UI_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {record.status === "Other" ? (
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Enter reason"
                            value={record.reason || ""}
                            onChange={(e) =>
                              handleReasonChange(student._id, e.target.value)
                            }
                          />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredStudents.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted">No students match your search.</p>
            </div>
          )}
          {filteredStudents.length > 0 && students.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted">No students found in your campus.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions for styling
const getStatusClass = (status) => {
  switch (status) {
    case "Present":
      return "bg-success bg-opacity-10";
    case "Absent":
      return "bg-danger bg-opacity-10";
    case "Half Day":
      return "bg-warning bg-opacity-10";
    case "Leave":
      return "bg-info bg-opacity-10";
    case "Other":
      return "bg-secondary bg-opacity-10";
    default:
      return "";
  }
};

const getStatusBadgeColor = (status) => {
  switch (status) {
    case "Present":
      return "success";
    case "Absent":
      return "danger";
    case "Half Day":
      return "warning";
    case "Leave":
      return "info";
    case "Other":
      return "secondary";
    case "Not Marked":
      return "dark";
    default:
      return "light";
  }
};

export default Attendance;
