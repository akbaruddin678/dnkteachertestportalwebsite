import React, { useState, useEffect } from "react";
import * as api from "../../../services/api";
import "./StudentImporter.css";

const StudentImporter = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Using the provided API endpoint
      const response = await fetch(
        "https://unruffled-mirzakhani.210-56-25-68.plesk.page/api/applicants/searchbywholedata"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setStudents(data.data);
        setTotalCount(data.data.length);

        // Check if we have 50 or more students
        if (data.data.length >= 50) {
          await saveStudentsToDatabase(data.data);
        } else {
          setError(
            `Only ${data.data.length} students found. Need at least 50 to save to database.`
          );
        }
      } else {
        throw new Error("Invalid data format from API");
      }
    } catch (err) {
      setError(`Failed to fetch students: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveStudentsToDatabase = async (studentData) => {
    try {
      // Transform the data to match your student schema
      const transformedStudents = studentData.map((item) => {
        const applicant = item.applicant;
        return {
          name: applicant.applicant_name,
          cnic: applicant.cnic,
          email: applicant.email,
          phone: applicant.contact,
          qualification: applicant.qualification,
          instituteName: applicant.institute_name,
          pnmcNo: applicant.pnmc_no,
          city: applicant.preferred_institute,
        };
      });

      // Save to your database using your API
      const result = await api.importStudents(transformedStudents);

      if (result.success) {
        setSuccess(
          `Successfully imported ${transformedStudents.length} students to the database!`
        );
      } else {
        throw new Error(
          result.message || "Failed to save students to database"
        );
      }
    } catch (err) {
      setError(`Failed to save students: ${err.message}`);
    }
  };

  return (
    <div className="student-importer-container">
      <div className="header">
        <h1>Student Data Importer</h1>
        <p>Fetch student data from external API and store in database</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="importer-controls">
        <button
          onClick={fetchStudents}
          disabled={loading}
          className="fetch-btn"
        >
          {loading ? "Fetching Data..." : "Fetch Student Data"}
        </button>

        {totalCount > 0 && (
          <div className="stats">
            <p>
              Total Students Found: <strong>{totalCount}</strong>
            </p>
            <p>
              Status:{" "}
              {totalCount >= 50
                ? "Eligible for import"
                : "Not enough data to import"}
            </p>
          </div>
        )}
      </div>

      {students.length > 0 && (
        <div className="students-table-container">
          <h2>Student Data Preview</h2>
          <div className="table-scroll">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>CNIC</th>
                  <th>Contact</th>
                  <th>Qualification</th>
                  <th>Test Score</th>
                </tr>
              </thead>
              <tbody>
                {students.slice(0, 10).map((student, index) => (
                  <tr key={index}>
                    <td>{student.applicant.applicant_name}</td>
                    <td>{student.applicant.cnic}</td>
                    <td>{student.applicant.contact}</td>
                    <td>{student.applicant.qualification}</td>
                    <td>{student.result ? student.result.testMark : "N/A"}</td>
                  </tr>
                ))}
                {students.length > 10 && (
                  <tr>
                    <td
                      colSpan="5"
                      style={{ textAlign: "center", fontWeight: "bold" }}
                    >
                      ... and {students.length - 10} more records
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentImporter;
