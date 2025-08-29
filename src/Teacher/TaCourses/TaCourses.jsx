// components/CoursesOffered.jsx
import React, { useEffect, useMemo, useState } from "react";

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

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://vigilant-moser.210-56-25-68.plesk.page/api/v1";
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
        const dash = await fetchJSON(`${API_BASE}/teacher/dashboard`);
        dashCourses = dash?.data?.courses || [];
      } catch {}

      let adminCourses = [];
      if (!dashCourses.length) {
        try {
          const admin = await fetchJSON(`${API_BASE}/admin/courses`);
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
    const data = await fetchJSON(`${API_BASE}/assessments/course/${courseId}`);
    setBatchesByCourse((p) => ({ ...p, [courseId]: data?.data || [] }));
  };

  const loadBatch = async (batchId) => {
    const data = await fetchJSON(`${API_BASE}/assessments/${batchId}`);
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
      const res = await fetchJSON(`${API_BASE}/assessments`, {
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
    await fetchJSON(`${API_BASE}/assessments/${form.batchId}`, {
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
        `${API_BASE}/assessments/${selectedBatch.batchId}/marks`,
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
    await fetchJSON(`${API_BASE}/assessments/${batchId}`, {
      method: "DELETE",
    });
    await loadCourseBatches(currentCourseId);
    if (selectedBatch?.batchId === batchId) setView("manage");
  };

  const removeStudentFromBatch = async (studentId) => {
    if (!selectedBatch) return;
    if (!confirm("Remove this student from the assessment?")) return;
    await fetchJSON(
      `${API_BASE}/assessments/${selectedBatch.batchId}/student/${studentId}`,
      { method: "DELETE" }
    );
    await loadBatch(selectedBatch.batchId);
  };

  const addStudentToBatch = async () => {
    if (!selectedBatch || !addStudentId) return;
    await fetchJSON(`${API_BASE}/assessments/${selectedBatch.batchId}/marks`, {
      method: "PUT",
      body: JSON.stringify({
        entries: [{ studentId: addStudentId, marks: 0, remarks: "" }],
      }),
    });
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
    <>
    <style>{`/* Container + header */
.courses-container {
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f6f8fb;
  min-height: 100vh;
}

.courses-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.courses-header h2 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1f2937;
  letter-spacing: 0.2px;
}

.management-btn,
.btn.primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #4f46e5;
  color: #fff;
  border: 0;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.25);
}

.management-btn:hover,
.btn.primary:hover {
  filter: brightness(0.95);
}

/* Search row */
.sub-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin: 0.5rem 0 1.25rem 0;
}

.search-bar {
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0.65rem 0.9rem;
  border-radius: 12px;
  width: 360px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.search-icon {
  margin-right: 8px;
  color: #6b7280;
}

.search-bar input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  font-size: 0.98rem;
}

/* Courses grid */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1.25rem;
}

.course-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  transition: box-shadow .2s ease, transform .2s ease;
}

.course-card:hover {
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.course-card.expanded {
  box-shadow: 0 20px 32px rgba(0, 0, 0, 0.1);
}

.course-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.1rem 1.2rem;
  cursor: pointer;
  background: #fff;
}

.course-info h3 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  color: #111827;
  font-weight: 700;
}

.course-info p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.course-stats {
  display: flex;
  align-items: center;
  gap: 10px;
}

.students-count {
  background: #eef2ff;
  color: #4f46e5;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
}

.course-details {
  padding: 0 1.2rem 1.2rem 1.2rem;
  border-top: 1px solid #f1f5f9;
  animation: sd .2s ease-out;
}

@keyframes sd {
  from {
    opacity: 0;
    transform: translateY(-6px)
  }

  to {
    opacity: 1;
    transform: translateY(0)
  }
}

.detail-section {
  margin-top: 1rem;
}

.detail-section h4 {
  margin: 0 0 8px 0;
  color: #111827;
  font-size: 1rem;
  font-weight: 800;
}

.detail-section p {
  margin: 0 0 8px 0;
  color: #374151;
  line-height: 1.55;
}

.detail-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Assessment cards/list */
.assessments-list.modern {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.assessment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fbfdff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
}

.assessment-meta {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto;
  gap: 4px 12px;
  align-items: center;
}

.assessment-meta .badge {
  background: #ecfeff;
  color: #0891b2;
  font-weight: 800;
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #cffafe;
  grid-column: 1 / 2;
}

.assessment-meta .ttl {
  font-weight: 700;
  color: #0f172a;
  grid-column: 2 / 3;
}

.assessment-meta .muted {
  color: #64748b;
  font-size: 0.85rem;
  grid-column: 2 / 3;
}

.assessment-actions {
  display: flex;
  gap: 8px;
}

/* Buttons */
.btn {
  background: #f8fafc;
  color: #111827;
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

.btn:hover {
  background: #eef2f7;
}

.btn.ghost {
  background: #fff;
}

.btn.danger {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fecaca;
}

.btn.danger:hover {
  filter: brightness(0.98);
}

.icon-btn {
  background: transparent;
  border: 0;
  cursor: pointer;
  color: #6b7280;
}

.icon-btn:hover {
  color: #111827;
}

/* Empty */
.empty-strip {
  border: 1px dashed #cbd5e1;
  color: #475569;
  background: #f8fafc;
  padding: 12px;
  border-radius: 12px;
  font-size: 0.92rem;
}

/* Management page */
.assessment-management {
  padding: 8px;
}

.management-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #6b7280;
  color: #fff;
  border: 0;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
}

.courses-list-management {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.management-course-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.manage-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Assessment View */
.assessment-view {
  padding: 8px;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.assessment-details-view {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 980px) {
  .assessment-details-view {
    grid-template-columns: 1.2fr 1.8fr;
  }
}

.detail-card,
.students-marks-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
  margin-bottom: 8px;
}

.mt8 {
  margin-top: 8px;
}

/* Students roster chips */
.students-roster {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

@media (min-width: 700px) {
  .students-roster {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1100px) {
  .students-roster {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

.student-chip {
  display: flex;
  gap: 10px;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px;
  background: #fcfdff;
}

.student-chip .chip-main {
  display: flex;
  flex-direction: column;
}

.student-chip .name {
  font-weight: 700;
  color: #111827;
}

.student-chip .small {
  color: #6b7280;
  font-size: 0.88rem;
}

/* Marks table */
.marks-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.marks-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.marks-table th,
.marks-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.marks-table th {
  background: #f8fafc;
  font-weight: 800;
  color: #111827;
}

.stud-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.marks-table input {
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
}

.marks-table input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, .15);
}

.dirty-note {
  margin-top: 10px;
  font-size: 0.92rem;
  color: #92400e;
  background: #fff7ed;
  border: 1px solid #ffedd5;
  padding: 8px 10px;
  border-radius: 10px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn .15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0
  }

  to {
    opacity: 1
  }
}

.modal {
  background: white;
  padding: 18px;
  border-radius: 16px;
  width: 560px;
  max-width: 92%;
  box-shadow: 0 22px 44px rgba(0, 0, 0, 0.2);
  animation: scaleIn .15s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(.95)
  }

  to {
    opacity: 1;
    transform: scale(1)
  }
}

.modal-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  color: #111827;
  font-weight: 700;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 0.98rem;
}

.form-group textarea {
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}

.modal-actions button {
  padding: 10px 14px;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  background: #f3f4f6;
  color: #111827;
}

.modal-actions button.primary {
  background: #4f46e5;
  color: #fff;
}

.modal-actions button.primary:hover {
  filter: brightness(0.95);
}

/* Responsive tweaks */
@media (max-width: 768px) {
  .courses-container {
    padding: 1rem;
  }

  .courses-grid {
    grid-template-columns: 1fr;
  }

  .search-bar {
    width: 100%;
  }
}

.role-chip {
  margin-left: 8px;
  background: #eef2ff;
  color: #4f46e5;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  border: 1px solid #dbeafe;
}

.creator-chip {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  border: 1px solid #e5e7eb;
  color: #334155;
  background: #f8fafc;
}

.creator-chip.admin,
.creator-chip.principal {
  background: #f0fdf4;
  color: #166534;
  border-color: #bbf7d0;
}

.creator-chip.teacher {
  background: #fff7ed;
  color: #9a3412;
  border-color: #fed7aa;
}

.mr8 {
  margin-right: 8px;
}`}</style>
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
</>

  );
};

export default CoursesOffered;
