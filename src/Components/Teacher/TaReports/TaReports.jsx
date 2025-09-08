"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE =
  import.meta.env?.VITE_API_BASE || "/api/v1";
const token = () => localStorage.getItem("token");

const buster = (join) => `${join}t=${Date.now()}`;
const fetchJSON = async (url) => {
  const join = url.includes("?") ? "&" : "?";
  const res = await fetch(`${url}${buster(join)}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      `${res.status} ${res.statusText} — ${txt || "Request failed"}`
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

const safeDate = (d) => (d ? String(d).slice(0, 10) : "");
const normId = (v) => v?._id || v?.id || String(v || "");

/* ======================= Component ======================= */

const Reports = () => {
  const [activeTab, setActiveTab] = useState("attendance"); // attendance | assessments

  // Base data
  const [err, setErr] = useState("");
  const [campus, setCampus] = useState(null);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);

  // Attendance state
  const [attLoading, setAttLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState({ startDate: "", endDate: "" });
  const [records, setRecords] = useState([]); // raw campus attendance rows
  const [perStudent, setPerStudent] = useState([]); // computed rows with counts and percentages

  // Student detail modal
  const [studModalOpen, setStudModalOpen] = useState(false);
  const [studLoading, setStudLoading] = useState(false);
  const [studInfo, setStudInfo] = useState(null);
  const [studRecords, setStudRecords] = useState([]); // normalized rows for student

  // Assessments
  const [asmLoading, setAsmLoading] = useState(false);
  const [assessmentList, setAssessmentList] = useState([]); // [{courseId, courseName, items:[...]}]
  const [selectedBatch, setSelectedBatch] = useState(null);

  /* -------- Bootstrap: get students & courses once -------- */
  useEffect(() => {
    (async () => {
      try {
        const s = await fetchJSON(`${API_BASE}/teacher/studentdetails`);
        const c = await fetchJSON(`${API_BASE}/teacher/courses`);
        setCampus(s?.data?.campus || null);
        setStudents(Array.isArray(s?.data?.students) ? s.data.students : []);
        setCourses(Array.isArray(c?.data) ? c.data : []);
      } catch (e) {
        setErr(e.message || "Failed to load base data");
      }
    })();
  }, []);

  /* -------- Attendance: load campus records -------- */
  const loadCampusAttendance = async () => {
    setAttLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams();
      if (range.startDate && range.endDate) {
        params.set("startDate", range.startDate);
        params.set("endDate", range.endDate);
      }
      const url = `${API_BASE}/attendance/campus${
        params.toString() ? "?" + params.toString() : ""
      }`;
      const resp = await fetchJSON(url);

      const rows = Array.isArray(resp?.data?.attendance)
        ? resp.data.attendance
        : [];
      setRecords(rows);

      // Build per-student counts
      const counts = new Map(); // id -> {present, absent, leave, total}
      for (const r of rows) {
        const sid = r?.student?._id || r?.studentId || r?.student;
        if (!sid) continue;
        const key = String(sid);
        const statusRaw = String(r?.status || "").toLowerCase();
        const status =
          statusRaw === "present"
            ? "present"
            : statusRaw === "absent"
            ? "absent"
            : statusRaw === "leave" || statusRaw === "on leave"
            ? "leave"
            : // treat unknowns as absent to avoid inflating %
              "absent";

        if (!counts.has(key))
          counts.set(key, { present: 0, absent: 0, leave: 0, total: 0 });
        const c = counts.get(key);
        c[status] = (c[status] || 0) + 1;
        c.total += 1;
      }

      // Merge with student directory so we show everyone (even without records)
      const rowsPerStudent = (students || []).map((s) => {
        const key = String(normId(s));
        const c = counts.get(key) || {
          present: 0,
          absent: 0,
          leave: 0,
          total: 0,
        };
        const pct = c.total ? (c.present / c.total) * 100 : 0;
        return {
          _id: key,
          name: s.name,
          email: s.email || "",
          phone: s.phone || "",
          present: c.present,
          absent: c.absent,
          leave: c.leave,
          total: c.total,
          percent: pct,
        };
      });

      setPerStudent(rowsPerStudent);
    } catch (e) {
      setErr(e.message || "Failed to load attendance");
      setRecords([]);
      setPerStudent([]);
    } finally {
      setAttLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "attendance") {
      loadCampusAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  /* -------- Search / sort for attendance table -------- */
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = perStudent;
    const filtered = q
      ? base.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q) ||
            r.phone.toLowerCase().includes(q)
        )
      : base;
    // sort by percent desc, then total desc, then name
    return [...filtered].sort((a, b) => {
      if (b.percent !== a.percent) return b.percent - a.percent;
      if (b.total !== a.total) return b.total - a.total;
      return a.name.localeCompare(b.name);
    });
  }, [perStudent, search]);

  /* -------- Student details modal -------- */
  const openStudentModal = async (studentRow) => {
    const s = students.find(
      (x) => String(normId(x)) === String(studentRow._id)
    );
    setStudInfo({
      _id: studentRow._id,
      name: s?.name || studentRow.name,
      email: s?.email || studentRow.email || "",
      phone: s?.phone || studentRow.phone || "",
    });
    setStudRecords([]);
    setStudModalOpen(true);
    await fetchStudentAttendance(studentRow._id);
  };

  const fetchStudentAttendance = async (studentId) => {
    if (!studentId) return;
    setStudLoading(true);
    try {
      const params = new URLSearchParams();
      if (range.startDate && range.endDate) {
        params.set("startDate", range.startDate);
        params.set("endDate", range.endDate);
      }
      const url = `${API_BASE}/attendance/student/${studentId}${
        params.toString() ? "?" + params.toString() : ""
      }`;
      const resp = await fetchJSON(url);
      const list = Array.isArray(resp?.data) ? resp.data : [];
      const rows = list.map((r) => ({
        id: r?._id,
        date: safeDate(r?.date || r?.createdAt),
        status:
          String(r?.status || "").toLowerCase() === "present"
            ? "Present"
            : String(r?.status || "").toLowerCase() === "leave"
            ? "Leave"
            : "Absent",
        campus: r?.campus?.name || campus?.name || "",
        markedBy: r?.markedBy?.name || "",
      }));
      rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
      setStudRecords(rows);
    } catch (e) {
      setErr(e.message || "Failed to load student attendance");
      setStudRecords([]);
    } finally {
      setStudLoading(false);
    }
  };

  /* -------- Assessments -------- */
  const loadAssessments = async () => {
    setAsmLoading(true);
    setErr("");
    setAssessmentList([]);
    setSelectedBatch(null);
    try {
      const results = await Promise.allSettled(
        (courses || []).map(async (c) => {
          const courseId = normId(c);
          const resp = await fetchJSON(
            `${API_BASE}/assessments/course/${courseId}`
          );
          const arr = Array.isArray(resp?.data) ? resp.data : [];
          return {
            courseId,
            courseName: c?.name || "Untitled Course",
            items: arr.map((a) => ({
              id: a?._id,
              title: a?.title || "Untitled",
              type: (a?.type || "").toUpperCase(),
              date: safeDate(a?.date),
              totalMarks: a?.totalMarks ?? "-",
            })),
          };
        })
      );
      const list = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);
      setAssessmentList(list);
    } catch (e) {
      setErr(e.message || "Failed to load assessments");
    } finally {
      setAsmLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "assessments") {
      loadAssessments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const openBatch = async (assessmentId) => {
    try {
      const resp = await fetchJSON(
        `${API_BASE}/assessments/${assessmentId}/results`
      );
      const d = resp?.data || {};
      const asmt = d.assessment || {};
      const results = Array.isArray(d.results) ? d.results : [];
      setSelectedBatch({
        meta: {
          title: asmt.title || "Untitled",
          type: (asmt.type || "").toUpperCase(),
          date: safeDate(asmt.date),
          totalMarks: Number(asmt.totalMarks ?? 0),
          description: asmt.description || "",
        },
        entries: results.map((r) => ({
          id: normId(r?.student),
          name: r?.student?.name || "—",
          email: r?.student?.email || "",
          marks: Number(r?.marks ?? 0),
          remarks: r?.remarks || "",
        })),
      });
    } catch (e) {
      setErr(e.message || "Failed to load assessment results");
      setSelectedBatch(null);
    }
  };

  /* -------- UI -------- */
  return (
    <>
      <style>{`
.page { padding: 24px; max-width: 1200px; margin: 0 auto; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
.header { display:flex; align-items:center; justify-content:space-between; margin-bottom: 16px; }
.title { font-weight:700; font-size: 28px; }
.tabs { display:flex; gap:8px; margin-bottom: 16px; }
.tab { padding:8px 12px; border:1px solid #1976d2; color:#1976d2; background:#fff; border-radius:8px; cursor:pointer; }
.tab.active, .tab:hover { background:#1976d2; color:#fff; }
.row { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
.grow { flex: 1 1 auto; }
.input { padding:8px 10px; border:1px solid #ddd; border-radius:8px; min-width: 220px; }
.btn { border:1px solid #1976d2; background:#1976d2; color:#fff; padding:8px 12px; border-radius:8px; cursor:pointer; }
.btn.outline { background:#fff; color:#1976d2; }
.table-wrap { width:100%; overflow:auto; border:1px solid #eee; border-radius:8px; }
table { width:100%; border-collapse:collapse; }
th, td { padding:10px; border-bottom:1px solid #eee; text-align:left; }
thead th { background:#f7f9fc; font-weight:600; }
.badge { display:inline-block; padding:2px 8px; border-radius:12px; background:#eee; font-weight:600; font-size:.8rem; }
.pill { padding:2px 8px; border-radius: 999px; font-weight:600; }
.pill.present { background:#e7f7ea; color:#2e7d32; }
.pill.absent { background:#fdecea; color:#c62828; }
.pill.leave { background:#fff6e5; color:#b26a00; }
.cell-stud { display:flex; align-items:center; gap:10px; }
.avatar { width:28px; height:28px; border-radius:50%; background:#1976d2; color:#fff; display:inline-flex; align-items:center; justify-content:center; font-weight:700; }
.small { font-size:.9rem; }
.note { color:#666; }
.modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; z-index:50; }
.modal { width:min(800px,96vw); background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,.25); }
.modal header, .modal footer { padding:12px 16px; background:#f7f9fc; }
.modal header { font-weight:700; }
.modal .content { padding:16px; max-height:70vh; overflow:auto; }
.err { color:#b00020; font-weight:600; }
      `}</style>

      <div className="page">
        <div className="header">
          <div className="title">Reports</div>
          {err ? <div className="err">Error: {err}</div> : null}
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === "attendance" ? "active" : ""}`}
            onClick={() => setActiveTab("attendance")}
          >
            Attendance
          </button>
          <button
            className={`tab ${activeTab === "assessments" ? "active" : ""}`}
            onClick={() => setActiveTab("assessments")}
          >
            Assessments
          </button>
        </div>

        {/* ============ ATTENDANCE ============ */}
        {activeTab === "attendance" && (
          <>
            <div className="row" style={{ marginBottom: 12 }}>
              <input
                className="input grow"
                placeholder="Search student by name, email, or phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <input
                type="date"
                className="input"
                value={range.startDate}
                onChange={(e) =>
                  setRange((p) => ({ ...p, startDate: e.target.value }))
                }
              />
              <input
                type="date"
                className="input"
                value={range.endDate}
                onChange={(e) =>
                  setRange((p) => ({ ...p, endDate: e.target.value }))
                }
              />
              <button
                className="btn"
                onClick={loadCampusAttendance}
                disabled={attLoading}
              >
                {attLoading ? "Loading…" : "Apply"}
              </button>
              <button
                className="btn outline"
                onClick={() => {
                  setRange({ startDate: "", endDate: "" });
                  setSearch("");
                  loadCampusAttendance();
                }}
              >
                Reset
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Leave</th>
                    <th>Total</th>
                    <th>% Present</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((r) => (
                    <tr key={r._id}>
                      <td className="cell-stud">
                        <span className="avatar">{initials(r.name)}</span>
                        <span>{r.name}</span>
                      </td>
                      <td>{r.email || "—"}</td>
                      <td>
                        <span className="pill present">{r.present}</span>
                      </td>
                      <td>
                        <span className="pill absent">{r.absent}</span>
                      </td>
                      <td>
                        <span className="pill leave">{r.leave}</span>
                      </td>
                      <td>{r.total}</td>
                      <td>{r.percent.toFixed(1)}%</td>
                      <td>
                        <button
                          className="btn small"
                          onClick={() => openStudentModal(r)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && !attLoading && (
                    <tr>
                      <td colSpan={8} className="note">
                        No students found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 8 }} className="note small">
              Showing {filteredStudents.length} of {perStudent.length} students
              {range.startDate && range.endDate
                ? ` • Range: ${range.startDate} → ${range.endDate}`
                : " • Range: all available records"}
              {campus?.name ? ` • Campus: ${campus.name}` : ""}
            </div>
          </>
        )}

        {/* ============ ASSESSMENTS ============ */}
        {activeTab === "assessments" && (
          <>
            <div className="row" style={{ marginBottom: 12 }}>
              <div className="note">
                Courses: {courses.length} • Click "View" to open assessment
                results
              </div>
              <button
                className="btn"
                onClick={loadAssessments}
                disabled={asmLoading}
              >
                {asmLoading ? "Loading…" : "Refresh"}
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Type</th>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Total Marks</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {assessmentList.flatMap((group) =>
                    group.items.map((a) => (
                      <tr key={a.id}>
                        <td>{group.courseName}</td>
                        <td>
                          <span className="badge">{a.type}</span>
                        </td>
                        <td>{a.title}</td>
                        <td>{a.date || "—"}</td>
                        <td>{a.totalMarks}</td>
                        <td>
                          <button
                            className="btn small"
                            onClick={() => openBatch(a.id)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  {assessmentList.every((g) => g.items.length === 0) &&
                    !asmLoading && (
                      <tr>
                        <td colSpan={6} className="note">
                          No assessments found.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>

            {selectedBatch && (
              <div className="table-wrap" style={{ marginTop: 16 }}>
                <div style={{ padding: "10px 12px", background: "#f7f9fc" }}>
                  <strong>{selectedBatch.meta.type}</strong> —{" "}
                  {selectedBatch.meta.title} • {selectedBatch.meta.date} •
                  Total: {selectedBatch.meta.totalMarks}
                </div>
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
                        <td className="cell-stud">
                          <span className="avatar">{initials(e.name)}</span>
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
            )}
          </>
        )}
      </div>

      {/* ======= Student Attendance Modal ======= */}
      {studModalOpen && (
        <div className="modal-backdrop" onClick={() => setStudModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header>
              Student Attendance — {studInfo?.name}
              {studInfo?.email ? ` (${studInfo.email})` : ""}
            </header>
            <div className="content">
              <div className="row" style={{ marginBottom: 12 }}>
                <input
                  type="date"
                  className="input"
                  value={range.startDate}
                  onChange={(e) =>
                    setRange((p) => ({ ...p, startDate: e.target.value }))
                  }
                />
                <input
                  type="date"
                  className="input"
                  value={range.endDate}
                  onChange={(e) =>
                    setRange((p) => ({ ...p, endDate: e.target.value }))
                  }
                />
                <button
                  className="btn"
                  onClick={() => fetchStudentAttendance(studInfo._id)}
                  disabled={studLoading}
                >
                  {studLoading ? "Loading…" : "Filter"}
                </button>
              </div>

              {/* Quick stats */}
              <StudentStats records={studRecords} />

              <div className="table-wrap" style={{ marginTop: 12 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Campus</th>
                      <th>Marked By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studRecords.map((r) => (
                      <tr key={r.id}>
                        <td>{r.date}</td>
                        <td>
                          <span
                            className={`pill ${
                              r.status.toLowerCase() === "present"
                                ? "present"
                                : r.status.toLowerCase() === "leave"
                                ? "leave"
                                : "absent"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td>{r.campus || "—"}</td>
                        <td>{r.markedBy || "—"}</td>
                      </tr>
                    ))}
                    {studRecords.length === 0 && !studLoading && (
                      <tr>
                        <td colSpan={4} className="note">
                          No records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <footer
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="note">Total records: {studRecords.length}</span>
              <button className="btn" onClick={() => setStudModalOpen(false)}>
                Close
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
};

/* -------- Small helper component for per-student quick stats -------- */
function StudentStats({ records }) {
  const s = useMemo(() => {
    const out = { present: 0, absent: 0, leave: 0, total: 0, percent: 0 };
    for (const r of records) {
      const st = String(r.status || "").toLowerCase();
      if (st === "present") out.present++;
      else if (st === "leave") out.leave++;
      else out.absent++;
      out.total++;
    }
    out.percent = out.total ? (out.present / out.total) * 100 : 0;
    return out;
  }, [records]);

  return (
    <div className="row" style={{ gap: 16 }}>
      <StatBox label="Present" value={s.present} cls="present" />
      <StatBox label="Absent" value={s.absent} cls="absent" />
      <StatBox label="Leave" value={s.leave} cls="leave" />
      <StatBox label="% Present" value={`${s.percent.toFixed(1)}%`} />
      <div className="note" style={{ marginLeft: "auto" }}>
        Total: {s.total}
      </div>
    </div>
  );
}

function StatBox({ label, value, cls }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        border: "1px solid #eee",
        borderRadius: 10,
        minWidth: 120,
        background: "#fff",
      }}
    >
      <div className="note" style={{ marginBottom: 6 }}>
        {label}
      </div>
      <div
        className={`pill ${cls || ""}`}
        style={{ display: "inline-block", fontSize: "1rem" }}
      >
        {value}
      </div>
    </div>
  );
}

export default Reports;
