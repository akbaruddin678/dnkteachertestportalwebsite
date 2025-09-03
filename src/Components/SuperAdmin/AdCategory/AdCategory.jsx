import React, { useState, useEffect, useCallback, useMemo } from "react";
import * as api from "../../../services/api";

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
  const [studentsLoading, setStudentsLoading] = useState(false);

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

      // Fetch students for each campus
      const campusesWithStudents = await Promise.all(
        (campusesRes.data || []).map(async (campus) => {
          try {
            const studentsRes = await api.getStudentsByCampus(campus._id);
            return {
              ...campus,
              students: studentsRes.data || [],
            };
          } catch (err) {
            console.error(
              `Failed to fetch students for campus ${campus._id}:`,
              err
            );
            return {
              ...campus,
              students: [],
            };
          }
        })
      );

      const nextData = {
        campuses: campusesWithStudents,
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
  const handleCampusSelect = (campus) => {
    setSelectedCampus(campus);
    setSelectedCourse(null);
    setActiveTab("campus");
    setError(null);
  };

  const handleCourseSelect = (course) => {
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
    setError(null);

    try {
      // get ALL students (unpaginated endpoint) and filter client-side
      const response = await api.getStudents();
      const allStudents = response.data || [];

      // if city selected, filter by city; else keep target cities only
      const base = selectedCity
        ? allStudents.filter(
            (s) => s.city && s.city.toLowerCase() === selectedCity.toLowerCase()
          )
        : allStudents.filter(
            (s) =>
              s.city &&
              TARGET_CITIES.some(
                (target) => target.toLowerCase() === s.city.toLowerCase()
              )
          );

      // remove already-assigned
      const filtered = base.filter(
        (s) => !selectedCampus?.students?.some((x) => x._id === s._id)
      );

      setAvailableStudents(filtered);
    } catch (err) {
      setError("Failed to fetch students.");
      console.error("City filter error:", err);
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

  const openStudentModal = async () => {
    if (!selectedCampus) return;

    setStudentForm({ studentIds: [] });
    setCity("");
    setShowStudentForm(true);

    try {
      const response = await api.getStudents(); // unpaginated endpoint
      const allStudents = response.data || [];

      const filtered = allStudents
        .filter(
          (s) =>
            s.city &&
            TARGET_CITIES.some(
              (target) => target.toLowerCase() === s.city.toLowerCase()
            )
        )
        .filter((s) => !selectedCampus.students?.some((x) => x._id === s._id));

      setAvailableStudents(filtered);
    } catch (err) {
      setError("Failed to load available students");
      console.error("Open student modal error:", err);
    }
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

    setStudentsLoading(true);
    try {
      await api.assignStudentsToCampus(
        studentForm.studentIds,
        selectedCampus._id
      );
      await fetchData();
      setShowStudentForm(false);
      setStudentForm({ studentIds: [] });
      setError(null);
    } catch (err) {
      setError("Failed to assign students");
      console.error("Assign students error:", err);
    } finally {
      setStudentsLoading(false);
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
        <div
          className="modal"
          onClick={() => !studentsLoading && setShowStudentForm(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Assign Students</h3>

            <div className="form-group">
              <label>Filter by City</label>
              <select
                value={city}
                onChange={handleCityChange}
                disabled={studentsLoading}
              >
                <option value="">-- All Cities --</option>
                {TARGET_CITIES.map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {cityName}
                  </option>
                ))}
              </select>
            </div>

            {studentsLoading ? (
              <div className="loading">Loading students...</div>
            ) : availableStudents.length > 0 ? (
              <div className="students-list">
                <div className="select-all">
                  <input
                    type="checkbox"
                    checked={
                      availableStudents.length > 0 &&
                      studentForm.studentIds.length === availableStudents.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setStudentForm({
                          studentIds: availableStudents.map((s) => s._id),
                        });
                      } else {
                        setStudentForm({ studentIds: [] });
                      }
                    }}
                    disabled={studentsLoading}
                  />
                  <span>
                    Select All ({studentForm.studentIds.length}/
                    {availableStudents.length} selected)
                  </span>
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
                      disabled={studentsLoading}
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
              <p>No students available in {city || "these cities"}</p>
            )}

            <div className="form-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowStudentForm(false)}
                disabled={studentsLoading}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={handleAssignStudentsToCampus}
                disabled={
                  studentForm.studentIds.length === 0 || studentsLoading
                }
              >
                {studentsLoading ? "Assigning..." : "Assign Selected Students"}
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
    <>
      <style>{`/* ---------- Modal overlay centered ---------- */
.modal {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.5);
  /* slate-900/50 */
  display: flex;
  align-items: center;
  /* vertical center */
  justify-content: center;
  /* horizontal center */
  z-index: 99999 !important;
      margin: 0 auto;
}

.modal-content {
  background: #fff;          /* white background */
  padding: 20px;
  border-radius: 10px;
  max-width: 500px;          /* modal width */
  width: 90%;                /* responsive */
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Actions row incl. Back button */
.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.back-btn-modal {
  background: #f1f5f9;
  /* slate-100 */
  color: #374151;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}
.back-btn-modal:hover {
  background: #e2e8f0;
}

.confirm-btn {
  background: #2563eb;
  /* blue-600 */
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}
.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.cancel-btn,
.remove-btn {
  background: #fee2e2;
  /* red-100 */
  color: #b91c1c;
  /* red-700 */
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}
.cancel-btn:hover,
.remove-btn:hover {
  background: #fecaca;
}

/* Modal internals */
.form-group {
  margin: 0.75rem 0 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
/* Students checklist area */
.students-list {
  margin-top: 0.75rem;
  max-height: 320px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
}
.select-all {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed #e5e7eb;
  margin-bottom: 0.5rem;
}
.student-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0;
}

/* Chips for assigned coordinators */
.assigned-item--chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.assigned-chip-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.assigned-avatar {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 700;
  background: #eef6ff;
  color: #2563eb;
}
.assigned-meta {
  display: flex;
  flex-direction: column;
}
.assigned-name {
  font-weight: 600;
  color: #1f2937;
}
.assigned-sub {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.85rem;
  color: #6b7280;
}

.assigned-sub-item {
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 999px;
}
/* Misc (existing classes referenced in JSX; tweak as you prefer) */
.category-container {
  padding: 1rem;
}

.header h1 {
  margin-bottom: 0.25rem;
}

.campuses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}
.campus-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}
.campus-card:hover {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.campus-stats {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.campus-stats div {
  text-align: center;
}

.campus-stats small {
  display: block;
  color: #6b7280;
}

.detail-container {
  margin-top: 1rem;
}

.detail-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.detail-stats {
  display: flex;
  gap: 1rem;
  color: #374151;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.tab-btn {
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 0.5rem 0.8rem;
  border-radius: 10px;
  cursor: pointer;
}

.tab-btn.active {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.tab-content {
  margin-top: 1rem;
}
.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.action-btn.assign {
  background: #e0f2fe;
  color: #075985;
  border: none;
  padding: 0.45rem 0.75rem;
  border-radius: 10px;
  cursor: pointer;
}

.action-btn.remove {
  background: #fee2e2;
  color: #991b1b;
  border: none;
  padding: 0.45rem 0.75rem;
  border-radius: 10px;
  cursor: pointer;
}
.detail-section {
  margin-top: 1rem;
}

.assigned-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
  display: grid;
  gap: 0.5rem;
}

.assigned-item {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.6rem 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.course-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.75rem 0.9rem;
  background: #fff;
  cursor: pointer;
}

.course-card.selected {
  outline: 2px solid #93c5fd;
}

.course-details {
  margin-top: 0.5rem;
}

.loading {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
}

.error-message {
  margin-top: 0.75rem;
  color: #b91c1c;
}

.back-btn {
  margin-top: 1rem;
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 0.5rem 0.8rem;
  border-radius: 10px;
  cursor: pointer;
}

/*  */

/* Close (X) button */
.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s;
}
.close-btn:hover {
  color: #111827;
}

/* Make modal-content relative for positioning */
.modal-content {
  position: relative;
}
/* Students Grid Layout */
.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.student-card {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 1rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.student-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.student-header h4 {
  margin: 0;
  color: #2c3e50;
}

.student-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.detail-label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.detail-value {
  color: #333;
  font-size: 0.9rem;
  text-align: right;
  word-break: break-word;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.verified {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.notverified {
  background-color: #f8d7da;
  color: #721c24;
}

.status-badge.pending {
  background-color: #fff3cd;
  color: #856404;
}

/* Modal student items */
.student-item-modal {
  display: flex;
  align-items: flex-start;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  background: white;
}

.student-item-modal:hover {
  background-color: #f8f9fa;
}

.student-info-modal {
  margin-left: 0.75rem;
  flex: 1;
}

.student-name-modal {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.student-details-modal {
  font-size: 0.85rem;
  color: #6c757d;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .students-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .detail-value {
    text-align: left;
  }
  
  .student-details-modal {
    flex-direction: column;
    gap: 0.25rem;
  }
}`}</style>
      <div
        style={{
          gap: "2rem",
          display: "flex",
          flexDirection: "column",
        }}
        className="category-container"
      >
        <div className="header">
          <h1>Campus Management</h1>
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
    </>
  );
};

export default Category;
