import React, { useState, useEffect } from 'react';

import coursesData from './Courses.json';  // Adjust the path if necessary

const CoursesOffered = () => {
  const [cities, setCities] = useState([]); // Stores the list of cities and campus data
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    city: '',
    campus: '',
    program: '',
    name: '',
    description: '',
    teacher: '',
    students: '',
    schedule: '',
  });

  useEffect(() => {
    // Ensure categoryData is an array and has data
    if (Array.isArray(coursesData) && coursesData.length > 0) {
      setCities(coursesData);  // Load the city data
      setSelectedCity(coursesData[0]?.name || '');
      setSelectedCampus(coursesData[0]?.campuses[0]?.name || '');
      setSelectedProgram(coursesData[0]?.campuses[0]?.programs[0]?.name || '');
    } else {
      console.error('Invalid courses data format', coursesData);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewCourse((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCourse = (e) => {
    e.preventDefault();

    if (Array.isArray(cities)) {
      const updatedCities = cities.map((city) => {
        if (city.name === newCourse.city) {
          return {
            ...city,
            campuses: city.campuses.map((campus) => {
              if (campus.name === newCourse.campus) {
                return {
                  ...campus,
                  programs: campus.programs.map((program) => {
                    if (program.name === newCourse.program) {
                      return {
                        ...program,
                        courses: [
                          ...program.courses,
                          {
                            name: newCourse.name,
                            description: newCourse.description,
                            teacher: newCourse.teacher,
                            students: parseInt(newCourse.students),
                            schedule: newCourse.schedule,
                          },
                        ],
                      };
                    }
                    return program;
                  }),
                };
              }
              return campus;
            }),
          };
        }
        return city;
      });

      setCities(updatedCities);
      setNewCourse({
        city: '',
        campus: '',
        program: '',
        name: '',
        description: '',
        teacher: '',
        students: '',
        schedule: '',
      });
      setShowModal(false);
    } else {
      console.error("cities is not an array:", cities);
    }
  };

  // Find selected city, campus, and program
  const selectedCityData = cities.find((city) => city.name === selectedCity);
  const selectedCampusData = selectedCityData?.campuses.find(
    (campus) => campus.name === selectedCampus
  );
  const selectedProgramData = selectedCampusData?.programs.find(
    (program) => program.name === selectedProgram
  );

  // Debugging: Log the current selected city, campus, and program data
  console.log('Selected City Data:', selectedCityData);
  console.log('Selected Campus Data:', selectedCampusData);
  console.log('Selected Program Data:', selectedProgramData);

  if (!selectedCityData || !selectedCampusData || !selectedProgramData) {
    return <div>Loading...</div>;  // Ensure loading state while data is being fetched
  }

  return (
    <>
    <style>{`.courses-container {
  padding: 2rem;
  font-family: "Segoe UI", sans-serif;
  background-color: #f9f9f9;
  min-height: 100vh;
}

.courses-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.courses-header h2 {
  font-size: 2rem;
  font-weight: 700;
}

.add-course-button {
  background-color: #2e7dff;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
}

.sub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem 0;
}

.manage-link {
  color: #2e7dff;
  font-size: 0.9rem;
  text-decoration: underline;
}

.search-bar {
  background: #f1f1f1;
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  width: 250px;
}

.search-icon {
  margin-right: 0.5rem;
  font-size: 1.2rem;
  color: #888;
}

.search-bar input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
}

.courses-table table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
}

.courses-table th,
.courses-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.courses-table th {
  background-color: #f4f6f8;
  font-weight: 600;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.modal h3 {
  margin-bottom: 1rem;
}

.modal form input,
.modal form textarea {
  width: 100%;
  padding: 0.7rem;
  margin-bottom: 0.8rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.modal textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.modal-actions button:first-child {
  background-color: #2e7dff;
  color: white;
}

.modal-actions button:last-child {
  background-color: #ddd;
}
`}</style>
    <div className="courses-container">
      <div className="courses-header">
        <h2>Program Course Overview</h2>
        <button className="add-course-button" onClick={() => setShowModal(true)}>
          + Add New
        </button>
      </div>

      <div className="sub-header">
        <a href="#" className="manage-link">
          Manage course offering
        </a>
        {/* City Selection */}
        <select onChange={(e) => setSelectedCity(e.target.value)} value={selectedCity}>
          {cities.map((city, idx) => (
            <option key={idx} value={city.name}>
              {city.name}
            </option>
          ))}
        </select>
        {/* Campus Selection */}
        <select onChange={(e) => setSelectedCampus(e.target.value)} value={selectedCampus}>
          {selectedCityData?.campuses.map((campus, idx) => (
            <option key={idx} value={campus.name}>
              {campus.name}
            </option>
          ))}
        </select>
        {/* Program Selection */}
        <select onChange={(e) => setSelectedProgram(e.target.value)} value={selectedProgram}>
          {selectedCampusData?.programs.map((program, idx) => (
            <option key={idx} value={program.name}>
              {program.name}
            </option>
          ))}
        </select>
      </div>

      <div className="courses-table">
        <table>
          <thead>
            <tr>
              <th>Course Name</th>
              <th>Description</th>
              <th>Assigned Teacher</th>
              <th>Enrolled Students</th>
              <th>Schedule</th>
            </tr>
          </thead>
          <tbody>
            {selectedProgramData?.courses.map((course, idx) => (
              <tr key={idx}>
                <td>{course.name}</td>
                <td>{course.description}</td>
                <td>{course.teacher}</td>
                <td>{course.students}</td>
                <td>{course.schedule}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Adding New Course */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add New Course</h3>
            <form onSubmit={handleAddCourse}>
              <select name="city" value={newCourse.city} onChange={handleChange} required>
                {cities.map((city, idx) => (
                  <option key={idx} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
              <select name="campus" value={newCourse.campus} onChange={handleChange} required>
                {selectedCityData?.campuses.map((campus, idx) => (
                  <option key={idx} value={campus.name}>
                    {campus.name}
                  </option>
                ))}
              </select>
              <select name="program" value={newCourse.program} onChange={handleChange} required>
                {selectedCampusData?.programs.map((program, idx) => (
                  <option key={idx} value={program.name}>
                    {program.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="name"
                placeholder="Course Name"
                value={newCourse.name}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="teacher"
                placeholder="Assigned Teacher"
                value={newCourse.teacher}
                onChange={handleChange}
              />
              <input
                type="number"
                name="students"
                placeholder="Enrolled Students"
                value={newCourse.students}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="schedule"
                placeholder="Schedule (e.g. Mon, Wed, 9AM–11AM)"
                value={newCourse.schedule}
                onChange={handleChange}
                required
              />
              <textarea
                name="description"
                placeholder="Course Description"
                value={newCourse.description}
                onChange={handleChange}
                required
              />
              <div className="modal-actions">
                <button type="submit">Add</button>
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
</>

  );
};

export default CoursesOffered;
