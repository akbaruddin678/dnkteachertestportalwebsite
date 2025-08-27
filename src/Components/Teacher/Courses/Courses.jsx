// components/CoursesOffered.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./Courses.css";
import {
  MdSearch,
  MdExpandMore,
  MdExpandLess,
  MdAssessment,
  MdArrowBack,
  MdGrade,
  MdPerson,
  MdAdd,
  MdEdit,
  MdDelete,
  MdSave,
  MdClose,
} from "react-icons/md";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const token = () => localStorage.getItem("token");

const TYPE_OPTIONS = [
  "Quiz",
  "Assignment",
  "Midterm",
  "Final",
  "Project",
  "Practical",
  "Viva",
];

/* ---------------- localStorage helpers ---------------- */
const readJSON = (k) => {
  try {
    console.log(JSON.parse(localStorage.getItem(k)));
    return JSON.parse(localStorage.getItem(k) || "null");
  } catch {
    return null;
  }
};
const readArrayFromKeys = (keys) => {
  const bag = [];
  const seen = new Set();
  for (const k of keys) {
    const v = readJSON(k);
    if (Array.isArray(v)) {
      for (const item of v) {
        const id = item?._id || item?.id || JSON.stringify(item);
        if (!seen.has(id)) {
          bag.push(item);
          seen.add(id);
        }
      }
    } else if (v && typeof v === "object" && Array.isArray(v.data)) {
      // some APIs store under {data:[...]}
      for (const item of v.data) {
        const id = item?._id || item?.id || JSON.stringify(item);
        if (!seen.has(id)) {
          bag.push(item);
          seen.add(id);
        }
      }
    }
  }
  return bag;
};

// Try lots of sensible keys so it "just works" in your app
const STUDENT_KEYS = [
  "tdb_students",
  "campus_students",
  "students",
  "all_students",
  "students_list",
  "users_students",
];
const TEACHER_KEYS = [
  "tdb_teachers",
  "teachers",
  "all_teachers",
  "staff",
  "faculty",
];

const getUser = () =>
  readJSON("auth_user") ||
  readJSON("user") || { role: localStorage.getItem("role") || "teacher" };
const currentRole = (getUser()?.role || "teacher").toUpperCase();

/* ---------------- normalizers ---------------- */
const normId = (obj) => obj?._id || obj?.id || String(obj || "");
const normalizeStudent = (s) => ({
  _id: normId(s),
  name: s?.name || s?.fullName || s?.title || "Unnamed",
  email: s?.email || "",
  phone: s?.phone || s?.contactNumber || "",
});
const normalizeTeacher = (t) => {
  if (!t) return { _id: "", name: "—" };
  if (typeof t === "string") return { _id: t, name: "—" };
  return { _id: normId(t), name: t?.name || t?.fullName || "—" };
};

/* ---------------- component ---------------- */
const CoursesOffered = () => {
  // master caches from localStorage
  const [lsStudents, setLsStudents] = useState([]);
  const [lsTeachers, setLsTeachers] = useState([]);
  const teacherById = useMemo(() => {
    const m = new Map();
    for (const t of lsTeachers.map(normalizeTeacher)) m.set(t._id, t);
    return m;
  }, [lsTeachers]);

  // courses
  const [courses, setCourses] = useState(
    () =>
      readJSON("tdb_courses_for_teacher") ||
      readJSON("tdb_courses_for_admin") ||
      []
  );
  const [query, setQuery] = useState("");
  const [expandedCourse, setExpandedCourse] = useState(null);

  // views
  const [view, setView] = useState("courses"); // courses | manage | assessment
  const [currentCourseId, setCurrentCourseId] = useState("");
  const [batchesByCourse, setBatchesByCourse] = useState({});
  const [selectedBatch, setSelectedBatch] = useState(null);

  // modal
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState({
    batchId: "",
    type: "Quiz",
    title: "",
    description: "",
    date: "",
    totalMarks: "",
  });

  // marks editing
  const [marksDraft, setMarksDraft] = useState({});
  const [marksDirty, setMarksDirty] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  // add student to batch
  const [addStudentId, setAddStudentId] = useState("");

  /* --------- bootstrap from localStorage, then (optional) API fallback for courses --------- */
  useEffect(() => {
    // load all students/teachers from localStorage
    const s = readArrayFromKeys(STUDENT_KEYS).map(normalizeStudent);
    const t = readArrayFromKeys(TEACHER_KEYS).map(normalizeTeacher);
    console.log(s);
    console.log(t);
    setLsStudents(s);
    setLsTeachers(t);

    // if courses already present in LS, enrich teacher field from lsTeachers
    if (Array.isArray(courses) && courses.length) {
      setCourses((prev) =>
        prev.map((c) => ({
          ...c,
          _id: normId(c),
          teacher:
            typeof c.teacher === "string"
              ? teacherById.get(c.teacher) || { _id: c.teacher, name: "—" }
              : normalizeTeacher(c.teacher),
          students:
            Array.isArray(c.students) && c.students.length
              ? c.students.map(normalizeStudent)
              : s, // IMPORTANT: use all LS students if roster is empty
        }))
      );
      return;
    }

    // otherwise, try hydrating from dashboard/admin and still fallback to LS students on empty rosters
    (async () => {
      const fetchJSON = async (url, opts = {}) => {
        const isGet = !opts.method || opts.method.toUpperCase() === "GET";
        const bust = isGet
          ? (url.includes("?") ? "&" : "?") + "t=" + Date.now()
          : "";
        const res = await fetch(url + bust, {
          ...opts,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token()}`,
            ...(opts.headers || {}),
          },
          credentials: "include",
        });
        if (!res.ok)
          throw new Error(
            await res.text().catch(() => `${res.status} ${res.statusText}`)
          );
        return res.json();
      };

      let dashCourses = [];
      try {
        const dash = await fetchJSON(`${API_BASE}/api/v1/teacher/dashboard`);
        dashCourses = dash?.data?.courses || [];
      } catch {}

      let adminCourses = [];
      if (!dashCourses.length) {
        try {
          const admin = await fetchJSON(`${API_BASE}/api/v1/admin/courses`);
          adminCourses = admin?.data || [];
        } catch {}
      }

      const raw = dashCourses.length ? dashCourses : adminCourses;
      const hydrated = (raw || []).map((c) => ({
        _id: normId(c),
        name: c?.name || "Untitled Course",
        code: c?.code || "",
        teacher:
          typeof c?.teacher === "string"
            ? teacherById.get(c.teacher) || { _id: c.teacher, name: "—" }
            : normalizeTeacher(c?.teacher),
        description: c?.description || "",
        // IMPORTANT: if API roster empty, use ALL LS students so creation works
        students: (Array.isArray(c?.students) && c.students.length
          ? c.students
          : s
        ).map(normalizeStudent),
      }));

      if (hydrated.length) {
        setCourses(hydrated);
        localStorage.setItem(
          "tdb_courses_for_teacher",
          JSON.stringify(hydrated)
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- search ---------------- */
  const filtered = useMemo(() => {
    if (!query.trim()) return courses;
    const q = query.toLowerCase();
    return (courses || []).filter((c) => {
      const name = (c?.name || "").toLowerCase();
      const code = (c?.code || "").toLowerCase();
      const tch = (c?.teacher?.name || "").toLowerCase();
      return name.includes(q) || code.includes(q) || tch.includes(q);
    });
  }, [query, courses]);

  const courseById = (id) =>
    (courses || []).find((c) => String(c._id) === String(id));

  /* ---------------- API helpers (with cache-bust) ---------------- */
  const fetchJSON = async (url, opts = {}) => {
    const isGet = !opts.method || opts.method.toUpperCase() === "GET";
    const bust = isGet
      ? (url.includes("?") ? "&" : "?") + "t=" + Date.now()
      : "";
    const res = await fetch(url + bust, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
        ...(opts.headers || {}),
      },
      credentials: "include",
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(
        `${res.status} ${res.statusText} — ${t || "Request failed"}`
      );
    }
    return res.json();
  };

  /* ---------------- Assessments ---------------- */
  const loadCourseBatches = async (courseId) => {
    const data = await fetchJSON(
      `${API_BASE}/api/v1/assessments/course/${courseId}`
    );
    setBatchesByCourse((p) => ({ ...p, [courseId]: data?.data || [] }));
  };

  const loadBatch = async (batchId) => {
    const data = await fetchJSON(`${API_BASE}/api/v1/assessments/${batchId}`);
    const batch = data?.data;
    // add createdByRole if present in summaries
    const sums = batchesByCourse[batch.courseId] || [];
    const sum = sums.find((s) => s.batchId === batch.batchId);
    const createdByRole = sum?.createdByRole || batch?.createdByRole || null;

    setSelectedBatch({ ...batch, createdByRole });
    const draft = {};
    (batch.entries || []).forEach((e) => {
      draft[e.studentId] = { marks: e.marks ?? "", remarks: e.remarks ?? "" };
    });
    setMarksDraft(draft);
    setMarksDirty(false);
    setAddStudentId("");
    setView("assessment");
  };

  const submitAssessmentForm = async (e) => {
    e.preventDefault();
    const course = courseById(currentCourseId);
    if (!course) return;

    // Always build entries from the *best available roster*:
    // course.students if present, else ALL students from localStorage.
    const roster =
      Array.isArray(course.students) && course.students.length
        ? course.students
        : lsStudents;

    if (mode === "create") {
      const entries = roster.map((s) => ({
        studentId: s._id,
        marks: 0,
        remarks: "",
      }));
      const payload = {
        courseId: currentCourseId,
        type: form.type,
        title: form.title,
        description: form.description,
        date: form.date,
        totalMarks: Number(form.totalMarks),
        entries,
      };
      const res = await fetchJSON(`${API_BASE}/api/v1/assessments`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setShowModal(false);
      await loadCourseBatches(currentCourseId);
      await loadBatch(res.data.batchId); // ✅ now exists because entries weren’t empty
      return;
    }

    // edit meta
    const payload = {
      type: form.type,
      title: form.title,
      description: form.description,
      date: form.date,
      totalMarks: Number(form.totalMarks),
    };
    await fetchJSON(`${API_BASE}/api/v1/assessments/${form.batchId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    setShowModal(false);
    await loadCourseBatches(currentCourseId);
    if (selectedBatch?.batchId === form.batchId) await loadBatch(form.batchId);
  };

  const saveMarks = async () => {
    if (!selectedBatch) return;
    setSavingMarks(true);
    try {
      const entries = Object.entries(marksDraft).map(([studentId, v]) => ({
        studentId,
        marks: Number(v.marks || 0),
        remarks: v.remarks || "",
      }));
      const res = await fetchJSON(
        `${API_BASE}/api/v1/assessments/${selectedBatch.batchId}/marks`,
        {
          method: "PUT",
          body: JSON.stringify({ entries }),
        }
      );
      setSelectedBatch({ ...selectedBatch, entries: res.data.entries });
      setMarksDirty(false);
      alert("Marks saved ✅");
    } catch (e) {
      alert(e.message || "Failed to save marks");
    } finally {
      setSavingMarks(false);
    }
  };

  const deleteBatch = async (batchId) => {
    if (!confirm("Delete this assessment? This removes all student rows."))
      return;
    await fetchJSON(`${API_BASE}/api/v1/assessments/${batchId}`, {
      method: "DELETE",
    });
    await loadCourseBatches(currentCourseId);
    if (selectedBatch?.batchId === batchId) setView("manage");
  };

  const removeStudentFromBatch = async (studentId) => {
    if (!selectedBatch) return;
    if (!confirm("Remove this student from the assessment?")) return;
    await fetchJSON(
      `${API_BASE}/api/v1/assessments/${selectedBatch.batchId}/student/${studentId}`,
      { method: "DELETE" }
    );
    await loadBatch(selectedBatch.batchId);
  };

  const addStudentToBatch = async () => {
    if (!selectedBatch || !addStudentId) return;
    await fetchJSON(
      `${API_BASE}/api/v1/assessments/${selectedBatch.batchId}/marks`,
      {
        method: "PUT",
        body: JSON.stringify({
          entries: [{ studentId: addStudentId, marks: 0, remarks: "" }],
        }),
      }
    );
    setAddStudentId("");
    await loadBatch(selectedBatch.batchId);
  };

  /* ---------------- UI handlers ---------------- */
  const toggleExpand = async (courseId) => {
    setExpandedCourse((prev) => {
      const next = prev === courseId ? null : courseId;
      if (next === courseId) loadCourseBatches(courseId);
      return next;
    });
  };
  const openCreate = (courseId) => {
    setCurrentCourseId(courseId);
    setMode("create");
    setForm({
      batchId: "",
      type: "Quiz",
      title: "",
      description: "",
      date: new Date().toISOString().slice(0, 10),
      totalMarks: "",
    });
    setShowModal(true);
  };
  const openEdit = (courseId, summary) => {
    setCurrentCourseId(courseId);
    setMode("edit");
    setForm({
      batchId: summary.batchId,
      type: (summary.type || "").replace(/^\w/, (c) => c.toUpperCase()),
      title: summary.title || "",
      description: summary.description || "",
      date: summary.date ? String(summary.date).slice(0, 10) : "",
      totalMarks: summary.totalMarks ?? "",
    });
    setShowModal(true);
  };
  const goManage = () => setView("manage");

  const onChangeMark = (studentId, field, value) => {
    setMarksDraft((p) => ({
      ...p,
      [studentId]: { ...p[studentId], [field]: value },
    }));
    setMarksDirty(true);
  };

  /* ---------------- helpers for assessment view ---------------- */
  const currentCourse = courseById(
    selectedBatch?.courseId || currentCourseId
  ) || { students: [] };
  const roster = currentCourse.students || [];
  const inBatch = new Set(
    (selectedBatch?.entries || []).map((e) => String(e.studentId))
  );
  const missingStudents = roster.filter((s) => !inBatch.has(String(s._id)));

  const CreatorChip = ({ role }) =>
    role ? (
      <span className={`creator-chip ${role}`}>
        By: {role[0].toUpperCase() + role.slice(1)}
      </span>
    ) : null;

  /* ---------------- renders ---------------- */
  const renderCourses = () => (
    <div className="courses-grid">
      {filtered.length === 0 ? (
        <div className="no-courses">
          <MdAssessment size={48} />
          <p>No courses found.</p>
        </div>
      ) : (
        filtered.map((course) => {
          const isExpanded = expandedCourse === course._id;
          const summaries = batchesByCourse[course._id] || [];
          // ensure teacher object from LS if course holds only an id
          const teacher =
            typeof course.teacher === "string"
              ? teacherById.get(course.teacher) || {
                  _id: course.teacher,
                  name: "—",
                }
              : course.teacher;
          return (
            <div
              key={course._id}
              className={`course-card ${isExpanded ? "expanded" : ""}`}
            >
              <div
                className="course-card-header"
                onClick={() => toggleExpand(course._id)}
              >
                <div className="course-info">
                  <h3>{course.name}</h3>
                  <p>
                    {course.code} • {teacher?.name || "—"}
                  </p>
                </div>
                <div className="course-stats">
                  <span className="students-count">
                    {(course.students || []).length} students
                  </span>
                  {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
                </div>
              </div>

              {isExpanded && (
                <div className="course-details">
                  <div className="detail-section">
                    <h4>Course Details</h4>
                    <p>{course.description || "—"}</p>
                  </div>

                  <div className="detail-section">
                    <div className="detail-header-flex">
                      <h4>Assessments</h4>
                      <button
                        className="btn primary"
                        onClick={() => openCreate(course._id)}
                      >
                        <MdAdd /> Create Assessment
                      </button>
                    </div>

                    {summaries.length === 0 ? (
                      <div className="empty-strip">No assessments yet.</div>
                    ) : (
                      <div className="assessments-list modern">
                        {summaries.map((a) => (
                          <div key={a.batchId} className="assessment-row">
                            <div className="assessment-meta">
                              <div className="badge">
                                {(a.type || "").toUpperCase()}
                              </div>
                              <div className="ttl">{a.title || "Untitled"}</div>
                              <div className="muted">
                                {a.date ? String(a.date).slice(0, 10) : "-"}
                              </div>
                              <div className="muted">
                                Total: {a.totalMarks ?? "-"}
                              </div>
                              <CreatorChip role={a.createdByRole} />
                            </div>
                            <div className="assessment-actions">
                              <button
                                className="btn"
                                onClick={() => loadBatch(a.batchId)}
                              >
                                View
                              </button>
                              <button
                                className="btn ghost"
                                onClick={() => openEdit(course._id, a)}
                                title="Edit meta"
                              >
                                <MdEdit /> Edit
                              </button>
                              <button
                                className="btn danger"
                                onClick={() => deleteBatch(a.batchId)}
                              >
                                <MdDelete /> Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  const renderManage = () => (
    <div className="assessment-management">
      <div className="management-header">
        <button className="back-btn" onClick={() => setView("courses")}>
          <MdArrowBack /> Back to Courses
        </button>
        <h2>Assessment Management</h2>
      </div>

      <div className="courses-list-management">
        {(courses || []).map((c) => {
          const list = batchesByCourse[c._id] || [];
          const teacher =
            typeof c.teacher === "string"
              ? teacherById.get(c.teacher) || { _id: c.teacher, name: "—" }
              : c.teacher;
          return (
            <div key={c._id} className="management-course-card">
              <div className="manage-head">
                <div>
                  <h3>
                    {c.name} ({c.code})
                  </h3>
                  <p>Teacher: {teacher?.name || "—"}</p>
                  <p>Students: {(c.students || []).length}</p>
                </div>
                <button
                  className="btn primary"
                  onClick={() => openCreate(c._id)}
                >
                  <MdAdd /> Create Assessment
                </button>
              </div>

              {list.length === 0 ? (
                <div className="empty-strip">
                  No assessments created for this course.
                </div>
              ) : (
                <div className="assessments-list">
                  {list.map((a) => (
                    <div key={a.batchId} className="management-assessment-item">
                      <div className="assessment-summary">
                        <h5>
                          <span className="badge">
                            {(a.type || "").toUpperCase()}
                          </span>{" "}
                          {a.title}
                        </h5>
                        <p>
                          Date: {a.date ? String(a.date).slice(0, 10) : "-"} |
                          Total Marks: {a.totalMarks ?? "-"}
                        </p>
                        <CreatorChip role={a.createdByRole} />
                      </div>
                      <div className="management-actions">
                        <button
                          className="btn"
                          onClick={() => loadBatch(a.batchId)}
                        >
                          View
                        </button>
                        <button
                          className="btn ghost"
                          onClick={() => openEdit(c._id, a)}
                        >
                          <MdEdit /> Edit
                        </button>
                        <button
                          className="btn danger"
                          onClick={() => deleteBatch(a.batchId)}
                        >
                          <MdDelete /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAssessmentView = () => {
    if (!selectedBatch) return null;
    const course = courseById(selectedBatch.courseId) || {};
    return (
      <div className="assessment-view">
        <div className="view-header">
          <button className="back-btn" onClick={() => setView("manage")}>
            <MdArrowBack /> Back to Management
          </button>
          <h2>
            {(selectedBatch.meta?.type || "").toUpperCase()}:{" "}
            {selectedBatch.meta?.title}
          </h2>
          <CreatorChip role={selectedBatch.createdByRole} />
        </div>

        <div className="assessment-details-view">
          <div className="detail-card">
            <h3>Assessment Information</h3>
            <div className="info-grid">
              <div>
                <strong>Course:</strong> {course?.name} ({course?.code})
              </div>
              <div>
                <strong>Date:</strong>{" "}
                {selectedBatch.meta?.date
                  ? String(selectedBatch.meta.date).slice(0, 10)
                  : "-"}
              </div>
              <div>
                <strong>Total Marks:</strong>{" "}
                {selectedBatch.meta?.totalMarks ?? "-"}
              </div>
            </div>
            <p className="mt8">
              <strong>Description: </strong>
              {selectedBatch.meta?.description || "—"}
            </p>

            {missingStudents.length > 0 && (
              <div className="mt8">
                <label className="mr8">
                  <strong>Add student:</strong>
                </label>
                <select
                  value={addStudentId}
                  onChange={(e) => setAddStudentId(e.target.value)}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                  }}
                >
                  <option value="">— Select —</option>
                  {missingStudents.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} • {s.email || ""} • {s.phone || ""}
                    </option>
                  ))}
                </select>
                <button
                  className="btn primary"
                  style={{ marginLeft: 8 }}
                  onClick={addStudentToBatch}
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <div className="detail-card">
            <h3>Students (Name • Email • Contact)</h3>
            <div className="students-roster">
              {(selectedBatch.entries || []).map((e) => (
                <div key={e.studentId} className="student-chip">
                  <MdPerson />
                  <div className="chip-main">
                    <div className="name">{e.name}</div>
                    <div className="small">
                      <span>{e.email || "—"}</span> •{" "}
                      <span>{e.phone || "—"}</span>
                    </div>
                  </div>
                  <button
                    className="icon-btn"
                    title="Remove from assessment"
                    onClick={() => removeStudentFromBatch(e.studentId)}
                  >
                    <MdDelete />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="students-marks-card">
            <div className="marks-head">
              <h3>Assessment Marks</h3>
              <div className="actions">
                <button
                  className="btn"
                  disabled={!marksDirty || savingMarks}
                  onClick={saveMarks}
                >
                  <MdSave /> {savingMarks ? "Saving…" : "Save Marks"}
                </button>
              </div>
            </div>

            <table className="marks-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th style={{ width: 140 }}>Marks</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {(selectedBatch.entries || []).map((e) => (
                  <tr key={e.studentId}>
                    <td>
                      <div className="stud-cell">
                        <MdPerson /> <span>{e.name}</span>
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        max={Number(selectedBatch.meta?.totalMarks || 9999)}
                        value={marksDraft?.[e.studentId]?.marks ?? ""}
                        onChange={(ev) =>
                          onChangeMark(e.studentId, "marks", ev.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={marksDraft?.[e.studentId]?.remarks ?? ""}
                        onChange={(ev) =>
                          onChangeMark(e.studentId, "remarks", ev.target.value)
                        }
                        placeholder="Optional"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {marksDirty && (
              <div className="dirty-note">
                Unsaved changes — click <strong>Save Marks</strong>.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ---------------- page ---------------- */
  return (
    <div className="courses-container">
      <div className="courses-header">
        <h2>
          Assessment Management <span className="role-chip">{currentRole}</span>
        </h2>
        {view === "courses" ? (
          <button className="management-btn" onClick={() => setView("manage")}>
            <MdGrade /> Go to Management
          </button>
        ) : (
          <div />
        )}
      </div>

      <div className="sub-header">
        <div className="search-bar">
          <MdSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search course, code or teacher…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {view === "courses" && renderCourses()}
      {view === "manage" && renderManage()}
      {view === "assessment" && renderAssessmentView()}

      {/* Create/Edit modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title-row">
              <h3>
                {mode === "create" ? "Create Assessment" : "Edit Assessment"}
              </h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}>
                <MdClose size={20} />
              </button>
            </div>

            <form onSubmit={submitAssessmentForm}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, type: e.target.value }))
                    }
                    required
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Title</label>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="e.g., Midterm Exam"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Total Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={form.totalMarks}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, totalMarks: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Brief description or instructions"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  {mode === "create" ? "Create" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesOffered;
