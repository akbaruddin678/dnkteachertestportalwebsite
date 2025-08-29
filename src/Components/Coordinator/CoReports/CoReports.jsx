// Reports.jsx
"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("attendance");
  const [filters, setFilters] = useState({
    course: "",
    teacher: "",
    dateRange: "",
    city: "Islamabad",
    institute: "Islamabad Campus 1",
  });

  const [attendanceData, setAttendanceData] = useState([]);
  const [lectureData, setLectureData] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudentStatus, setSelectedStudentStatus] = useState(null);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = () => {
    const sampleAttendance = [
      {
        id: 1,
        studentName: "Ethan Harper",
        course: "Introduction to Programming",
        date: "2024-03-15",
        status: "Present",
        teacher: "Dr. Eleanor Harper",
        city: "Islamabad",
        institute: "Islamabad Campus 1",
      },
      {
        id: 2,
        studentName: "Ava Mitchell",
        course: "Database Management Systems",
        date: "2024-03-15",
        status: "Present",
        teacher: "Prof. Samuel Bennett",
        city: "Islamabad",
        institute: "Islamabad Campus 1",
      },
    ];

    const sampleLectures = [
      {
        id: 1,
        teacherName: "Dr. Eleanor Harper",
        course: "Introduction to Programming",
        topic: "Intro to JS",
        date: "2024-03-15",
        duration: "2 hours",
        studentsPresent: 25,
        totalStudents: 30,
        city: "Islamabad",
        institute: "Islamabad Campus 1",
      },
      {
        id: 2,
        teacherName: "Prof. Samuel Bennett",
        course: "Database Management Systems",
        topic: "SQL Basics",
        date: "2024-03-15",
        duration: "1.5 hours",
        studentsPresent: 22,
        totalStudents: 30,
        city: "Islamabad",
        institute: "Islamabad Campus 1",
      },
    ];

    setAttendanceData(sampleAttendance);
    setLectureData(sampleLectures);
  };

  const handleFilterChange = (field, value) => {
    if (field === "city" || field === "institute") return;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClassClick = (courseName) => {
    const classAttendance = attendanceData.filter(
      (record) => record.course === courseName
    );
    setSelectedClass(classAttendance);
    setSelectedStudentStatus(null);
  };

  const handleStudentStatusClick = (status) => {
    const filtered = selectedClass.filter(
      (record) => record.status === status
    );
    setSelectedStudentStatus(filtered);
  };

  const filteredLectureData = lectureData.filter((record) => {
    if (
      filters.course &&
      !record.course.toLowerCase().includes(filters.course.toLowerCase())
    ) return false;
    if (
      filters.teacher &&
      !record.teacherName.toLowerCase().includes(filters.teacher.toLowerCase())
    ) return false;
    return true;
  });

  const handleDownloadPDF = () => {
    const reportElement = document.querySelector(".reports-content");
    html2canvas(reportElement, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 10, pageWidth, imgHeight);
      pdf.save("report.pdf");
    });
  };

  return (
    <>
    <style>{`/* Reports.css */
.reports {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 2rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.page-header h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.page-header p {
  color: #7f8c8d;
  margin-bottom: 2rem;
}

.reports-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.tab-btn {
  padding: 0.6rem 1.2rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #f4f6f8;
  font-weight: 600;
  color: #2c3e50;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn.active {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

.tab-btn:hover {
  background-color: #dfe6e9;
}

.download-btn {
  background-color: #e67e22;
  color: white;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  cursor: pointer;
  transition: background 0.3s;
}

.download-btn:hover {
  background-color: #ca6f1e;
}

.filters-section {
  margin-bottom: 2rem;
}

.filters-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-group {
  flex: 1 1 200px;
  display: flex;
  flex-direction: column;
}

.filter-group select,
.filter-group input {
  padding: 0.7rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 1rem;
  background: #fff;
  color: #2c3e50;
}

.reports-content h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.reports-content table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 2rem;
  background: #fff;
  border: 1px solid #ddd;
}

.reports-content th,
.reports-content td {
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  text-align: left;
  font-size: 0.95rem;
}

.reports-content th {
  background-color: #f5f7fa;
  font-weight: bold;
  color: #2c3e50;
}

.reports-content tr:hover {
  background-color: #f9fbfc;
  cursor: pointer;
}

.class-details {
  background: #fdfdfd;
  padding: 1.5rem;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  margin-top: 2rem;
}

.class-details h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.class-details button {
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  margin-right: 0.5rem;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease;
}

.class-details button:hover {
  background-color: #27ae60;
}

.present {
  color: green;
  font-weight: bold;
}

.absent {
  color: red;
  font-weight: bold;
}

@media screen and (max-width: 768px) {
  .filters-grid {
    flex-direction: column;
  }

  .reports-tabs {
    flex-direction: column;
  }

  .tab-btn {
    width: 100%;
  }

  .download-btn {
    width: 100%;
  }
}
`}</style>
    <div className="reports">
      <div className="page-header">
        <h1>Reports</h1>
        <p>View reports for <strong>Islamabad Campus 1</strong></p>
      </div>

      <div className="reports-tabs">
        <button className={`tab-btn ${activeTab === "attendance" ? "active" : ""}`} onClick={() => setActiveTab("attendance")}>Attendance</button>
        <button className={`tab-btn ${activeTab === "lecture" ? "active" : ""}`} onClick={() => setActiveTab("lecture")}>Lecture Activity</button>
      </div>

      <button className="download-btn" onClick={handleDownloadPDF}>Download PDF</button>

      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <select value={filters.course} onChange={(e) => handleFilterChange("course", e.target.value)}>
              <option value="">Select Course</option>
              <option value="Introduction to Programming">Introduction to Programming</option>
              <option value="Database Management Systems">Database Management Systems</option>
            </select>
          </div>

          {activeTab === "lecture" && (
            <div className="filter-group">
              <select value={filters.teacher} onChange={(e) => handleFilterChange("teacher", e.target.value)}>
                <option value="">Select Teacher</option>
                <option value="Dr. Eleanor Harper">Dr. Eleanor Harper</option>
                <option value="Prof. Samuel Bennett">Prof. Samuel Bennett</option>
              </select>
            </div>
          )}

          <div className="filter-group">
            <input type="text" value="Islamabad" readOnly />
          </div>

          <div className="filter-group">
            <input type="text" value="Islamabad Campus 1" readOnly />
          </div>

          <div className="filter-group">
            <input type="date" value={filters.dateRange} onChange={(e) => handleFilterChange("dateRange", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="reports-content">
        {activeTab === "attendance" && (
          <div className="attendance-report">
            <h2>Attendance Report</h2>
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Teacher</th>
                  <th>Date</th>
                  <th>City</th>
                  <th>Institute</th>
                  <th>Present</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {filteredLectureData.map((record) => {
                  const percent = (record.studentsPresent / record.totalStudents) * 100;
                  return (
                    <tr key={record.id} onClick={() => handleClassClick(record.course)}>
                      <td>{record.course}</td>
                      <td>{record.teacherName}</td>
                      <td>{record.date}</td>
                      <td>{record.city}</td>
                      <td>{record.institute}</td>
                      <td>{record.studentsPresent}</td>
                      <td>{percent.toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {selectedClass && (
              <div className="class-details">
                <h3>Class Attendance: {selectedClass[0]?.course}</h3>
                <button onClick={() => handleStudentStatusClick("Present")}>Present</button>
                <button onClick={() => handleStudentStatusClick("Absent")}>Absent</button>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Course</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedStudentStatus || selectedClass).map((record) => (
                      <tr key={record.id}>
                        <td>{record.studentName}</td>
                        <td>{record.course}</td>
                        <td>{record.date}</td>
                        <td className={record.status.toLowerCase()}>{record.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "lecture" && (
          <div className="lecture-report">
            <h2>Lecture Activity Report</h2>
            <table>
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Course</th>
                  <th>Topic</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>City</th>
                  <th>Institute</th>
                  <th>Students</th>
                </tr>
              </thead>
              <tbody>
                {filteredLectureData.map((record) => (
                  <tr key={record.id}>
                    <td>{record.teacherName}</td>
                    <td>{record.course}</td>
                    <td>{record.topic}</td>
                    <td>{record.date}</td>
                    <td>{record.duration}</td>
                    <td>{record.city}</td>
                    <td>{record.institute}</td>
                    <td>{record.studentsPresent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
</>

  );
};

export default Reports;
