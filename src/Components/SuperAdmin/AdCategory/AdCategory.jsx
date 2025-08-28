import React, { useState, useEffect, useCallback, useMemo } from "react";
import * as api from "../../../services/api";
import "./AdCategory.css";

const TARGET_CITIES = [
  "Peshawar",
  "Lahore",
  "Karachi",
  "Hyderabad",
  "Swat",
  "Swabi",
  "Kohat",
  "Mardan",
  "Islamabad",
  "Abatabod",
];

/** ---------- Safe display helpers ---------- */
const getPersonName = (p) =>
  p?.name ||
  p?.fullName ||
  p?.username ||
  p?.user?.name ||
  p?.profile?.name ||
  "—";

const getEmail = (p) => p?.email || p?.user?.email || p?.contact?.email || "";

const getPhone = (p) =>
  p?.phone ||
  p?.contact ||
  p?.mobile ||
  p?.contactwhatsapp ||
  p?.user?.phone ||
  "";

/** ---------- Main ---------- */
const Category = () => {
  const [data, setData] = useState({
    campuses: [],
    coordinators: [],
    students: [],
    courses: [],
    teachers: [],
  });

  const [selectedCampus, setSelectedCampus] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal toggles
  const [showCoordinatorForm, setShowCoordinatorForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);

  // Modal lists
  const [availableCoordinators, setAvailableCoordinators] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);

  // Modal forms
  const [coordinatorForm, setCoordinatorForm] = useState({ coordinatorId: "" });
  const [courseForm, setCourseForm] = useState({ courseId: "" });
  const [teacherForm, setTeacherForm] = useState({ teacherId: "" });
  const [studentForm, setStudentForm] = useState({ studentIds: [] });

  const [city, setCity] = useState("");
  const [activeTab, setActiveTab] = useState("campus");

  /** Fetch everything */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        campusesRes,
        coordinatorsRes,
        studentsRes,
        coursesRes,
        teachersRes,
      ] = await Promise.all([
        api.getCampuses(),
        api.getCoordinators(),
        api.getStudents(),
        api.getCourses(),
        api.getTeachers(),
      ]);

      const nextData = {
        campuses: campusesRes.data || [],
        coordinators: coordinatorsRes.data || [],
        students: studentsRes.data || [],
        courses: coursesRes.data || [],
        teachers: teachersRes.data || [],
      };
      setData(nextData);
      setLoading(false);

      // Re-link selections to the freshly fetched objects (prevents stale UI)
      if (selectedCampus?._id) {
        const freshCampus = nextData.campuses.find(
          (c) => c._id === selectedCampus._id
        );
        setSelectedCampus(freshCampus || null);

        if (freshCampus && selectedCourse?._id) {
          const freshCourse =
            freshCampus.courses?.find((c) => c._id === selectedCourse._id) ||
            null;
          setSelectedCourse(freshCourse);
        } else {
          setSelectedCourse(null);
        }
      }
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
      setLoading(false);
    }
  }, [selectedCampus?._id, selectedCourse?._id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** When user opens a campus */
  const handleCampusSelect = async (campus) => {
    setSelectedCampus(campus);
    setSelectedCourse(null);
    setActiveTab("campus");
    setError(null);

    // Fetch students for this campus
    const campusStudents = await fetchCampusStudents(campus._id);
    setSelectedCampus((prev) => ({
      ...prev,
      students: campusStudents,
    }));
  };

  const fetchCampusStudents = async (campusId) => {
    try {
      const response = await api.getStudentsByCampus(campusId);
      return response.data || [];
    } catch (err) {
      console.error("Failed to fetch campus students:", err);
      return [];
    }
  };

  const handleCourseSelect = (course) => {
    console.log("Selected Course:", course); // Debugging line to verify course object
    setSelectedCourse(course);
    setActiveTab("course");
  };

  /** Filtered cities (only from your target list) */
  const allCities = useMemo(() => {
    const allStudentCities = (data.students || [])
      .map((s) => s.city)
      .filter(Boolean);
    const filteredCities = allStudentCities.filter((city) =>
      TARGET_CITIES.some(
        (target) => target.toLowerCase() === city.toLowerCase()
      )
    );
    const uniqueCities = [...new Set(filteredCities)];
    return uniqueCities.sort((a, b) => a.localeCompare(b));
  }, [data.students]);

  /** City filter (students modal) */
  const handleCityChange = async (e) => {
    const selectedCity = e.target.value;
    setCity(selectedCity);

    try {
      if (selectedCity && TARGET_CITIES.includes(selectedCity)) {
        const response = await api.getStudentsByCity(selectedCity);
        const list = response.data || [];
        setAvailableStudents(
          list.filter(
            (student) =>
              !selectedCampus?.students?.some((x) => x._id === student._id)
          )
        );
      } else {
        // Show all students from target cities when no specific city is selected
        const response = await api.getStudents();
        const allStudents = response.data || [];
        const filteredStudents = allStudents.filter(
          (student) =>
            student.city &&
            TARGET_CITIES.some(
              (target) => target.toLowerCase() === student.city.toLowerCase()
            )
        );
        setAvailableStudents(
          filteredStudents.filter(
            (student) =>
              !selectedCampus?.students?.some((x) => x._id === student._id)
          )
        );
      }
    } catch {
      setError("Failed to fetch students by city");
    }
  };

  /** ---------- Open modals (prepare fresh lists) ---------- */
  const openCoordinatorModal = () => {
    if (!selectedCampus) return;
    setCoordinatorForm({ coordinatorId: "" });
    setAvailableCoordinators(
      (data.coordinators || []).filter(
        (coordinator) =>
          !selectedCampus?.coordinators?.some(
            (assigned) => assigned._id === coordinator._id
          )
      )
    );
    setShowCoordinatorForm(true);
  };

  const openStudentModal = () => {
    if (!selectedCampus) return;
    setStudentForm({ studentIds: [] });
    setAvailableStudents(
      (data.students || []).filter(
        (student) =>
          !selectedCampus?.students?.some((x) => x._id === student._id)
      )
    );
    setCity("");
    setShowStudentForm(true);
  };

  const openCourseModal = () => {
    if (!selectedCampus) return;
    setCourseForm({ courseId: "" });
    setShowCourseForm(true);
  };

  const openTeacherModal = () => {
    if (!selectedCourse) return;
    setTeacherForm({ teacherId: "" });
    setAvailableTeachers(
      (data.teachers || []).filter(
        (teacher) =>
          !selectedCourse?.teachers?.some((x) => x._id === teacher._id)
      )
    );
    setShowTeacherForm(true);
  };

  /** ---------- Assign handlers ---------- */
  const handleAssignCoordinator = async () => {
    if (!coordinatorForm.coordinatorId || !selectedCampus?._id) {
      setError("Please select a coordinator");
      return;
    }
    try {
      await api.assignCoordinatorToCampus(
        coordinatorForm.coordinatorId,
        selectedCampus._id
      );
      await fetchData();
      setShowCoordinatorForm(false);
      setCoordinatorForm({ coordinatorId: "" });
      setError(null);
    } catch {
      setError("Failed to assign coordinator");
    }
  };

  const handleAssignTeacher = async () => {
    console.log("Selected Teacher ID:", teacherForm.teacherId);
    console.log("Selected Course:", selectedCourse); // Debugging line

    if (!teacherForm.teacherId || !selectedCourse) {
      setError("Please select a teacher and a course");
      return;
    }

    try {
      await api.assignTeachersToCourses(teacherForm.teacherId, [
        selectedCourse,
      ]);
      await fetchData();
      setShowTeacherForm(false);
      setTeacherForm({ teacherId: "" });
      setError(null);
    } catch (err) {
      setError("Failed to assign teacher");
      console.error("Teacher assignment error:", err);
    }
  };

  const handleAssignStudentsToCampus = async () => {
    if (!selectedCampus?._id || (studentForm.studentIds || []).length === 0) {
      setError("Please select at least one student");
      return;
    }
    try {
      await api.assignStudentsToCampus(
        studentForm.studentIds,
        selectedCampus._id
      );
      await fetchData();
      setShowStudentForm(false);
      setStudentForm({ studentIds: [] });
      setError(null);
    } catch {
      setError("Failed to assign students");
    }
  };

  const handleAssignCourse = async () => {
    if (!courseForm.courseId || !selectedCampus?._id) {
      setError("Please select a course");
      return;
    }
    try {
      await api.assignCoursesToCampus(
        [courseForm.courseId],
        selectedCampus._id
      );
      await fetchData();
      setShowCourseForm(false);
      setCourseForm({ courseId: "" });
      setError(null);
    } catch (err) {
      setError("Failed to assign course");
      console.error("Assignment error:", err?.response?.data || err?.message);
    }
  };

  /** ---------- Remove handlers (target specific IDs) ---------- */
  const handleRemoveCoordinator = async (coordinatorId) => {
    if (!coordinatorId || !selectedCampus?._id) return;
    try {
      await api.removeCoordinatorFromCampus(coordinatorId, selectedCampus._id);
      await fetchData();
      setError(null);
    } catch {
      setError("Failed to remove coordinator");
    }
  };

  const handleRemoveTeacher = async (teacherId) => {
    if (!teacherId || !selectedCourse?._id) return;
    try {
      await api.removeTeacherFromCourse(teacherId, selectedCourse._id);
      await fetchData();
      setError(null);
    } catch {
      setError("Failed to remove teacher");
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!studentId || !selectedCampus?._id) return;
    try {
      await api.removeStudentFromCampus(studentId, selectedCampus._id);
      await fetchData();
      setError(null);
    } catch {
      setError("Failed to remove student");
    }
  };

  const handleRemoveCourse = async (courseId) => {
    if (!courseId || !selectedCampus?._id) return;
    try {
      await api.removeCourseFromCampus(courseId, selectedCampus._id);
      await fetchData();
      setError(null);
    } catch {
      setError("Failed to remove course");
    }
  };

  /** ---------- View Components ---------- */
  const CampusDetail = () => (
    <div className="detail-container">
      <div className="detail-header">
        <h2>{selectedCampus?.name || "Campus"}</h2>
        <div className="detail-stats">
          <span>
            <strong>Coordinators:</strong>{" "}
            {selectedCampus?.coordinators?.length || 0}
          </span>
          <span>
            <strong>Students:</strong> {selectedCampus?.students?.length || 0}
          </span>
          <span>
            <strong>Courses:</strong> {selectedCampus?.courses?.length || 0}
          </span>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "campus" ? "active" : ""}`}
          onClick={() => setActiveTab("campus")}
        >
          Campus Details
        </button>
        <button
          className={`tab-btn ${activeTab === "course" ? "active" : ""}`}
          onClick={() => setActiveTab("course")}
        >
          Courses
        </button>
      </div>

      {activeTab === "campus" && (
        <div className="tab-content">
          <div className="action-buttons">
            <button
              className="action-btn assign"
              onClick={openCoordinatorModal}
            >
              Assign Coordinator
            </button>
            <button className="action-btn assign" onClick={openStudentModal}>
              Assign Students
            </button>
            <button className="action-btn assign" onClick={openCourseModal}>
              Assign Course
            </button>
          </div>

          {/* Assigned Coordinators */}
          <div className="detail-section">
            <h3>Assigned Coordinators</h3>
            {selectedCampus?.coordinators?.length > 0 ? (
              <ul className="assigned-list">
                {selectedCampus.coordinators.map((c) => {
                  const name = getPersonName(c);
                  const email = getEmail(c);
                  const phone = getPhone(c);
                  return (
                    <li
                      key={c._id}
                      className="assigned-item assigned-item--chip"
                    >
                      <div className="assigned-chip-main">
                        <div className="assigned-avatar">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="assigned-meta">
                          <div className="assigned-name">{name}</div>
                          <div className="assigned-sub">
                            {email && (
                              <span className="assigned-sub-item">{email}</span>
                            )}
                            {phone && (
                              <span className="assigned-sub-item">{phone}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        className="remove-btn"
                        title="Remove coordinator"
                        onClick={() => handleRemoveCoordinator(c._id)}
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>No coordinators assigned</p>
            )}
          </div>

          {/* Assigned Students */}
          <div className="detail-section">
            <h3>Assigned Students</h3>
            {selectedCampus?.students?.length > 0 ? (
              <div className="students-grid">
                {selectedCampus.students.map((student) => (
                  <div key={student._id} className="student-card">
                    <div className="student-header">
                      <h4>{getPersonName(student)}</h4>
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveStudent(student._id)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="student-details">
                      <div className="detail-row">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">
                          {student.email || "—"}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">
                          {student.phone || "—"}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">City:</span>
                        <span className="detail-value">
                          {student.city || "—"}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">CNIC:</span>
                        <span className="detail-value">
                          {student.cnic || "—"}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">PNC No:</span>
                        <span className="detail-value">
                          {student.pncNo || "—"}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Passport:</span>
                        <span className="detail-value">
                          {student.passport || "—"}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Document Status:</span>
                        <span
                          className={`status-badge ${
                            student.documentstatus || "notverified"
                          }`}
                        >
                          {student.documentstatus || "Not Verified"}
                        </span>
                      </div>
                      {student.qualifications && (
                        <div className="detail-row">
                          <span className="detail-label">Qualifications:</span>
                          <span className="detail-value">
                            {student.qualifications}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No students assigned</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "course" && (
        <div className="tab-content">
          <div className="courses-list">
            {selectedCampus?.courses?.length > 0 ? (
              selectedCampus.courses.map((course) => (
                <div
                  key={course._id}
                  className={`course-card ${
                    selectedCourse?._id === course._id ? "selected" : ""
                  }`}
                  onClick={() => handleCourseSelect(course)}
                >
                  <h4>{course.name}</h4>
                  <p>
                    <strong>Teachers:</strong> {course.teachers?.length || 0}
                  </p>

                  {selectedCourse?._id === course._id && (
                    <div className="course-details">
                      <div className="action-buttons">
                        <button
                          className="action-btn assign"
                          onClick={openTeacherModal}
                        >
                          Assign Teacher
                        </button>
                        <button
                          className="action-btn remove"
                          onClick={() => handleRemoveCourse(course._id)}
                        >
                          Remove Course
                        </button>
                      </div>

                      <h5>Assigned Teachers</h5>
                      {course.teachers?.length > 0 ? (
                        <ul className="assigned-list">
                          {course.teachers.map((teacher) => (
                            <li key={teacher._id} className="assigned-item">
                              <span>{getPersonName(teacher)}</span>
                              <button
                                className="remove-btn"
                                onClick={() => handleRemoveTeacher(teacher._id)}
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No teachers assigned</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>No courses assigned to this campus</p>
            )}
          </div>
        </div>
      )}

      {/* ---------- Modals ---------- */}
      {showCoordinatorForm && (
        <div className="modal">
          <div className="modal-content">
            <button
              className="close-btn"
              onClick={() => setShowCoordinatorForm(false)}
            >
              &times;
            </button>
            <h3>Assign Coordinator</h3>
            <div className="form-group">
              <label>Select Coordinator</label>
              <select
                value={coordinatorForm.coordinatorId}
                onChange={(e) =>
                  setCoordinatorForm({ coordinatorId: e.target.value })
                }
              >
                <option value="">-- Select Coordinator --</option>
                {availableCoordinators.map((coordinator) => (
                  <option key={coordinator._id} value={coordinator._id}>
                    {getPersonName(coordinator)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowCoordinatorForm(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={handleAssignCoordinator}
                disabled={!coordinatorForm.coordinatorId}
              >
                Assign
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      )}

      {showCourseForm && (
        <div className="modal" onClick={() => setShowCourseForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Assign Course</h3>
            <div className="form-group">
              <label>Select Course</label>
              <select
                value={courseForm.courseId}
                onChange={(e) => setCourseForm({ courseId: e.target.value })}
              >
                <option value="">-- Select Course --</option>
                {(data.courses || [])
                  .filter(
                    (course) =>
                      !selectedCampus?.courses?.some(
                        (c) => c._id === course._id
                      )
                  )
                  .map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowCourseForm(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={handleAssignCourse}
                disabled={!courseForm.courseId}
              >
                Assign
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      )}

      {showTeacherForm && selectedCourse && (
        <div className="modal" onClick={() => setShowTeacherForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Assign Teacher to {selectedCourse.name}</h3>
            <div className="form-group">
              <label>Select Teacher</label>
              <select
                value={teacherForm.teacherId}
                onChange={(e) => setTeacherForm({ teacherId: e.target.value })}
              >
                <option value="">-- Select Teacher --</option>
                {availableTeachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {getPersonName(teacher)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowTeacherForm(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={handleAssignTeacher}
                disabled={!teacherForm.teacherId}
              >
                Assign
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      )}

      {showStudentForm && (
        <div className="modal" onClick={() => setShowStudentForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Assign Students</h3>

            <div className="form-group">
              <label>Filter by City</label>
              <select value={city} onChange={handleCityChange}>
                <option value="">-- All Cities --</option>
                {TARGET_CITIES.map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {cityName}
                  </option>
                ))}
              </select>
            </div>

            {(availableStudents || []).length > 0 ? (
              <div className="students-list">
                <div className="select-all">
                  <input
                    type="checkbox"
                    checked={
                      studentForm.studentIds.length ===
                        availableStudents.length && availableStudents.length > 0
                    }
                    onChange={() => {
                      if (
                        studentForm.studentIds.length ===
                        availableStudents.length
                      ) {
                        setStudentForm({ studentIds: [] });
                      } else {
                        setStudentForm({
                          studentIds: availableStudents.map((s) => s._id),
                        });
                      }
                    }}
                  />
                  <span>Select All</span>
                </div>
                {availableStudents.map((student) => (
                  <div key={student._id} className="student-item-modal">
                    <input
                      type="checkbox"
                      checked={studentForm.studentIds.includes(student._id)}
                      onChange={() =>
                        setStudentForm((prev) => ({
                          studentIds: prev.studentIds.includes(student._id)
                            ? prev.studentIds.filter((id) => id !== student._id)
                            : [...prev.studentIds, student._id],
                        }))
                      }
                    />
                    <div className="student-info-modal">
                      <div className="student-name-modal">
                        {getPersonName(student)}
                      </div>
                      <div className="student-details-modal">
                        <span>{student.email}</span>
                        {student.phone && <span> • {student.phone}</span>}
                        {student.city && <span> • {student.city}</span>}
                        {student.cnic && <span> • CNIC: {student.cnic}</span>}
                        {student.pncNo && <span> • PNC: {student.pncNo}</span>}
                      </div>
                      <div className="student-status-modal">
                        <span
                          className={`status-badge ${
                            student.documentstatus || "notverified"
                          }`}
                        >
                          {student.documentstatus || "Not Verified"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No students available</p>
            )}

            <div className="form-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowStudentForm(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={handleAssignStudentsToCampus}
                disabled={(studentForm.studentIds || []).length === 0}
              >
                Assign Selected Students
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      )}

      <button className="back-btn" onClick={() => setSelectedCampus(null)}>
        Back to All Campuses
      </button>
    </div>
  );

  return (
    <div className="category-container">
      <div className="header">
        <h1>Campus Management</h1>
        <p>Manage campuses, coordinators, students, courses, and teachers</p>
      </div>

      {error &&
        !showCoordinatorForm &&
        !showCourseForm &&
        !showTeacherForm &&
        !showStudentForm && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading data...</div>
      ) : !selectedCampus ? (
        <div className="campuses-grid">
          {data.campuses.map((campus) => (
            <div
              key={campus._id}
              className="campus-card"
              onClick={() => handleCampusSelect(campus)}
            >
              <h3>{campus.name}</h3>
              <div className="campus-stats">
                <div>
                  <span>{campus.coordinators?.length || 0}</span>
                  <small>Coordinators</small>
                </div>
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
      ) : (
        <CampusDetail />
      )}
    </div>
  );
};

export default Category;
