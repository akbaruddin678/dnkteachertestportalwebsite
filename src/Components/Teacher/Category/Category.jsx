import React, { useState, useEffect } from "react";
import "./Category.css";


const Category = () => {
  // Mock logged-in teacher credentials
  const userRole = "teacher"; // "teacher" or "principal"
  const userName = "Mr. Thompson"; // Teacher's full name from data

  const [selectedCity] = useState("Islamabad"); // fixed city for teacher
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Filter Islamabad city and campus
  const islamabadCity = data.cities.find((city) => city.name === "Islamabad");
  const campusesInCity = islamabadCity
    ? islamabadCity.campuses.filter(campus => campus.name === "Islamabad Campus 1")
    : [];

  useEffect(() => {
    if (campusesInCity.length > 0) {
      setSelectedCampus(campusesInCity[0]);
    }
  }, [campusesInCity]);

  const handleSelectCampus = (campusName) => {
    const campus = campusesInCity.find((c) => c.name === campusName);
    setSelectedCampus(campus);
    setSelectedProgram(null);
    setSelectedSubject(null);
  };

  const handleSelectProgram = (programName) => {
    const program = selectedCampus?.programs.find((p) => p.name === programName);
    if (!program) return;

    // Filter subjects only for the logged-in teacher
    const filteredSubjects = userRole === "teacher"
      ? program.subjects.filter((s) => s.teacher.teacher === userName)
      : program.subjects;

    setSelectedProgram({ ...program, subjects: filteredSubjects });
    setSelectedSubject(null);
  };

  const handleSelectSubject = (subjectName) => {
    const subject = selectedProgram?.subjects.find((s) => s.name === subjectName);
    setSelectedSubject(subject);
  };

  return (
    <div className="category-container">
      <h2 className="title">Your Assigned Courses</h2>

      {/* Select City */}
      <div className="dropdown-section">
        <label>City:</label>
        <select value={selectedCity} disabled>
          <option value="Islamabad">Islamabad</option>
        </select>
      </div>

      {/* Select Campus */}
      {selectedCity && (
        <div className="panel">
          <h3 className="section-title">Campus</h3>
          <div className="button-grid">
            {campusesInCity.map((campus, idx) => (
              <button
                key={idx}
                className={`styled-btn ${selectedCampus?.name === campus.name ? "active-btn" : ""}`}
                onClick={() => handleSelectCampus(campus.name)}
              >
                {campus.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Select Program */}
      {selectedCampus && (
        <div className="panel">
          <h3 className="section-title">Programs Offered</h3>
          <div className="button-grid">
            {selectedCampus.programs.map((prog, idx) => (
              <button
                key={idx}
                className={`styled-btn ${selectedProgram?.name === prog.name ? "active-btn" : ""}`}
                onClick={() => handleSelectProgram(prog.name)}
              >
                {prog.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Select Subject */}
      {selectedProgram && selectedProgram.subjects.length > 0 ? (
        <div className="panel">
          <h3 className="section-title">Your Subjects in {selectedProgram.name}</h3>
          <div className="button-grid">
            {selectedProgram.subjects.map((subj, idx) => (
              <button
                key={idx}
                className={`styled-btn ${selectedSubject?.name === subj.name ? "active-btn" : ""}`}
                onClick={() => handleSelectSubject(subj.name)}
              >
                {subj.name}
              </button>
            ))}
          </div>
        </div>
      ) : selectedProgram ? (
        <p style={{ color: "red", paddingLeft: "1rem" }}>
          No subjects assigned to you in this program.
        </p>
      ) : null}

      {/* Show Students */}
      {selectedSubject && (
        <div className="panel">
          <h3 className="section-title">
            Subject: {selectedSubject.name} <br />
            Teacher: {selectedSubject.teacher.teacher}
          </h3>
          <table className="student-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Roll No</th>
                <th>Marks</th>
              </tr>
            </thead>
            <tbody>
              {selectedSubject.students.map((student, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{student.name}</td>
                  <td>{student.rollNo}</td>
                  <td>{student.marks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Category;
