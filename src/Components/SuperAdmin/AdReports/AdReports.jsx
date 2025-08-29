"use client";

import { useState, useEffect } from "react";
import api from "../../../services/api"; // Assuming your API file is in lib folder


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
    <>
    <style>{`/* Base Styles */
.reports-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.reports-container h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

/* Error Message */
.error-message {
  background-color: #ffecec;
  color: #e74c3c;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
  border-left: 4px solid #e74c3c;
}

/* Loading State */
.loading {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
  color: #7f8c8d;
}

/* Section Headers */
.section-header {
  display: flex;
  align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #ecf0f1;
}

.section-header h2 {
  margin: 0;
  flex-grow: 1;
}

/* Back Button */
.back-button {
  background: none;
  border: none;
  color: #3498db;
  font-size: 1rem;
  cursor: pointer;
  margin-right: 1rem;
    padding: 0.5rem 0;
}

.back-button:hover {
  text-decoration: underline;
}

/* Campuses Section */
.campuses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.campus-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.campus-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.campus-card h3 {
  margin-top: 0;
  color: #2c3e50;
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
}

.campus-stats {
  display: flex;
  justify-content: space-between;
  text-align: center;
  }
  
  .campus-stats div {
    flex: 1;
  }
  
  .campus-stats span {
    display: block;
    font-size: 1.5rem;
    font-weight: bold;
    color: #3498db;
  }
  
  .campus-stats small {
    color: #7f8c8d;
    font-size: 0.9rem;
  }
  
  /* Students Section */
  .students-list {
    margin-top: 1rem;
  }
  
  .students-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }
  
  .students-table th,
  .students-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #ecf0f1;
  }
  
  .students-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #2c3e50;
  }
  
  .students-table tr:hover {
    background-color: #f8f9fa;
  }
  
  .view-button {
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .view-button:hover {
    background-color: #2980b9;
  }
  
  .no-data {
    text-align: center;
    padding: 2rem;
    color: #7f8c8d;
    font-style: italic;
}

/* Student Report Section */
.report-content {
  margin-top: 1.5rem;
}

.student-info {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.student-info h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #2c3e50;
  border-bottom: 1px solid #ecf0f1;
  padding-bottom: 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-grid div {
  display: flex;
  flex-direction: column;
}

.info-grid label {
  font-weight: 600;
  color: #7f8c8d;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.info-grid span {
  font-size: 1rem;
  color: #2c3e50;
}

/* Academic Performance */
.academic-performance {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.academic-performance h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #2c3e50;
  border-bottom: 1px solid #ecf0f1;
  padding-bottom: 0.5rem;
}

.marks-section,
.attendance-section {
  margin-bottom: 2rem;
}

.marks-section h4,
.attendance-section h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.marks-table,
.attendance-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.marks-table th,
.marks-table td,
.attendance-table th,
.attendance-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ecf0f1;
}

.marks-table th,
.attendance-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

.marks-table tr:hover,
.attendance-table tr:hover {
  background-color: #f8f9fa;
}

/* Performance Summary */
.performance-summary {
  margin-top: 2rem;
}

.performance-summary h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.summary-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}

.card-title {
  display: block;
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 0.5rem;
}

.card-value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
}

/* Report Actions */
.report-actions {
  text-align: right;
  margin-top: 2rem;
}

.print-button {
  background-color: #3498db;
  color: white;
  border: none;
    border-radius: 4px;
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
  }
  
  .print-button:hover {
    background-color: #2980b9;
  }
  
  /* Print Styles */
  @media print {
  
    .back-button,
    .print-button {
      display: none;
    }
  
    .reports-container {
      padding: 0;
    

                .student-report-section {
                  break-inside: avoid;
        
                }

                .academic-performance {
                  break-inside: avoid;
                }
                }`}</style>
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
    </>
  );
};

export default Reports;