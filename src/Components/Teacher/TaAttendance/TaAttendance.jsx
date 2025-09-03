import React, { useEffect, useMemo, useState } from "react";


/** ===== Local Storage keys (from your Teacher Dashboard) ===== */
const LS_TDB_TEACHER = "tdb_teacher";
const LS_TDB_CAMPUSES = "tdb_campuses";
const LS_TDB_CURRENT_CAMPUS_ID = "tdb_current_campus_id";
const LS_TDB_CAMPUS_STUDENTS = (id) => `tdb_campus_${id}_students`;
const LS_TDB_COURSES = "tdb_courses_for_teacher";

/** ===== Local cache for attendance (optional, merges with backend) ===== */
const ATT_LS_KEY = "attendance_records_v2";

/** ===== API base ===== */
const API_BASE =
  import.meta.env?.VITE_API_BASE ||
  "https://vigilant-moser.210-56-25-68.plesk.page/api/v1";

/** UI statuses */
const UI_STATUSES = ["Present", "Absent", "Half Day", "Leave", "Other"];

/** Map UI <-> DB (your Attendance enum uses mixed/lowercase) */
const uiToDb = (s) =>
  s === "Present"
    ? "present"
    : s === "Absent"
    ? "absent"
    : s === "Other"
    ? "other"
    : s; // "Half Day" and "Leave" pass through as-is

const dbToUi = (s) =>
  s === "present"
    ? "Present"
    : s === "absent"
    ? "Absent"
    : s === "other"
    ? "Other"
    : s; // "Half Day", "Leave" pass through

/* LS helpers */
const readLS = (k, fallback = null) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const saveLS = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

const onlyDateKey = (iso) => new Date(iso).toISOString().slice(0, 10);

const Attendance = () => {
  /** ---- context from cache ---- */
  const teacher = readLS(LS_TDB_TEACHER, null);
  const campuses = readLS(LS_TDB_CAMPUSES, []);
  const campusId =
    readLS(LS_TDB_CURRENT_CAMPUS_ID, "") || campuses[0]?._id || "";

  const [students, setStudents] = useState(
    campusId ? readLS(LS_TDB_CAMPUS_STUDENTS(campusId), []) : []
  );

  const allCourses = readLS(LS_TDB_COURSES, []);
  const [courseId, setCourseId] = useState(allCourses[0]?._id || "");
  const course = useMemo(
    () => allCourses.find((c) => c._id === courseId) || null,
    [allCourses, courseId]
  );

  const token = localStorage.getItem("token");

  /** ---- date ---- */
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(todayStr);

  /** ---- local cache of attendance (courseId -> date -> studentId -> {status,reason}) ---- */
  const [records, setRecords] = useState(() => readLS(ATT_LS_KEY, {}));
  useEffect(() => saveLS(ATT_LS_KEY, records), [records]);

  /** ---- ui controls ---- */
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [bulkStatus, setBulkStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingFromBackend, setLoadingFromBackend] = useState(false);
  const [err, setErr] = useState("");

  /** ---- helpers ---- */
  const ensurePath = (obj, cId, d) => {
    const next = { ...obj };
    if (!next[cId]) next[cId] = {};
    if (!next[cId][d]) next[cId][d] = {};
    return next;
  };
  const dayRecord = records[courseId]?.[date] || {};

  const setStatus = (studentId, status) => {
    if (!courseId) return;
    const next = ensurePath(records, courseId, date);
    next[courseId][date][studentId] = {
      ...(next[courseId][date][studentId] || {}),
      status,
      ...(status !== "Other" ? { reason: "" } : {}),
    };
    setRecords(next);
  };

  const setReason = (studentId, reason) => {
    if (!courseId) return;
    const next = ensurePath(records, courseId, date);
    next[courseId][date][studentId] = {
      ...(next[courseId][date][studentId] || {}),
      status: next[courseId][date][studentId]?.status || "Other",
      reason,
    };
    setRecords(next);
  };

  /** ---- load existing attendance for (courseId, date) from backend and merge ---- */
  const loadFromBackend = async () => {
    if (!token || !courseId) return;
    setLoadingFromBackend(true);
    setErr("");
    try {
      // Try optional server-side filter ?date=YYYY-MM-DD (safe if backend ignores it)
      const url = `${API_BASE}/attendance/course/${courseId}?date=${date}`;
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(
          `${res.status} ${res.statusText} — ${t || "Request failed"}`
        );
      }
      const json = await res.json();
      const list = Array.isArray(json?.data) ? json.data : [];

      // Keep only same-day records
      const sameDay = list.filter((r) => onlyDateKey(r.date) === date);

      // Merge into local records
      const next = ensurePath(records, courseId, date);
      sameDay.forEach((r) => {
        const sid = r.student?._id || r.student; // populate or raw id
        next[courseId][date][sid] = {
          ...(next[courseId][date][sid] || {}),
          status: dbToUi(r.status || ""),
          reason: next[courseId][date][sid]?.reason || "",
        };
      });
      setRecords(next);
    } catch (e) {
      setErr(e.message || "Failed to load attendance from backend");
    } finally {
      setLoadingFromBackend(false);
    }
  };

  /** ---- save to backend (bulk) ---- */
  const saveToBackend = async () => {
    if (!token || !courseId) return;
    setSaving(true);
    setErr("");
    try {
      const entries = Object.entries(dayRecord).filter(
        ([, v]) => v && v.status
      );
      const attendances = entries.map(([studentId, v]) => ({
        studentId,
        status: uiToDb(v.status), // map to backend enum
        // if your backend stores reason, add 'reason' to schema/controller and include it here
      }));

      // nothing to save?
      if (attendances.length === 0) {
        setSaving(false);
        return;
      }

      const res = await fetch(`${API_BASE}/attendance/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          courseId,
          date, // <-- requires backend patch below
          attendances, // [{ studentId, status }]
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(
          `${res.status} ${res.statusText} — ${t || "Request failed"}`
        );
      }
      // Optionally refresh from backend to ensure parity
      await loadFromBackend();
      alert("Attendance saved successfully for Data :" + date);
    } catch (e) {
      setErr(e.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  /** ---- hydrate students if campus changed elsewhere ---- */
  useEffect(() => {
    if (!campusId) return;
    const cached = readLS(LS_TDB_CAMPUS_STUDENTS(campusId), []);
    setStudents(cached || []);
  }, [campusId]);

  /** ---- auto-load marks when course/date changes ---- */
  useEffect(() => {
    if (courseId) loadFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, date]);

  /** ---- filter/search ---- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (students || []).filter((s) => {
      const name = (s.name || "").toLowerCase();
      const email = (s.email || "").toLowerCase();
      const phone = (s.phone || "").toLowerCase();
      const matchQ =
        !q || name.includes(q) || email.includes(q) || phone.includes(q);
      if (!matchQ) return false;

      if (filter === "All") return true;
      if (filter === "Unmarked") {
        const st = dayRecord[s._id]?.status;
        return !st;
      }
      const st = dayRecord[s._id]?.status || "";
      return st === filter;
    });
  }, [students, query, filter, dayRecord]);

  /** ---- bulk helpers & summary ---- */
  const bulkApply = () => {
    if (!bulkStatus || !courseId) return;
    const next = ensurePath(records, courseId, date);
    filtered.forEach((s) => {
      const sid = s._id;
      next[courseId][date][sid] = {
        ...(next[courseId][date][sid] || {}),
        status: bulkStatus,
        reason:
          bulkStatus === "Other" ? next[courseId][date][sid]?.reason || "" : "",
      };
    });
    setRecords(next);
  };

  const clearDay = () => {
    if (!courseId) return;
    if (!confirm(`Clear all marks for ${date} (${course?.name || "Course"})?`))
      return;
    const next = { ...records };
    if (next[courseId]) next[courseId] = { ...next[courseId], [date]: {} };
    setRecords(next);
  };

  const summary = useMemo(() => {
    const counts = {
      Present: 0,
      Absent: 0,
      "Half Day": 0,
      Leave: 0,
      Other: 0,
      Unmarked: 0,
    };
    (students || []).forEach((s) => {
      const st = dayRecord[s._id]?.status;
      if (!st) counts.Unmarked += 1;
      else if (counts[st] !== undefined) counts[st] += 1;
    });
    return counts;
  }, [students, dayRecord]);

  return (
    <>
    <style>{`.attendance-container {
  padding: 1.5rem;
  font-family: 'Segoe UI', sans-serif;
  color: #111827;
  background: #f7f9fc;
  min-height: 100%;
}

/* Header row */
.attendance-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.attendance-title {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: .2px;
  margin: 0;
}

.head-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.date-input,
.search-input,
.filter-select,
.bulk-select,
.reason-input {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: .95rem;
  outline: none;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.date-input:focus,
.search-input:focus,
.filter-select:focus,
.bulk-select:focus,
.reason-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,.15);
}

.search-wrap { position: relative; }
.search-input { min-width: 240px; }

/* Summary chips */
.summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0 14px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: .85rem;
  border: 1px solid #e5e7eb;
  background: #fff;
}
.chip.present { color: #059669; background: #ecfdf5; border-color: #a7f3d0; }
.chip.absent  { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }
.chip.half    { color: #b45309; background: #fffbeb; border-color: #fde68a; }
.chip.leave   { color: #2563eb; background: #eff6ff; border-color: #bfdbfe; }
.chip.other   { color: #7c3aed; background: #f5f3ff; border-color: #ddd6fe; }
.chip.unmarked{ color: #374151; background: #f3f4f6; border-color: #e5e7eb; }

/* Bulk bar */
.bulk-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.bulk-left { display: flex; align-items: center; gap: 8px; }
.bulk-label { font-weight: 600; color: #374151; }
.bulk-select { min-width: 170px; }

.btn {
  background: #f3f4f6;
  color: #111827;
  border: 1px solid #e5e7eb;
  padding: 9px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}
.btn:hover { background: #eef2f7; }
.btn.primary { background: #4f46e5; color: #fff; border-color: #4f46e5; }
.btn.primary:disabled { opacity: .6; cursor: not-allowed; }
.btn.danger { background: #fee2e2; color: #991b1b; border-color: #fecaca; }

/* Table */
.table-wrap {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0,0,0,.04);
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
}

.attendance-table th,
.attendance-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
}

.attendance-table thead th {
  background-color: #f9fafb;
  color: #111827;
  font-weight: 800;
  font-size: .92rem;
}

.empty-row {
  text-align: center;
  color: #6b7280;
  padding: 24px 12px;
}

.strong { font-weight: 700; color: #1f2937; }
.muted { color: #6b7280; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

/* Status cell */
.status-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-select {
  width: 100%;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 10px;
  outline: none;
}
.status-select:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79,70,229,.15);
}

.status-dot {
  display: inline-block;
  width: 10px; height: 10px;
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,.08);
}
.status-dot.present { background: #10b981; }
.status-dot.absent  { background: #ef4444; }
.status-dot.half    { background: #f59e0b; }
.status-dot.leave   { background: #3b82f6; }
.status-dot.other   { background: #8b5cf6; }
.status-dot.unmarked{ background: #9ca3af; }

.reason-input { width: 100%; }

.dash { color: #9ca3af; }

/* Footer hint */
.hint {
  margin-top: 10px;
  color: #6b7280;
  font-size: .9rem;
}

/* Responsive */
@media (max-width: 900px) {
  .attendance-table thead th:nth-child(4),
  .attendance-table tbody td:nth-child(4),
  .attendance-table thead th:nth-child(5),
  .attendance-table tbody td:nth-child(5) {
    display: none; /* hide email & contact on small screens */
  }
}
/* Top course bar */
.course-bar{
  display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px;
}
.course-left{display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap}
.course-info{display:flex;flex-direction:column;gap:6px}
.course-info label{font-weight:700;color:#374151}
.course-select{
  background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:8px 10px;min-width:220px;
  outline:none;
}
.course-select:focus{border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,.15)}
.course-meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.pill{
  display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;
  background:#f3f4f6;color:#111827;border:1px solid #e5e7eb;font-weight:700;font-size:.85rem;
}
`}</style>
    <div className="attendance-container">
      {/* top: course info (and actions) */}
      <div className="course-bar">
        <div
          className="course-left"
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h2 className="attendance-title">Attendance</h2>

          <div className="course-info">
            <label>Course</label>
            <select
              className="course-select"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              {(allCourses || []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.code ? `• ${c.code}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="course-meta">
            {course ? (
              <>
                <span className="pill">Code: {course.code || "—"}</span>
                <span className="pill">
                  Campus Students: {(students || []).length}
                </span>
              </>
            ) : (
              <span className="muted">No course assigned.</span>
            )}
          </div>
        </div>

        <div className="head-actions">
          <input
            type="date"
            className="date-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {/* <div className="search-wrap">
            <input
              className="search-input"
              placeholder="Search name, email, phone…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div> */}
          <select
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>All</option>
            {UI_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
            <option>Unmarked</option>
          </select>

          {/* <button
            className="btn"
            onClick={loadFromBackend}
            disabled={!courseId || loadingFromBackend}
          >
            {loadingFromBackend ? "Syncing…" : "Load from backend"}
          </button> */}
        </div>
      </div>

      {/* {err && (
        <div className="error-banner">
          <strong>Error:</strong> {err}
        </div>
      )} */}

      {/* summary */}
      <div className="summary-row">
        <div className="chip present">Present: {summary.Present}</div>
        <div className="chip absent">Absent: {summary.Absent}</div>
        <div className="chip half">Half Day: {summary["Half Day"]}</div>
        <div className="chip leave">Leave: {summary.Leave}</div>
        <div className="chip other">Other: {summary.Other}</div>
        <div className="chip unmarked">Unmarked: {summary.Unmarked}</div>
      </div>

      {/* bulk */}
      <div className="bulk-row">
        <div className="bulk-left">
          <label className="bulk-label">Bulk mark (filtered rows):</label>
          <select
            className="bulk-select"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
          >
            <option value="">Choose status…</option>
            {UI_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            className="btn primary"
            onClick={bulkApply}
            disabled={!bulkStatus || !courseId}
          >
            Apply
          </button>
        </div>
        <div className="bulk-right">
          <button
            className="btn danger"
            onClick={clearDay}
            disabled={!courseId}
          >
            Clear {date}
          </button>
        </div>
      </div>

      {/* table: ONLY user info */}
      <div className="table-wrap">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Sr#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th style={{ width: 180 }}>Status</th>
              <th>Reason (if Other)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, idx) => {
              const sid = s._id;
              const rec = dayRecord[sid] || {};
              const status = rec.status || "";
              return (
                <tr key={sid}>
                  <td>{idx + 1}</td>
                  <td className="strong">{s.name}</td>
                  <td className="muted">{s.email || "—"}</td>
                  <td className="muted">{s.phone || "—"}</td>
                  <td>
                    <div className="status-cell">
                      <span className={`status-dot ${statusClass(status)}`} />
                      <select
                        className="status-select"
                        value={status}
                        onChange={(e) => setStatus(sid, e.target.value)}
                        disabled={!courseId}
                      >
                        <option value="">— Select —</option>
                        {UI_STATUSES.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td>
                    {status === "Other" ? (
                      <input
                        className="reason-input"
                        placeholder="Enter reason"
                        value={rec.reason || ""}
                        onChange={(e) => setReason(sid, e.target.value)}
                      />
                    ) : (
                      <span className="dash">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-row">
                  {students?.length
                    ? "No students match your search/filter."
                    : "No cached campus students found. Open the Teacher Dashboard once to cache campus data."}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <button
          style={{
            marginBlock: "20px",
            marginRight: "20px",
            float: "right",
          }}
          className="btn primary"
          onClick={saveToBackend}
          disabled={!courseId || saving}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
</>

  );
};

/** status -> class */
function statusClass(status) {
  if (status === "Present") return "present";
  if (status === "Absent") return "absent";
  if (status === "Half Day") return "half";
  if (status === "Leave") return "leave";
  if (status === "Other") return "other";
  return "unmarked";
}

export default Attendance;
