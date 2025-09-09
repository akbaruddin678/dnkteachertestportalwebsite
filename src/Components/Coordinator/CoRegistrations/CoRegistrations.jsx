import React, { useState, useEffect, useMemo } from "react";
import {
  FaBookOpen,
  FaPlus,
  FaListUl,
  FaChalkboardTeacher,
  FaUserGraduate,
} from "react-icons/fa";
import axios from "axios";

/* ------------------------ Axios setup ------------------------ */
// const API_BASE = "http//:localhost:5000/api/v1";
const API_BASE = import.meta.env?.VITE_API_BASE || "/api/v1";
const api = axios.create({
  baseURL: `${API_BASE}/coordinator`,
  withCredentials: false,
});

function applyAuth() {
  const token = localStorage.getItem("token");
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}
applyAuth();

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      console.warn("Unauthorized — missing/expired token.");
    }
    return Promise.reject(err);
  }
);

/* -------------------- Teacher Registration ------------------- */
const TeacherRegistrationForm = ({ onClose, onSaved }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    subjectSpecialization: "",
    qualifications: "",
  });

  const setField = (k, v) => setFormData((p) => ({ ...p, [k]: v }));

  const reset = () =>
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      subjectSpecialization: "",
      qualifications: "",
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = [
      "name",
      "email",
      "password",
      "phone",
      "subjectSpecialization",
      "qualifications",
    ];
    const missing = required.filter((k) => !formData[k]?.trim());
    if (missing.length) {
      setError(`Please fill: ${missing.join(", ")}`);
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data } = await api.post(`/teachers`, {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        contactNumber: formData.phone,
        subjectSpecialization: formData.subjectSpecialization,
        qualifications: formData.qualifications,
      });

      const saved = data?.data?.teacher;
      const savedUser = data?.data?.user;

      onSaved(saved, savedUser);
      reset();
      onClose();
    } catch (err) {
      console.error("Register teacher error:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to register teacher. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
      role="dialog"
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Register Teacher</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setField("name", e.target.value)}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      value={formData.password}
                      onChange={(e) => setField("password", e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="form-text">Minimum 6 characters</div>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Phone <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Subject Specialization</label>
                  <input
                    className="form-control"
                    value={formData.subjectSpecialization}
                    onChange={(e) =>
                      setField("subjectSpecialization", e.target.value)
                    }
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Qualifications</label>
                  <input
                    className="form-control"
                    value={formData.qualifications}
                    onChange={(e) => setField("qualifications", e.target.value)}
                    placeholder="e.g., MSc Mathematics"
                  />
                </div>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={reset}
              disabled={loading}
            >
              Reset
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Teacher"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----------------------- Assign Teacher ---------------------- */
const AssignTeacherModal = ({ onClose, onAssign, teachers, courseName }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTeachers = useMemo(() => {
    if (!searchTerm) return teachers || [];
    return (teachers || []).filter((teacher) => {
      const name = (teacher?.name || "").toLowerCase();
      const email = (teacher?.user?.email || "").toLowerCase();
      const subject = (teacher?.subjectSpecialization || "").toLowerCase();
      return (
        name.includes(searchTerm.toLowerCase()) ||
        email.includes(searchTerm.toLowerCase()) ||
        subject.includes(searchTerm.toLowerCase())
      );
    });
  }, [searchTerm, teachers]);

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
      role="dialog"
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Assign Teacher — {courseName}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            {!teachers || teachers.length === 0 ? (
              <div className="alert alert-info">
                <p>No teachers found. Please register a teacher first.</p>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, email, or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="list-group">
                  {filteredTeachers.map((teacher) => (
                    <div
                      key={teacher._id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <h6 className="mb-1">{teacher.name}</h6>
                        <small className="text-muted">
                          {teacher.user?.email || "—"} •{" "}
                          {teacher.subjectSpecialization || "—"}
                        </small>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onAssign(teacher)}
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                  {filteredTeachers.length === 0 && (
                    <div className="alert alert-warning">
                      No teachers found matching "{searchTerm}"
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------------- Teachers List Card ------------------- */
const TeachersListView = ({ teachers = [], loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading teachers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <FaChalkboardTeacher className="me-2" />
          Teachers
        </h5>
        <span className="badge bg-primary">{teachers.length} teachers</span>
      </div>
      <div className="card-body">
        {teachers.length === 0 ? (
          <div className="alert alert-info">
            <p className="mb-0">No teachers found yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subject</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher._id}>
                    <td>{teacher.name || "—"}</td>
                    <td>{teacher.user?.email || "—"}</td>
                    <td>{teacher.subjectSpecialization || "—"}</td>
                    <td>{teacher.contactNumber || "—"}</td>
                    <td>
                      <span
                        className={`badge ${
                          teacher.user?.isActive ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {teacher.user?.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => onEdit(teacher)}
                        title="Edit teacher"
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onDelete(teacher._id)}
                        title="Delete teacher"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ----------------------- Courses Table ----------------------- */
const CoursesView = ({ courses = [], loading, onOpenAssign }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <FaBookOpen className="me-2" />
          Courses
        </h5>
        <span className="badge bg-primary">{courses.length} courses</span>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Description</th>
                <th>Credit Hours</th>
                <th>Assigned Teacher</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course._id}>
                  <td>{course.name || "—"}</td>
                  <td>{course.code || "—"}</td>
                  <td>{course.description || "—"}</td>
                  <td>{course.creditHours || "—"}</td>
                  <td>
                    {course.teacher ? (
                      <span className="badge bg-success">
                        {course.teacher.name}
                      </span>
                    ) : (
                      <span className="badge bg-warning text-dark">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onOpenAssign(course._id)}
                      title={
                        course.teacher
                          ? `Reassign: ${course.teacher.name}`
                          : "Assign a teacher"
                      }
                    >
                      {course.teacher ? "Reassign" : "Assign"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* --------------------------- Main Component ---------------------------- */
const Registrations = () => {
  const [activeView, setActiveView] = useState("courses");
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [assignForCourseId, setAssignForCourseId] = useState(null);
  const [loading, setLoading] = useState({ courses: true, teachers: true });
  const [error, setError] = useState("");

  const fetchCourses = async () => {
    try {
      setLoading((prev) => ({ ...prev, courses: true }));
      const { data } = await api.get(`/courses`);
      setCourses(data?.data || []);
    } catch (err) {
      console.error("Fetch courses error:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load courses."
      );
    } finally {
      setLoading((prev) => ({ ...prev, courses: false }));
    }
  };

  const fetchTeachers = async () => {
    try {
      setLoading((prev) => ({ ...prev, teachers: true }));
      const { data } = await api.get(`/teachers`);
      setTeachers(data?.data || []);
    } catch (err) {
      console.error("Fetch teachers error:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load teachers."
      );
    } finally {
      setLoading((prev) => ({ ...prev, teachers: false }));
    }
  };

  useEffect(() => {
    applyAuth();
    Promise.all([fetchCourses(), fetchTeachers()]).catch(() => {});
  }, []);

  const openAssign = (courseId) => setAssignForCourseId(courseId);
  const closeAssign = () => setAssignForCourseId(null);

  const handleTeacherSaved = async () => {
    await fetchTeachers();
    setActiveView("teachers");
  };

  const assignTeacherToCourse = async (teacher) => {
    try {
      setLoading((prev) => ({ ...prev, courses: true }));
      const courseId = assignForCourseId;
      await api.post(`/courses/${courseId}/assign-teacher/${teacher._id}`);

      // Update UI state
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course._id === courseId
            ? { ...course, teacher: { _id: teacher._id, name: teacher.name } }
            : course
        )
      );
      closeAssign();
    } catch (err) {
      console.error("Assign teacher error:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to assign teacher."
      );
    } finally {
      setLoading((prev) => ({ ...prev, courses: false }));
    }
  };

  const handleEditTeacher = (teacher) => {
    // Implement edit functionality
    console.log("Edit teacher:", teacher);
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      try {
        await api.delete(`/teachers/${teacherId}`);
        setTeachers(teachers.filter((teacher) => teacher._id !== teacherId));
      } catch (err) {
        console.error("Delete teacher error:", err);
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            "Failed to delete teacher."
        );
      }
    }
  };

  const courseForAssign = useMemo(
    () => courses.find((course) => course._id === assignForCourseId),
    [assignForCourseId, courses]
  );

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">
          <FaUserGraduate className="me-2" />
          Registrations Management
        </h1>
        <div>
          <button
            className="btn btn-primary me-2"
            onClick={() => setShowTeacherModal(true)}
          >
            <FaPlus className="me-1" />
            Add Teacher
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => setActiveView("teachers")}
          >
            <FaListUl className="me-1" />
            View Teachers
          </button>
        </div>
      </div>

      {/* Error message */}
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

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeView === "courses" ? "active" : ""}`}
            onClick={() => setActiveView("courses")}
          >
            <FaBookOpen className="me-1" />
            Courses
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeView === "teachers" ? "active" : ""}`}
            onClick={() => setActiveView("teachers")}
          >
            <FaChalkboardTeacher className="me-1" />
            Teachers
          </button>
        </li>
      </ul>

      {/* Main content */}
      {activeView === "courses" ? (
        <CoursesView
          courses={courses}
          loading={loading.courses}
          onOpenAssign={openAssign}
        />
      ) : (
        <TeachersListView
          teachers={teachers}
          loading={loading.teachers}
          onEdit={handleEditTeacher}
          onDelete={handleDeleteTeacher}
        />
      )}

      {/* Modals */}
      {showTeacherModal && (
        <TeacherRegistrationForm
          onClose={() => setShowTeacherModal(false)}
          onSaved={handleTeacherSaved}
        />
      )}

      {assignForCourseId && courseForAssign && (
        <AssignTeacherModal
          onClose={closeAssign}
          onAssign={assignTeacherToCourse}
          teachers={teachers}
          courseName={`${courseForAssign.name} (${courseForAssign.code})`}
        />
      )}
    </div>
  );
};

export default Registrations;