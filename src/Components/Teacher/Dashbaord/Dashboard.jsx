import React, { useEffect, useMemo, useState } from "react";
import "./Dashboard.css";

/** =========================
 * Config & utilities
 * ========================= */
const API_BASE =
  import.meta.env?.VITE_API_BASE ||
  "https://vigilant-moser.210-56-25-68.plesk.page/api/v1";

const LS = {
  TEACHER: "tdb_teacher",
  CAMPUSES: "tdb_campuses",
  CURRENT_CAMPUS_ID: "tdb_current_campus_id",
  CAMPUS_INFO: (id) => `tdb_campus_${id}_info`,
  CAMPUS_STUDENTS: (id) => `tdb_campus_${id}_students`,
  COURSES: "tdb_courses_for_teacher",
};

const saveLS = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};
const readLS = (k, fallback = null) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const fetchJSON = async (url, token) => {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `${res.status} ${res.statusText} — ${text || "Request failed"}`
    );
  }
  return res.json();
};

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

/** =========================
 * Component
 * ========================= */
const TeacherCampusDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [teacher, setTeacher] = useState(readLS(LS.TEACHER, null));
  const [campuses, setCampuses] = useState(readLS(LS.CAMPUSES, []));
  const [selectedCampusId, setSelectedCampusId] = useState(
    readLS(LS.CURRENT_CAMPUS_ID, "")
  );
  const [campus, setCampus] = useState(
    selectedCampusId ? readLS(LS.CAMPUS_INFO(selectedCampusId), null) : null
  );
  const [students, setStudents] = useState(
    selectedCampusId ? readLS(LS.CAMPUS_STUDENTS(selectedCampusId), []) : []
  );
  const [courses, setCourses] = useState(readLS(LS.COURSES, []));

  const token = useMemo(() => localStorage.getItem("token"), []);

  /** Load from API (and persist) */
  const loadDashboard = async (campusId = "") => {
    if (!token) {
      setErr("Missing token. Please sign in.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr("");

    try {
      const q = campusId ? `?campusId=${campusId}` : "";
      const resp = await fetchJSON(`${API_BASE}/teacher/dashboard${q}`, token);
      const d = resp?.data || {};

      // teacher + campuses
      if (d.teacher) {
        setTeacher(d.teacher);
        saveLS(LS.TEACHER, d.teacher);
      }
      if (Array.isArray(d.campuses)) {
        setCampuses(d.campuses);
        saveLS(LS.CAMPUSES, d.campuses);
      }

      // current campus & students
      if (d.campus?._id) {
        setCampus(d.campus);
        setSelectedCampusId(d.campus._id);
        saveLS(LS.CURRENT_CAMPUS_ID, d.campus._id);
        saveLS(LS.CAMPUS_INFO(d.campus._id), d.campus);
      }

      if (Array.isArray(d.students)) {
        setStudents(d.students);
        if (d.campus?._id) {
          // campus-scoped cache
          saveLS(LS.CAMPUS_STUDENTS(d.campus._id), d.students);
        }
        // generic cache so other pages (Courses) can find students
        saveLS("tdb_students", d.students);
      }

      // courses (teacher’s courses)
      if (Array.isArray(d.courses)) {
        setCourses(d.courses);
        saveLS(LS.COURSES, d.courses);

        // derive a compact teacher list for compatibility with other pages
        const teachers = Array.from(
          new Map(
            d.courses
              .filter((c) => c?.teacher)
              .map((c) => {
                const t =
                  typeof c.teacher === "string"
                    ? { _id: c.teacher, name: "—" }
                    : c.teacher;
                const id = t._id || t.id;
                return [id, { _id: id, name: t.name || t.fullName || "—" }];
              })
          ).values()
        );
        saveLS("tdb_teachers", teachers);
      }
    } catch (e) {
      setErr(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  /** Initial load (cache first UI, then fetch) */
  useEffect(() => {
    // if cache had nothing, we’ll fetch without campusId to let server pick default
    loadDashboard(selectedCampusId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** When campus selector changes */
  const onChangeCampus = (id) => {
    setSelectedCampusId(id);
    saveLS(LS.CURRENT_CAMPUS_ID, id);

    // hydrate from cache immediately
    const cachedCampus = readLS(LS.CAMPUS_INFO(id), null);
    const cachedStudents = readLS(LS.CAMPUS_STUDENTS(id), []);
    setCampus(cachedCampus);
    setStudents(cachedStudents);

    // then fetch to refresh
    loadDashboard(id);
  };

  const clearCache = () => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("tdb_"))
      .forEach((k) => localStorage.removeItem(k));
    // keep token
    setTeacher(null);
    setCampuses([]);
    setSelectedCampusId("");
    setCampus(null);
    setStudents([]);
    setCourses([]);
  };

  /** Derived bits */
  const campusOptions = campuses.map((c) => ({ value: c._id, label: c.name }));
  const totalStudents = students.length;
  const totalCourses = courses.length;

  return (
    <div className="tcd-wrap">
      <header className="tcd-header">
        <div className="tcd-teacher">
          <div className="avatar">{initials(teacher?.name || "T")}</div>
          <div className="meta">
            <div className="name">{teacher?.name || "Teacher"}</div>
            <div className="muted">
              {teacher?.subjectSpecialization
                ? teacher.subjectSpecialization
                : "—"}
            </div>
          </div>
        </div>

        <div className="tcd-actions">
          {campusOptions.length > 0 && (
            <div className="campus-select">
              <label htmlFor="campusSel">Campus</label>
              <select
                id="campusSel"
                value={selectedCampusId || campusOptions[0]?.value || ""}
                onChange={(e) => onChangeCampus(e.target.value)}
              >
                {campusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="btn"
            onClick={() => loadDashboard(selectedCampusId)}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          {/* <button
            className="btn danger"
            onClick={clearCache}
            disabled={loading}
          >
            Clear Cache
          </button> */}
        </div>
      </header>

      {err && (
        <div className="error-banner">
          <strong>Error:</strong> {err}
        </div>
      )}

      {/* Top stats */}
      <section className="tcd-stats">
        <div className="stat">
          <div className="label">Campus</div>
          <div className="value">{campus?.name || "—"}</div>
          <div className="sub">
            {campus?.location ? `${campus.location} • ` : ""}
            {campus?.contactNumber || ""}
          </div>
        </div>
        <div className="stat">
          <div className="label">Courses (assigned to you)</div>
          <div className="value">{totalCourses}</div>
        </div>
        <div className="stat">
          <div className="label">Students (in campus)</div>
          <div className="value">{totalStudents}</div>
        </div>
      </section>

      <div className="tcd-grid">
        {/* Courses you teach */}
        <section className="card">
          <div className="card-head">
            <h3>My Courses</h3>
          </div>
          {courses.length === 0 ? (
            <div className="empty">No courses assigned.</div>
          ) : (
            <ul className="course-list">
              {courses.map((c) => (
                <li key={c._id} className="course-item">
                  <div className="icon">📘</div>
                  <div className="main">
                    <div className="title">{c.name || "Untitled Course"}</div>
                    <div className="muted">{c.code || "—"}</div>
                  </div>
                  <div className="right muted">
                    {Array.isArray(c.students)
                      ? `${c.students.length} students`
                      : "—"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Students in selected campus */}
        <section className="card">
          <div className="card-head">
            <h3>Students in {campus?.name || "Campus"}</h3>
          </div>

          {students.length === 0 ? (
            <div className="empty">No students found for this campus.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th className="hide-sm">Email</th>
                    <th>Phone</th>
                    <th className="hide-sm">City</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s._id}>
                      <td>
                        <div className="stud-cell">
                          <span className="stud-avatar">
                            {initials(s.name)}
                          </span>
                          <div className="stud-meta">
                            <div className="stud-name">{s.name}</div>
                            <div className="stud-sub hide-lg">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="hide-sm">{s.email}</td>
                      <td>{s.phone}</td>
                      <td className="hide-sm">{s.city || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TeacherCampusDashboard;
