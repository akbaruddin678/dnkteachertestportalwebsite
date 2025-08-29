"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE =
  import.meta.env?.VITE_API_BASE ||
  "https://vigilant-moser.210-56-25-68.plesk.page/api/v1";
const token = () => localStorage.getItem("token");

const fetchJSON = async (url) => {
  const bust = url.includes("?") ? "&" : "?";
  const res = await fetch(`${url}${buster(bust)}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
    credentials: "include",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      `${res.status} ${res.statusText} — ${txt || "Request failed"}`
    );
  }
  return res.json();
};
const buster = (join) => `${join}t=${Date.now()}`;

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

const safeDate = (d) => (d ? String(d).slice(0, 10) : "");

const normId = (v) => v?._id || v?.id || String(v || "");

/** ====== Normalizers ====== */

// Attendance: normalize to {present: [student], absent:[student]} with student {_id,name,email,phone}
function normalizeAttendancePayload(payload, roster = []) {
  const d = payload?.data ?? payload ?? {};
  const rosterMap = new Map(
    (Array.isArray(roster) ? roster : []).map((s) => [String(normId(s)), s])
  );

  const pickStudent = (raw) => {
    const s = raw?.student || raw?.user || raw;
    const id = String(normId(s));
    // prefer roster info for consistent name/email/phone
    const base = rosterMap.get(id) || s || {};
    return {
      _id: normId(base),
      name: base?.name || base?.fullName || "—",
      email: base?.email || "",
      phone: base?.phone || base?.contactNumber || "",
    };
  };

  let present = [];
  let absent = [];

  // Case A: { records: [ { student, status:'present'|'absent' } ] }
  if (Array.isArray(d.records)) {
    for (const r of d.records) {
      const status = String(
        r?.status ?? (r?.present ? "present" : "absent")
      ).toLowerCase();
      if (status === "present" || r?.present === true || r?.attended === true) {
        present.push(pickStudent(r));
      } else {
        absent.push(pickStudent(r));
      }
    }
  }
  // Case B: { present:[student|id], absent:[student|id] }
  else if (Array.isArray(d.present) || Array.isArray(d.absent)) {
    present = (d.present || []).map(pickStudent);
    absent = (d.absent || []).map(pickStudent);
  }
  // Case C: Array of rows with boolean (e.g., [{student, present:true/false}])
  else if (Array.isArray(d)) {
    for (const r of d) {
      if (r?.present === true || r?.attended === true)
        present.push(pickStudent(r));
      else absent.push(pickStudent(r));
    }
  }
  // Case D: Only counts; no student list
  else if (
    typeof d.presentCount === "number" &&
    typeof d.absentCount === "number"
  ) {
    // Create synthetic rows from roster so UI can still show something
    const total = d.presentCount + d.absentCount;
    const firstN = (arr, n) => arr.slice(0, Math.max(0, n));
    const pres = firstN(roster, d.presentCount).map(pickStudent);
    const rest = roster.filter(
      (s) => !pres.find((x) => String(x._id) === String(normId(s)))
    );
    const abs = firstN(rest, d.absentCount).map(pickStudent);
    present = pres;
    absent = abs;
  }

  // Ensure uniqueness (some backends can duplicate entries)
  const uniqById = (arr) => {
    const seen = new Set();
    return arr.filter((x) => {
      const id = String(x._id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };

  present = uniqById(present);
  absent = uniqById(absent);

  return { present, absent };
}

// Lesson plan ➜ lecture row
function normalizeLesson(l) {
  return {
    id: normId(l),
    teacherName: l?.teacher?.name || l?.teacherName || "—",
    course: l?.course?.name || l?.courseName || "—",
    topic: l?.title || l?.topic || "—",
    date: safeDate(l?.date || l?.scheduledDate || l?.createdAt),
    duration: l?.duration || l?.length || "—",
    city: l?.campus?.city || l?.campusCity || "",
    institute: l?.campus?.name || l?.campusName || "",
    raw: l,
  };
}

// Assessment summary item (from /assessments/course/:courseId)
function normalizeAssessmentSummary(a) {
  return {
    batchId: a?.batchId,
    type: (a?.type || "").toUpperCase(),
    title: a?.title || "Untitled",
    date: safeDate(a?.date),
    totalMarks: a?.totalMarks ?? "-",
    count: a?.count ?? undefined,
    createdByRole: a?.createdByRole || "",
  };
}

// Assessment batch details (from /assessments/:batchId)
function normalizeAssessmentBatch(b) {
  const entries = Array.isArray(b?.entries) ? b.entries : [];
  const meta = b?.meta || {};
  return {
    batchId: b?.batchId,
    courseId: b?.courseId,
    meta: {
      title: meta?.title || "Untitled",
      type: (meta?.type || "").toUpperCase(),
      date: safeDate(meta?.date),
      totalMarks: Number(meta?.totalMarks ?? 0),
      description: meta?.description || "",
    },
    entries: entries.map((e) => ({
      id: String(e?.studentId),
      name: e?.name || "—",
      email: e?.email || "",
      marks: Number(e?.marks ?? 0),
      remarks: e?.remarks || "",
    })),
  };
}

const Reports = () => {
  const [activeTab, setActiveTab] = useState("attendance"); // attendance | lecture | assessments

  // Filters
  const [filters, setFilters] = useState({
    course: "",
    teacher: "",
    date: safeDate(new Date()),
    city: "",
    institute: "",
  });

  // Dashboard base
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [teacher, setTeacher] = useState(null);
  const [campus, setCampus] = useState(null);
  const [courses, setCourses] = useState([]);
  const [studentsByCourse, setStudentsByCourse] = useState(new Map()); // courseId -> roster[]

  // Attendance state
  const [attLoading, setAttLoading] = useState(false);
  const [attendanceRows, setAttendanceRows] = useState([]); // per-course summary rows
  const [selectedClass, setSelectedClass] = useState(null); // { courseName, present[], absent[] }
  const [selectedStudentStatus, setSelectedStudentStatus] = useState(null); // "Present" | "Absent" | null

  // Lecture state
  const [lecLoading, setLecLoading] = useState(false);
  const [lectureRows, setLectureRows] = useState([]);

  // Assessment state
  const [asmLoading, setAsmLoading] = useState(false);
  const [assessmentRows, setAssessmentRows] = useState([]); // summaries across all courses
  const [selectedBatch, setSelectedBatch] = useState(null); // normalized batch details

  /* =======================
   * Bootstrap: dashboard
   * ======================= */
  useEffect(() => {
    (async () => {
      if (!token()) {
        setErr("Missing token. Please sign in.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setErr("");
      try {
        const dash = await fetchJSON(`${API_BASE}/teacher/dashboard`);
        const d = dash?.data || {};
        const myCourses = Array.isArray(d.courses) ? d.courses : [];
        setTeacher(d.teacher || null);
        setCampus(d.campus || null);
        setCourses(myCourses);

        // Build a courseId -> roster map (fallback to global campus students if courses[].students empty)
        const campusStudents = Array.isArray(d.students) ? d.students : [];
        const map = new Map();
        for (const c of myCourses) {
          const roster =
            Array.isArray(c?.students) && c.students.length
              ? c.students
              : campusStudents;
          map.set(String(normId(c)), roster);
        }
        setStudentsByCourse(map);
      } catch (e) {
        setErr(e.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* =======================
   * Attendance fetch
   * ======================= */
  const loadAttendance = async (dateStr) => {
    if (!courses.length) {
      setAttendanceRows([]);
      return;
    }
    setAttLoading(true);
    setSelectedClass(null);
    setSelectedStudentStatus(null);
    try {
      // Fetch per course, normalize, compute summary rows
      const results = await Promise.allSettled(
        courses.map(async (c) => {
          const courseId = normId(c);
          const roster = studentsByCourse.get(String(courseId)) || [];
          const resp = await fetchJSON(
            `${API_BASE}/attendance/course/${courseId}?date=${dateStr}`
          );
          const { present, absent } = normalizeAttendancePayload(resp, roster);
          const total = roster.length || present.length + absent.length;
          return {
            courseId,
            courseName: c?.name || "Untitled Course",
            teacherName: c?.teacher?.name || "—",
            date: dateStr,
            city: campus?.location || "",
            institute: campus?.name || "",
            presentCount: present.length,
            total,
            present,
            absent,
          };
        })
      );

      const rows = results
        .map((r, idx) => {
          const c = courses[idx];
          if (r.status === "fulfilled") return r.value;
          // On failure, still create a row with zero present (so table stays aligned)
          const roster = studentsByCourse.get(String(normId(c))) || [];
          return {
            courseId: normId(c),
            courseName: c?.name || "Untitled Course",
            teacherName: c?.teacher?.name || "—",
            date: dateStr,
            city: campus?.location || "",
            institute: campus?.name || "",
            presentCount: 0,
            total: roster.length,
            present: [],
            absent: roster,
            error: r.reason?.message || "Failed",
          };
        })
        // Optional: filter by selects (course/city/institute)
        .filter((rec) => {
          const f = filters;
          if (
            f.course &&
            !rec.courseName.toLowerCase().includes(f.course.toLowerCase())
          )
            return false;
          if (f.city && !rec.city.toLowerCase().includes(f.city.toLowerCase()))
            return false;
          if (
            f.institute &&
            !rec.institute.toLowerCase().includes(f.institute.toLowerCase())
          )
            return false;
          if (
            f.teacher &&
            !rec.teacherName.toLowerCase().includes(f.teacher.toLowerCase())
          )
            return false;
          return true;
        });

      setAttendanceRows(rows);
    } finally {
      setAttLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "attendance" && filters.date) {
      loadAttendance(filters.date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters.date, courses.length]);

  /* =======================
   * Lectures (lesson plans)
   * ======================= */
  const loadLectures = async () => {
    setLecLoading(true);
    try {
      const lp = await fetchJSON(`${API_BASE}/lesson-plans?page=1&limit=100`);
      const list = Array.isArray(lp?.data?.docs)
        ? lp.data.docs
        : Array.isArray(lp?.data)
        ? lp.data
        : [];
      const rows = list.map(normalizeLesson).filter((r) => {
        if (
          filters.course &&
          !r.course.toLowerCase().includes(filters.course.toLowerCase())
        )
          return false;
        if (
          filters.teacher &&
          !r.teacherName.toLowerCase().includes(filters.teacher.toLowerCase())
        )
          return false;
        if (
          filters.city &&
          r.city &&
          !r.city.toLowerCase().includes(filters.city.toLowerCase())
        )
          return false;
        if (
          filters.institute &&
          r.institute &&
          !r.institute.toLowerCase().includes(filters.institute.toLowerCase())
        )
          return false;
        if (filters.date && r.date && r.date !== filters.date) return false;
        return true;
      });
      setLectureRows(rows);
    } finally {
      setLecLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "lecture") loadLectures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, JSON.stringify(filters)]);

  /* =======================
   * Assessments
   * ======================= */
  const loadAssessments = async () => {
    if (!courses.length) {
      setAssessmentRows([]);
      return;
    }
    setAsmLoading(true);
    setSelectedBatch(null);
    try {
      const results = await Promise.allSettled(
        courses.map(async (c) => {
          const courseId = normId(c);
          const resp = await fetchJSON(
            `${API_BASE}/assessments/course/${courseId}`
          );
          const arr = Array.isArray(resp?.data) ? resp.data : [];
          return arr.map((a) => ({
            ...normalizeAssessmentSummary(a),
            courseId,
            courseName: c?.name || "Untitled Course",
            teacherName: c?.teacher?.name || "—",
          }));
        })
      );

      const summaries = results.flatMap((r) =>
        r.status === "fulfilled" ? r.value : []
      );
      const filtered = summaries.filter((rec) => {
        if (
          filters.course &&
          !rec.courseName.toLowerCase().includes(filters.course.toLowerCase())
        )
          return false;
        if (
          filters.teacher &&
          !rec.teacherName.toLowerCase().includes(filters.teacher.toLowerCase())
        )
          return false;
        if (filters.date && rec.date && rec.date !== filters.date) return false;
        return true;
      });
      setAssessmentRows(filtered);
    } finally {
      setAsmLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "assessments") loadAssessments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, JSON.stringify(filters), courses.length]);

  const handleFilterChange = (field, value) => {
    setFilters((p) => ({ ...p, [field]: value }));
  };

  const handleClassClick = (row) => {
    setSelectedClass({
      courseId: row.courseId,
      courseName: row.courseName,
      present: row.present,
      absent: row.absent,
      date: row.date,
    });
    setSelectedStudentStatus(null);
  };

  const handleStudentStatusClick = (status) => {
    setSelectedStudentStatus(status); // "Present" or "Absent"
  };

  const openBatch = async (batchId) => {
    const resp = await fetchJSON(`${API_BASE}/assessments/${batchId}`);
    setSelectedBatch(normalizeAssessmentBatch(resp?.data));
  };

  /* ========== Derived ========== */
  const attendanceTable = attendanceRows.map((rec) => {
    const pct = rec.total ? (rec.presentCount / rec.total) * 100 : 0;
    return { ...rec, attendancePct: pct };
  });

  // Simple stats for selected assessment batch
  const batchStats = useMemo(() => {
    if (!selectedBatch?.entries?.length) return null;
    const arr = selectedBatch.entries.map((e) => e.marks);
    const sum = arr.reduce((a, b) => a + b, 0);
    const avg = sum / arr.length;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const total = selectedBatch.meta.totalMarks || 0;
    const passCount = arr.filter((x) =>
      total ? x >= total * 0.5 : x >= 50
    ).length; // naive 50% rule
    return { avg, median, min, max, passCount, totalStudents: arr.length };
  }, [selectedBatch]);

  return (
    <>
    <style>{`/* Reports.css - Improved UI for Reports Section */

.reports {
  padding: 40px;
  max-width: 1200px;
  margin: auto;
  background-color: #f4f8fc;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-family: 'Roboto', sans-serif;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 36px;
  color: #333;
  font-weight: 700;
}

.page-header p {
  font-size: 16px;
  color: #555;
  margin-top: 10px;
}

.reports-tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.tab-btn {
  padding: 12px 25px;
  font-size: 16px;
  cursor: pointer;
  border: 1px solid #1976d2;
  border-radius: 6px;
  background-color: #fff;
  color: #1976d2;
  transition: background-color 0.3s;
  margin: 0 10px;
}

.tab-btn:hover {
  background-color: #1976d2;
  color: #fff;
}

.tab-btn.active {
  background-color: #1976d2;
  color: white;
}

.filters-section {
  margin-bottom: 30px;
}

.filters-grid {
  display: flex;
  gap: 20px;
  justify-content: space-between;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group select,
.filter-group input {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ddd;
  font-size: 14px;
}

.report-table {
  width: 100%;
  margin-top: 20px;
}

.report-table table {
  width: 100%;
  border-collapse: collapse;
}

.report-table th,
.report-table td {
  padding: 12px;
  border: 1px solid #ddd;
  text-align: left;
}

.report-table th {
  background-color: #1976d2;
  color: white;
}

.status {
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 5px;
}

.status.present {
  background-color: #4caf50;
  color: white;
}

.status.absent {
  background-color: #f44336;
  color: white;
}
.reports-title {
  font-weight: 400;
  font-size: 3rem; 
  color: #0b0b0b;    
  /* margin-bottom: 4rem; */
}
`}</style>
    <div className="reports">
      <div className="page-header">
        <h1 className="reports-title">Reports</h1>
      </div>

      {/* Tabs */}
      <div className="reports-tabs">
        <button
          className={`tab-btn ${activeTab === "attendance" ? "active" : ""}`}
          onClick={() => setActiveTab("attendance")}
        >
          Attendance
        </button>
        <button
          className={`tab-btn ${activeTab === "lecture" ? "active" : ""}`}
          onClick={() => setActiveTab("lecture")}
        >
          Lecture Activity
        </button>
        <button
          className={`tab-btn ${activeTab === "assessments" ? "active" : ""}`}
          onClick={() => setActiveTab("assessments")}
        >
          Assessments
        </button>
      </div>

      {/* Filters */}
      {/* <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid"> */}
      {/* <div className="filter-group">
            <select
              value={filters.course}
              onChange={(e) => handleFilterChange("course", e.target.value)}
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={normId(c)} value={c.name || ""}>
                  {c.name || "Untitled Course"}
                </option>
              ))}
            </select>
          </div> */}

      {/* <div className="filter-group">
            <select
              value={filters.teacher}
              onChange={(e) => handleFilterChange("teacher", e.target.value)}
            >
              <option value="">All Teachers</option>
              {Array.from(
                new Map(
                  courses
                    .filter((c) => c?.teacher?.name)
                    .map((c) => [c.teacher.name, c.teacher.name])
                ).values()
              ).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div> */}

      {/* <div className="filter-group">
            <select
              value={filters.city}
              onChange={(e) => handleFilterChange("city", e.target.value)}
            >
              <option value="">All Cities</option>
              {campus?.location ? (
                <option value={campus.location}>{campus.location}</option>
              ) : null}
            </select>
          </div> */}
      {/* 
          <div className="filter-group">
            <select
              value={filters.institute}
              onChange={(e) => handleFilterChange("institute", e.target.value)}
            >
              <option value="">All Institutes</option>
              {campus?.name ? (
                <option value={campus.name}>{campus.name}</option>
              ) : null}
            </select>
          </div> */}

      {/* <div className="filter-group">
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange("date", e.target.value)}
            />
          </div>
        </div>
      </div> */}
      {/* 
      {err && (
        <div className="error-banner">
          <strong>Error:</strong> {err}
        </div>
      )} */}

      {/* Content */}
      <div className="reports-content">
        {/* Attendance */}
        {activeTab === "attendance" && (
          <div className="attendance-report">
            <div className="head-row">
              <h2>Attendance Report</h2>
              <button
                className="btn"
                onClick={() => loadAttendance(filters.date)}
                disabled={attLoading}
              >
                {attLoading ? "Loading…" : "Refresh"}
              </button>
            </div>

            <div className="report-table">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Teacher</th>
                    <th>Date</th>
                    <th>City</th>
                    <th>Institute</th>
                    <th>Present</th>
                    <th>Total</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceTable.map((rec) => (
                    <tr
                      key={rec.courseId}
                      onClick={() => handleClassClick(rec)}
                    >
                      <td>{rec.courseName}</td>
                      <td>{rec.teacherName}</td>
                      <td>{rec.date}</td>
                      <td>{rec.city || "—"}</td>
                      <td>{rec.institute || "—"}</td>
                      <td>{rec.presentCount}</td>
                      <td>{rec.total}</td>
                      <td>{rec.attendancePct.toFixed(2)}%</td>
                    </tr>
                  ))}
                  {attendanceTable.length === 0 && !attLoading && (
                    <tr>
                      <td colSpan={8} className="muted">
                        No data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedClass && (
              <div className="class-details">
                <h3>
                  Class Details — {selectedClass.courseName} (
                  {selectedClass.date})
                </h3>
                <div className="status-toggle">
                  <button
                    className={`chip ${!selectedStudentStatus ? "active" : ""}`}
                    onClick={() => handleStudentStatusClick(null)}
                  >
                    All
                  </button>
                  <button
                    className={`chip ${
                      selectedStudentStatus === "Present" ? "active" : ""
                    }`}
                    onClick={() => handleStudentStatusClick("Present")}
                  >
                    Present
                  </button>
                  <button
                    className={`chip ${
                      selectedStudentStatus === "Absent" ? "active" : ""
                    }`}
                    onClick={() => handleStudentStatusClick("Absent")}
                  >
                    Absent
                  </button>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedStudentStatus === "Present"
                      ? selectedClass.present
                      : selectedStudentStatus === "Absent"
                      ? selectedClass.absent
                      : [
                          ...selectedClass.present.map((x) => ({
                            ...x,
                            __s: "Present",
                          })),
                          ...selectedClass.absent.map((x) => ({
                            ...x,
                            __s: "Absent",
                          })),
                        ]
                    ) // mixed view with marker
                      .map((s) => {
                        const status =
                          selectedStudentStatus ||
                          (s.__s
                            ? s.__s
                            : selectedClass.present.find((p) => p._id === s._id)
                            ? "Present"
                            : "Absent");
                        return (
                          <tr key={s._id}>
                            <td className="stud-cell">
                              <span className="stud-avatar">
                                {initials(s.name)}
                              </span>
                              <span>{s.name}</span>
                            </td>
                            <td>{s.email || "—"}</td>
                            <td>
                              <span
                                className={`status ${status.toLowerCase()}`}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Lecture Activity */}
        {activeTab === "lecture" && (
          <div className="lecture-report">
            <div className="head-row">
              <h2>Lecture Activity</h2>
              <button
                className="btn"
                onClick={loadLectures}
                disabled={lecLoading}
              >
                {lecLoading ? "Loading…" : "Refresh"}
              </button>
            </div>

            <div className="report-table">
              <table>
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Course</th>
                    <th>Topic</th>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>City</th>
                    <th>Institute</th>
                  </tr>
                </thead>
                <tbody>
                  {lectureRows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.teacherName}</td>
                      <td>{r.course}</td>
                      <td>{r.topic}</td>
                      <td>{r.date}</td>
                      <td>{r.duration}</td>
                      <td>{r.city || campus?.location || "—"}</td>
                      <td>{r.institute || campus?.name || "—"}</td>
                    </tr>
                  ))}
                  {lectureRows.length === 0 && !lecLoading && (
                    <tr>
                      <td colSpan={7} className="muted">
                        No data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assessments */}
        {activeTab === "assessments" && (
          <div className="assessments-report">
            <div className="head-row">
              <h2>Assessments</h2>
              <button
                className="btn"
                onClick={loadAssessments}
                disabled={asmLoading}
              >
                {asmLoading ? "Loading…" : "Refresh"}
              </button>
            </div>

            <div className="report-table">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Teacher</th>
                    <th>Type</th>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Total Marks</th>
                    <th>Rows</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {assessmentRows.map((a) => (
                    <tr key={`${a.courseId}-${a.batchId}`}>
                      <td>{a.courseName}</td>
                      <td>{a.teacherName}</td>
                      <td>
                        <span className="badge">{a.type}</span>
                      </td>
                      <td>{a.title}</td>
                      <td>{a.date || "—"}</td>
                      <td>{a.totalMarks}</td>
                      <td>{a.count ?? "—"}</td>
                      <td>
                        <button
                          className="btn small"
                          onClick={() => openBatch(a.batchId)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {assessmentRows.length === 0 && !asmLoading && (
                    <tr>
                      <td colSpan={8} className="muted">
                        No data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedBatch && (
              <div className="class-details">
                <h3>
                  {selectedBatch.meta.type}: {selectedBatch.meta.title} •{" "}
                  {selectedBatch.meta.date}
                </h3>
                <p className="muted">{selectedBatch.meta.description || "—"}</p>

                {batchStats && (
                  <div className="stats-row">
                    <div className="stat-box">
                      <div className="label">Average</div>
                      <div className="value">{batchStats.avg.toFixed(1)}</div>
                    </div>
                    <div className="stat-box">
                      <div className="label">Median</div>
                      <div className="value">
                        {batchStats.median.toFixed(1)}
                      </div>
                    </div>
                    <div className="stat-box">
                      <div className="label">Min</div>
                      <div className="value">{batchStats.min}</div>
                    </div>
                    <div className="stat-box">
                      <div className="label">Max</div>
                      <div className="value">{batchStats.max}</div>
                    </div>
                    <div className="stat-box">
                      <div className="label">Pass (≥50%)</div>
                      <div className="value">
                        {batchStats.passCount}/{batchStats.totalStudents}
                      </div>
                    </div>
                  </div>
                )}

                <div className="report-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Email</th>
                        <th>Marks</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBatch.entries.map((e) => (
                        <tr key={e.id}>
                          <td className="stud-cell">
                            <span className="stud-avatar">
                              {initials(e.name)}
                            </span>
                            <span>{e.name}</span>
                          </td>
                          <td>{e.email || "—"}</td>
                          <td>{e.marks}</td>
                          <td>{e.remarks || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
</>

  );
};

export default Reports;
