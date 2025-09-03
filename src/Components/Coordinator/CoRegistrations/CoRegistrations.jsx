import React, { useState, useEffect, useMemo } from "react";
import { FaBookOpen, FaPlus, FaListUl } from "react-icons/fa";
import axios from "axios";

/* ------------------------ Axios setup ------------------------ */
// Prefer env base when calling from a different origin, else same-origin
const API_BASE = "https://vigilant-moser.210-56-25-68.plesk.page/api/v1";
// Coordinator scope base
const api = axios.create({
  baseURL: `${API_BASE}/coordinator`,
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
    <>
    <style>{`/* ========== Theme (shared) ========== */
:root {
  --bg: #f8fafc;
  --card: #ffffff;
  --ink: #0f172a;
  --muted: #475569;
  --border: #e5e7eb;
  --primary: #2563eb;
  --primary-600: #1d4ed8;
  --ring: rgba(37, 99, 235, 0.14);
  --shadow: 0 10px 24px rgba(2, 6, 23, 0.06);
  --radius: 14px;
  --radius-sm: 10px;
  --tab-bg: #e9f0ff;
}

/* ========== Page wrapper ========== */
.coordinator-page {
  min-height: 100%;
  padding: 24px;
  font-family: ui-sans-serif, system-ui, -apple-system, "Inter", "Roboto", "Segoe UI", "Helvetica Neue", Arial;
  color: var(--ink);
  background: var(--bg);
}

/* ========== Header bar (title + actions) ========== */
.coordinator-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 18px;
  box-shadow: var(--shadow);
  margin-bottom: 16px;
}

.coordinator-bar h1 {
  font-size: 28px;
  font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0;
}

.coordinator-actions {
  display: flex;
  gap: 12px;
}

/* ========== Buttons ========== */
.coordinator-primary-btn,
.coordinator-secondary-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background .15s ease, border-color .15s ease, color .15s ease, transform .05s ease;
}

.coordinator-primary-btn {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.coordinator-primary-btn:hover {
  background: var(--primary-600);
}

.coordinator-secondary-btn {
  background: #fff;
  color: #1f2937;
  border-color: var(--border);
}

.coordinator-secondary-btn:hover {
  background: #f8fafc;
}

/* ========== Tabs ========== */
.coordinator-tabs {
  display: flex;
  gap: 16px;
    padding: 14px;
    border: 1px solid var(--border);
    background: var(--tab-bg);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    margin-bottom: 16px;
}

.coordinator-tab {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: 12px;
  background: #fff;
  color: var(--primary);
  border: 2px solid var(--primary);
  font-weight: 700;
  cursor: pointer;
  transition: transform .05s ease, box-shadow .15s ease, background .15s ease;
  }
  
  .coordinator-tab-icon {
    display: inline-flex;
  }
  
  .coordinator-tab:hover {
    box-shadow: 0 4px 12px rgba(37, 99, 235, .15);
  }
  
  .coordinator-tab.active {
    background: var(--primary);
    color: #fff;
    box-shadow: 0 6px 18px rgba(37, 99, 235, .25);
  }
  
  /* ========== Cards ========== */
  .coordinator-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    overflow: hidden;
  }
  
  .coordinator-card-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    background: #fff;
  }
  
  .coordinator-card-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .coordinator-card-body {
    padding: 16px;
  }
  
  /* ========== Table ========== */
  .coordinator-table-container {
    width: 100%;
    overflow-x: auto;
  }
  
  .coordinator-table-container table {
    width: 100%;
    border-collapse: collapse;
    background: #fff;
  }
  
  .coordinator-table-container thead th {
    text-align: left;
    font-size: 13px;
    color: #667085;
    letter-spacing: .02em;
    font-weight: 700;
    background: #f7f9fc;
    border-bottom: 1px solid var(--border);
    padding: 12px 14px;
    white-space: nowrap;
  }
  
  .coordinator-table-container tbody td {
    border-bottom: 1px solid var(--border);
    padding: 12px 14px;
    vertical-align: top;
  font-size: 14px;
}

.coordinator-table-container tbody tr:hover {
  background: #fafbff;
}

.coordinator-description-cell {
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== Error message ========== */
.coordinator-error {
  background: #fef2f2;
  border: 1px solid #fee2e2;
  color: #991b1b;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

/* ========== Modals ========== */
.coordinator-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.45);
  backdrop-filter: saturate(140%) blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 99999;
}

.coordinator-modal {
  width: 100%;
  max-width: 680px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.coordinator-modal--wide {
  max-width: 900px;
}

.coordinator-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
    gap: 16px;
    padding: 16px 18px;
    border-bottom: 1px solid var(--border);
    background: #fff;
}

.coordinator-modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}

.coordinator-modal-header button {
  background: transparent;
  border: 0;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  border-radius: 8px;
  padding: 2px 6px;
}

.coordinator-modal-header button:hover {
  background: #f3f4f6;
  color: #374151;
}

.coordinator-modal-body {
  padding: 18px;
}

.coordinator-modal-footer {
  display: flex;
  justify-content: flex-end;
    gap: 10px;
    padding: 12px 16px 16px;
    border-top: 1px solid var(--border);
}

/* ========== Form Grid & Inputs ========== */
.coordinator-req {
  color: #ef4444;
  margin-left: 2px;
}

.coordinator-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px 28px;
}

.coordinator-col-span-2 {
  grid-column: 1 / -1;
}

.coordinator-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.coordinator-form-group label {
  font-size: 14px;
  font-weight: 700;
    color: #1f2937;
}

.coordinator-input {
  height: 48px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 10px 14px;
  font-size: 14px;
  outline: none;
    transition: border-color .15s ease, box-shadow .15s ease;
    width: 100%;
}

.coordinator-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--ring);
}

.coordinator-grid select.coordinator-input {
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, #9ca3af 50%),
    linear-gradient(135deg, #9ca3af 50%, transparent 50%),
    linear-gradient(to right, #e5e7eb, #e5e7eb);
  background-position: calc(100% - 20px) calc(50% - 3px),
    calc(100% - 15px) calc(50% - 3px), calc(100% - 40px) 50%;
  background-size: 5px 5px, 5px 5px, 1px 60%;
  background-repeat: no-repeat;
}

.coordinator-input-wrap {
  position: relative;
}

.coordinator-input-adornment {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: 0;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
    color: #6b7280;
    padding: 4px;
    border-radius: 8px;
  }
  
  .coordinator-input-adornment:hover {
    background: #f3f4f6;
    color: #374151;
  }
  
  .coordinator-help-text {
    margin-top: 6px;
    color: #6b7280;
    font-size: 13px;
  }
  
  .coordinator-invisible-input {
    opacity: 0;
    pointer-events: none;
}

.coordinator-grid-right {
  grid-column: 2 / 3;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
    padding-top: 4px;
  }
  
  /* ========== Lists in modals ========== */
  .coordinator-list {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
}

.coordinator-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
}

.coordinator-list-item:last-child {
  border-bottom: none;
}

.coordinator-muted {
  color: #667085;
  font-size: 13px;
}

.coordinator-empty-state {
  background: #f8fafc;
  border: 1px dashed var(--border);
  color: #667085;
  padding: 18px;
  border-radius: 10px;
  text-align: center;
}

/* ========== Responsive ========== */
@media (max-width: 900px) {
  .coordinator-tabs {
    gap: 10px;
  }

        .coordinator-tab {
          padding: 10px 14px;
  }

        .coordinator-grid-right {
          grid-column: 1 / -1;
          justify-content: flex-end;
        }
        }

@media (max-width: 720px) {
  .coordinator-grid {
    grid-template-columns: 1fr;
  }

        .coordinator-bar {
    flex-direction: column;
    align-items: stretch;
      gap: 12px;
  }

        .coordinator-actions {
          justify-content: flex-end;
  }

        .coordinator-table-container thead {
          display: none;
  }

        .coordinator-table-container tbody tr {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 10px;
          padding: 10px 12px;
        }

        .coordinator-table-container tbody td {
          border: 0;
          padding: 6px 0;
  }

        .coordinator-table-container tbody tr+tr {
          border-top: 1px solid var(--border);
  }
}
`}</style>
    
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
      <div style={{
        justifyContent:"center"
      }} className="coordinator-tabs">
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
    </>
  );
};

export default Registrations;
