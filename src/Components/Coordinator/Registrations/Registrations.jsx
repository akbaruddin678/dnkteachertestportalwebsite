import React, { useState, useEffect, useMemo } from "react";
import { FaBookOpen, FaPlus, FaListUl } from "react-icons/fa";
import axios from "axios";
import "./Registrations.css";

/* ------------------------ Axios setup ------------------------ */
// Prefer env base when calling from a different origin, else same-origin
const API_BASE = "";
// Coordinator scope base
const api = axios.create({
  baseURL: `${API_BASE}/api/v1/coordinator`,
  withCredentials: false,
});

// Attach token if present
function applyAuth() {
  const token = localStorage.getItem("token");
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}
applyAuth();

// Global interceptor for 401s
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
      // ❗ Use the configured axios instance so auth/baseURL are applied
      const { data } = await api.post(`/teachers`, {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        contactNumber: formData.phone,
        subjectSpecialization: formData.subjectSpecialization,
        qualifications: formData.qualifications,
      });

      // API returns { success, message, data: { user, teacher } }
      const saved = data?.data?.teacher;
      const savedUser = data?.data?.user;

      // Let parent refresh list (so user.email is populated by GET route)
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
    <div className="coordinator-modal-overlay" role="dialog" aria-modal="true">
      <div className="coordinator-modal coordinator-modal--wide">
        <div className="coordinator-modal-header">
          <h2>Register Teacher</h2>
          <button
            type="button"
            className="coordinator-close"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="coordinator-modal-body coordinator-grid"
        >
          {error && (
            <div className="coordinator-error-message coordinator-col-span-2">
              {error}
            </div>
          )}

          <div className="coordinator-form-group">
            <label>
              Name <span className="coordinator-req">*</span>
            </label>
            <input
              className="coordinator-input"
              value={formData.name}
              onChange={(e) => setField("name", e.target.value)}
            />
          </div>

          <div className="coordinator-form-group">
            <label>
              Email <span className="coordinator-req">*</span>
            </label>
            <input
              type="email"
              className="coordinator-input"
              value={formData.email}
              onChange={(e) => setField("email", e.target.value)}
            />
          </div>

          <div className="coordinator-form-group">
            <label>
              Password <span className="coordinator-req">*</span>
            </label>
            <div className="coordinator-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                className="coordinator-input"
                value={formData.password}
                onChange={(e) => setField("password", e.target.value)}
              />
              <button
                type="button"
                className="coordinator-input-adornment"
                onClick={() => setShowPassword((s) => !s)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <div className="coordinator-help-text">Minimum 6 characters</div>
          </div>

          <div className="coordinator-form-group">
            <label>
              Phone <span className="coordinator-req">*</span>
            </label>
            <input
              className="coordinator-input"
              value={formData.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </div>

          <div className="coordinator-form-group">
            <label>Subject Specialization</label>
            <input
              className="coordinator-input"
              value={formData.subjectSpecialization}
              onChange={(e) =>
                setField("subjectSpecialization", e.target.value)
              }
            />
          </div>

          <div className="coordinator-form-group coordinator-col-span-2">
            <label>Qualifications</label>
            <input
              className="coordinator-input"
              value={formData.qualifications}
              onChange={(e) => setField("qualifications", e.target.value)}
              placeholder="e.g., MSc Mathematics"
            />
          </div>

          <div className="coordinator-modal-footer coordinator-grid-right">
            <button
              type="button"
              className="coordinator-secondary-btn"
              onClick={reset}
              disabled={loading}
            >
              Reset
            </button>
            <button
              type="submit"
              className="coordinator-primary-btn"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Teacher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ----------------------- Assign Teacher ---------------------- */
const AssignTeacherModal = ({ onClose, onAssign, teachers, courseName }) => {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    if (!query) return teachers || [];
    return (teachers || []).filter((t) => {
      const name = (t?.name || "").toLowerCase();
      const email = (t?.user?.email || "").toLowerCase();
      const subj = (t?.subjectSpecialization || "").toLowerCase();
      return (
        name.includes(query) || email.includes(query) || subj.includes(query)
      );
    });
  }, [q, teachers]);

  return (
    <div className="coordinator-modal-overlay" role="dialog" aria-modal="true">
      <div className="coordinator-modal">
        <div className="coordinator-modal-header">
          <h2>Assign Teacher — {courseName}</h2>
          <button
            type="button"
            className="coordinator-close"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="coordinator-modal-body">
          {!teachers || teachers.length === 0 ? (
            <div className="coordinator-empty-state">
              <p>No teachers found. Please register a teacher first.</p>
            </div>
          ) : (
            <>
              <div className="coordinator-form-group">
                <input
                  className="coordinator-input"
                  placeholder="Search by name, email, subject…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <ul className="coordinator-list">
                {(filtered || []).map((t) => (
                  <li key={t._id} className="coordinator-list-item">
                    <div>
                      <strong>{t.name}</strong>
                      <div className="coordinator-muted">
                        {t.user?.email || "—"} •{" "}
                        {t.subjectSpecialization || "—"}
                      </div>
                    </div>
                    <button
                      className="coordinator-primary-btn"
                      onClick={() => onAssign(t)}
                    >
                      Assign
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="coordinator-muted">No matches for “{q}”.</li>
                )}
              </ul>
            </>
          )}
        </div>
        <div className="coordinator-modal-footer">
          <button className="coordinator-secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------- Teachers List Card ------------------- */
const TeachersListView = ({ teachers = [], loading }) => (
  <div className="coordinator-card">
    <div className="coordinator-card-header">
      <h3>Teachers</h3>
    </div>
    <div className="coordinator-card-body">
      {loading ? (
        <div className="coordinator-loading">Loading teachers...</div>
      ) : teachers.length === 0 ? (
        <div className="coordinator-empty-state">
          <p>No teachers found yet.</p>
        </div>
      ) : (
        <div className="coordinator-table-container">
          <table className="coordinator-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Phone</th>

                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(teachers || []).map((t) => (
                <tr key={t._id}>
                  <td>{t.name || "—"}</td>
                  <td>{t.user?.email || "—"}</td>
                  <td>{t.subjectSpecialization || "—"}</td>
                  <td>{t.contactNumber || "—"}</td>
                  <td>{t.user?.isActive ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);

/* ----------------------- Courses Table ----------------------- */
const CoursesView = ({ courses = [], loading, onOpenAssign }) => (
  <div className="coordinator-card">
    <div className="coordinator-card-header">
      <h3>
        <FaBookOpen /> Courses
      </h3>
    </div>
    <div className="coordinator-card-body">
      {loading ? (
        <div className="coordinator-loading">Loading courses...</div>
      ) : (
        <div className="coordinator-table-container">
          <table className="coordinator-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Description</th>
                <th>Credit Hours</th>
                <th>Assigned Teacher</th>
                <th>Assign</th>
              </tr>
            </thead>
            <tbody>
              {(courses || []).map((course) => {
                const label = course?.teacher ? "Reassign" : "Assign";
                return (
                  <tr key={course._id}>
                    <td>{course?.name || "—"}</td>
                    <td>{course?.code || "—"}</td>
                    <td className="coordinator-description-cell">
                      {course?.description || "—"}
                    </td>
                    <td>{course?.creditHours ?? "—"}</td>
                    <td>{course?.teacher?.name || <em>Unassigned</em>}</td>
                    <td>
                      <button
                        className="coordinator-secondary-btn"
                        title={
                          course?.teacher?.name
                            ? `Currently: ${course.teacher.name}`
                            : "Assign a teacher"
                        }
                        onClick={() => onOpenAssign(course._id)}
                      >
                        {label}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);

/* --------------------------- Page ---------------------------- */
const Registrations = () => {
  const [mainView, setMainView] = useState("courses"); // 'courses' | 'teachers'
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [assignForCourseId, setAssignForCourseId] = useState(null);
  const [loading, setLoading] = useState({ courses: true, teachers: true });
  const [error, setError] = useState("");

  // Helpers
  const fetchCourses = async () => {
    try {
      setLoading((p) => ({ ...p, courses: true }));
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
      setLoading((p) => ({ ...p, courses: false }));
    }
  };

  const fetchTeachers = async () => {
    try {
      setLoading((p) => ({ ...p, teachers: true }));
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
      setLoading((p) => ({ ...p, teachers: false }));
    }
  };

  useEffect(() => {
    applyAuth(); // re-apply in case token was set after mount
    Promise.all([fetchCourses(), fetchTeachers()]).catch(() => {});
  }, []);

  const openAssign = (courseId) => setAssignForCourseId(courseId);
  const closeAssign = () => setAssignForCourseId(null);

  const handleTeacherSaved = async (_teacher, _user) => {
    // Refresh to ensure populated user fields are available
    await fetchTeachers();
    setMainView("teachers");
  };

  const assignTeacherToCourse = async (teacher) => {
    try {
      setLoading((p) => ({ ...p, courses: true }));
      const courseId = assignForCourseId;
      await api.post(`/courses/${courseId}/assign-teacher/${teacher._id}`);
      // patch UI state
      setCourses((prev) =>
        (prev || []).map((c) =>
          c._id === courseId
            ? { ...c, teacher: { _id: teacher._id, name: teacher.name } }
            : c
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
      setLoading((p) => ({ ...p, courses: false }));
    }
  };

  const courseForAssign = useMemo(
    () =>
      assignForCourseId
        ? courses.find((c) => c._id === assignForCourseId)
        : null,
    [assignForCourseId, courses]
  );

  return (
    <div className="coordinator-page">
      {/* Header */}
      <div className="coordinator-bar">
        <h1>Registrations</h1>
        <div className="coordinator-actions">
          <button
            className="coordinator-primary-btn"
            onClick={() => setShowTeacherModal(true)}
          >
            <FaPlus /> Add Teacher
          </button>
          <button
            className="coordinator-secondary-btn"
            onClick={() => setMainView("teachers")}
          >
            <FaListUl /> View Teachers
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="coordinator-error-message coordinator-page-error">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="coordinator-tabs">
        <button
          className={`coordinator-tab ${
            mainView === "courses" ? "active" : ""
          }`}
          onClick={() => setMainView("courses")}
        >
          <span className="coordinator-tab-icon">
            <FaBookOpen />
          </span>
          Courses
        </button>
        <button
          className={`coordinator-tab ${
            mainView === "teachers" ? "active" : ""
          }`}
          onClick={() => setMainView("teachers")}
        >
          Teachers
        </button>
      </div>

      {/* Main content */}
      {mainView === "courses" ? (
        <CoursesView
          courses={courses}
          loading={loading.courses}
          onOpenAssign={openAssign}
        />
      ) : (
        <TeachersListView teachers={teachers} loading={loading.teachers} />
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
