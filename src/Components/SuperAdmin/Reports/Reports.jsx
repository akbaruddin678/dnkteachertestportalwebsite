"use client";

import { useState, useEffect } from "react";
import api from "../../../services/api"; // Assuming your API file is in lib folder
import "./Reports.css";

const Reports = () => {
  // State management
  const [campuses, setCampuses] = useState([]);
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [loading, setLoading] = useState({
    campuses: true,
    students: false,
    details: false,
  });
  const [error, setError] = useState(null);

  // Data fetching
  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        const response = await api.get("/admin/campuses");
        setCampuses(response.data?.data || []);
        setLoading((prev) => ({ ...prev, campuses: false }));
      } catch (err) {
        setError("Failed to fetch campuses");
        setLoading((prev) => ({ ...prev, campuses: false }));
      }
    };

    fetchCampuses();
  }, []);

  useEffect(() => {
    if (!selectedCampus) return;

    const fetchStudents = async () => {
      try {
        setLoading((prev) => ({ ...prev, students: true }));
        setError(null);
        const response = await api.get(
          `/admin/campuses/${selectedCampus._id}/students`
        );
        setStudents(response.data?.data || []);
        setLoading((prev) => ({ ...prev, students: false }));
      } catch (err) {
        setError("Failed to fetch students");
        setLoading((prev) => ({ ...prev, students: false }));
      }
    };

    fetchStudents();
  }, [selectedCampus]);

  useEffect(() => {
    if (!selectedStudent) return;

    const fetchStudentDetails = async () => {
      try {
        setLoading((prev) => ({ ...prev, details: true }));
        setError(null);

        const [detailsRes, marksRes, attendanceRes] = await Promise.all([
          api.get(`/admin/students/${selectedStudent._id}`),
          api.get(`/admin/marks/${selectedStudent._id}`),
          api.get(`/admin/attendance/${selectedStudent._id}`),
        ]);

        setStudentDetails({
          ...(detailsRes.data?.data || {}),
          marks: marksRes.data?.data || [],
          attendance: attendanceRes.data?.data || [],
        });
        setLoading((prev) => ({ ...prev, details: false }));
      } catch (err) {
        setError("Failed to fetch student details");
        setLoading((prev) => ({ ...prev, details: false }));
      }
    };

    fetchStudentDetails();
  }, [selectedStudent]);

  // Event handlers
  const handleCampusSelect = (campus) => {
    setSelectedCampus(campus);
    setSelectedStudent(null);
    setStudentDetails(null);
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
  };

  const handleBackToCampuses = () => {
    setSelectedCampus(null);
    setStudents([]);
    setSelectedStudent(null);
    setStudentDetails(null);
  };

  const handleBackToStudents = () => {
    setSelectedStudent(null);
    setStudentDetails(null);
  };

  // Helper functions
  const calculateAverage = (data, key) => {
    if (!data || data.length === 0) return "N/A";
    const sum = data.reduce((total, item) => total + (item[key] || 0), 0);
    return (sum / data.length).toFixed(2);
  };

  // Render functions
  const renderCampuses = () => {
    if (loading.campuses) {
      return <div className="loading">Loading campuses...</div>;
    }

    if (!campuses || campuses.length === 0) {
      return <p className="no-data">No campuses available</p>;
    }

    return (
      <div className="campuses-grid">
        {campuses.map((campus) => (
          <div
            key={campus._id}
            className="campus-card"
            onClick={() => handleCampusSelect(campus)}
          >
            <h3>{campus.name}</h3>
            <div className="campus-stats">
              <div>
                <span>{campus.students?.length || 0}</span>
                <small>Students</small>
              </div>
              <div>
                <span>{campus.courses?.length || 0}</span>
                <small>Courses</small>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStudents = () => {
    if (loading.students) {
      return <div className="loading">Loading students...</div>;
    }

    if (!students || students.length === 0) {
      return <p className="no-data">No students found for this campus</p>;
    }

    return (
      <div className="students-list">
        <table className="students-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Roll Number</th>
              <th>Email</th>
              <th>City</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student._id}>
                <td>{student.name}</td>
                <td>{student.rollNumber}</td>
                <td>{student.email}</td>
                <td>{student.city}</td>
                <td>
                  <button
                    className="view-button"
                    onClick={() => handleStudentSelect(student)}
                  >
                    View Report
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderStudentReport = () => {
    if (loading.details) {
      return <div className="loading">Loading student details...</div>;
    }

    if (!studentDetails) {
      return <p className="no-data">No student details available</p>;
    }

    return (
      <div className="report-content">
        <div className="student-info">
          <h3>Personal Information</h3>
          <div className="info-grid">
            {[
              { label: "Name", value: studentDetails.name },
              { label: "Roll Number", value: studentDetails.rollNumber },
              { label: "Email", value: studentDetails.email },
              { label: "Phone", value: studentDetails.phone || "N/A" },
              { label: "City", value: studentDetails.city },
              { label: "Campus", value: selectedCampus.name },
            ].map((item, index) => (
              <div key={index}>
                <label>{item.label}:</label>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="academic-performance">
          <h3>Academic Performance</h3>

          <div className="marks-section">
            <h4>Course Marks</h4>
            {studentDetails.marks?.length > 0 ? (
              <table className="marks-table">
                <thead>
                  <tr>
                    {[
                      "Course",
                      "Midterm",
                      "Final",
                      "Assignments",
                      "Total",
                      "Grade",
                    ].map((header, index) => (
                      <th key={index}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studentDetails.marks.map((mark) => (
                    <tr key={mark.course._id}>
                      <td>{mark.course.name}</td>
                      <td>{mark.midterm}</td>
                      <td>{mark.final}</td>
                      <td>{mark.assignments}</td>
                      <td>{mark.total}</td>
                      <td>{mark.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No marks recorded</p>
            )}
          </div>

          <div className="attendance-section">
            <h4>Attendance Summary</h4>
            {studentDetails.attendance?.length > 0 ? (
              <table className="attendance-table">
                <thead>
                  <tr>
                    {["Course", "Present", "Absent", "Leave", "Percentage"].map(
                      (header, index) => (
                        <th key={index}>{header}</th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {studentDetails.attendance.map((record) => (
                    <tr key={record.course._id}>
                      <td>{record.course.name}</td>
                      <td>{record.present}</td>
                      <td>{record.absent}</td>
                      <td>{record.leave}</td>
                      <td>{record.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No attendance records</p>
            )}
          </div>

          <div className="performance-summary">
            <h4>Overall Performance</h4>
            <div className="summary-cards">
              {[
                {
                  title: "Average Marks",
                  value:
                    studentDetails.marks?.length > 0
                      ? calculateAverage(studentDetails.marks, "total")
                      : "N/A",
                },
                {
                  title: "Average Attendance",
                  value:
                    studentDetails.attendance?.length > 0
                      ? `${calculateAverage(
                          studentDetails.attendance,
                          "percentage"
                        )}%`
                      : "N/A",
                },
                {
                  title: "Courses Taken",
                  value: studentDetails.marks?.length || 0,
                },
              ].map((item, index) => (
                <div key={index} className="summary-card">
                  <span className="card-title">{item.title}</span>
                  <span className="card-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-actions">
            <button className="print-button" onClick={() => window.print()}>
              Print Report
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="reports-container">
      <h1>Student Reports</h1>
      <p className="subtitle">
        View comprehensive student information including marks and attendance
      </p>

      {error && <div className="error-message">{error}</div>}

      {!selectedCampus ? (
        <div className="campuses-section">
          <h2>Select a Campus</h2>
          {renderCampuses()}
        </div>
      ) : !selectedStudent ? (
        <div className="students-section">
          <div className="section-header">
            <button className="back-button" onClick={handleBackToCampuses}>
              &larr; Back to Campuses
            </button>
            <h2>Students at {selectedCampus.name}</h2>
          </div>
          {renderStudents()}
        </div>
      ) : (
        <div className="student-report-section">
          <div className="section-header">
            <button className="back-button" onClick={handleBackToStudents}>
              &larr; Back to Students
            </button>
            <h2>Student Report: {selectedStudent.name}</h2>
          </div>
          {renderStudentReport()}
        </div>
      )}
    </div>
  );
};

export default Reports;