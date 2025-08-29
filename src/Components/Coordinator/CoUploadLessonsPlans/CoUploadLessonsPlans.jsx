import React, { useState, useEffect, useCallback } from "react";

import { lessonPlanService } from "../../../services/api";

/** ---------- helpers (read-only) ---------- */
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
const humanDate = (iso) => {
  const d = new Date(iso);
  return `${ordinal(d.getDate())} ${months[d.getMonth()]}`;
};
const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
const plus60 = (hhmm) => {
  if (!hhmm) return "";
  const [h, m] = String(hhmm).split(":").map(Number);
  const d = new Date(2000, 0, 1, h || 0, m || 0);
  d.setMinutes(d.getMinutes() + 60);
  return `${pad2(d.getHours())}${pad2(d.getMinutes())}`;
};
const compact = (hhmm) => (hhmm ? String(hhmm).replace(":", "") : "");

/** ---------- Read-only "screenshot style" table ---------- */
function SavedWeekTable({ snap, onWheelX }) {
  const head = snap?.head || {};
  const timesSat = Array.isArray(snap?.timesSat) ? snap.timesSat : [];
  const timesSun = Array.isArray(snap?.timesSun) ? snap.timesSun : [];
  const cells = Array.isArray(snap?.cells) ? snap.cells : [];

  const unitTag = head.unitTag ? ` (${head.unitTag})` : "";
  const sundayOffset = timesSat.length; // use actual Sat length (not hardcoded 5)

  return (
    <div
      className="lp-table-wrap card lp-preview"
      aria-label="Saved weekly plan (read only)"
    >
      <div className="lp-scroll" onWheel={onWheelX}>
        <table className="lp-table view-style" role="table">
          <tbody>
            {/* SATURDAY */}
            <tr>
              <th className="vw-day sticky-col" rowSpan={2}>
                <div className="vw-day-name">Saturday</div>
                <div className="vw-day-date">
                  {head.startDateISO ? humanDate(head.startDateISO) : "—"}
                </div>
                <div className="vw-unit">
                  {head.unitSat || "—"}
                  {unitTag}
                </div>
              </th>
              {timesSat.map((t, i) => (
                <th key={`sat-t-${t}`} className="vw-time sticky-top">
                  {compact(t)}-{plus60(t)}
                </th>
              ))}
            </tr>
            <tr>
              {timesSat.map((_, i) => (
                <td key={`sat-c-${i}`} className="vw-topic">
                  {cells[i]?.text ? (
                    <div className="vw-topic-text">{cells[i].text}</div>
                  ) : (
                    <div className="vw-topic-empty">—</div>
                  )}
                </td>
              ))}
            </tr>

            {/* SUNDAY */}
            <tr>
              <th className="vw-day sticky-col" rowSpan={2}>
                <div className="vw-day-name">Sunday</div>
                <div className="vw-day-date">
                  {head.endDateISO ? humanDate(head.endDateISO) : "—"}
                </div>
                <div className="vw-unit">
                  {head.unitSun || "—"}
                  {unitTag}
                </div>
              </th>
              {timesSun.map((t, i) => {
                const idx = sundayOffset + i;
                return (
                  <th key={`sun-t-${t}`} className="vw-time sticky-top">
                    {compact(t)}-{plus60(t)}
                  </th>
                );
              })}
            </tr>
            <tr>
              {timesSun.map((_, i) => {
                const idx = sundayOffset + i;
                return (
                  <td key={`sun-c-${i}`} className="vw-topic">
                    {cells[idx]?.text ? (
                      <div className="vw-topic-text">{cells[idx].text}</div>
                    ) : (
                      <div className="vw-topic-empty">—</div>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** ---------- Read-only list of saved plans ---------- */
export default function UploadLessonsPlans() {
  const [savedWeeks, setSavedWeeks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  /** Convert vertical wheel to horizontal inside the table & stop page scroll */
  const onWheelX = useCallback((e) => {
    const el = e.currentTarget;
    const canScrollX = el.scrollWidth > el.clientWidth;
    if (!canScrollX) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, []);

  const loadSavedWeeks = async (pageNum = 7, append = false) => {
    try {
      setLoading(true);
      setErr("");
      const response = await lessonPlanService.getAll(pageNum, 10);
      const list = Array.isArray(response?.data) ? response.data : [];
      if (append) {
        setSavedWeeks((prev) => [...prev, ...list]);
      } else {
        setSavedWeeks(list);
      }
      setHasMore(list.length === 10);
      setPage(pageNum);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load lesson plans"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedWeeks(1, false);
  }, []);

  return (
    <>
    <style>{
      `:root {
  --bg: #f7f8fb;
  --card: #fff;
  --ink: #101418;
  --muted: #6b7280;
  --line: #e6e8ee;
  --brand: #2563eb;
  --brand-ink: #fff;
  --success: #16a34a;
  --danger: #dc2626;
  --radius-lg: 14px;
  --radius-md: 10px;
  --shadow: 0 8px 24px rgba(16, 20, 24, .06);
  --left-col: 200px;
  --slot-w: 220px;
  /* col widths to control scroll */
}

/* Base */
.lp-only {
  max-width: 1200px;
  margin: 28px auto 80px;
  padding: 0 18px;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: var(--ink);
  background: var(--bg)
}

.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow)
}

/* Header */
.lp-header {
  margin-bottom: 18px
}

.lp-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, #fff, #fafbff);
  border: 1px solid var(--line);
  box-shadow: var(--shadow)
}

.lp-title {
  font-size: clamp(20px, 2vw+12px, 28px);
  font-weight: 800;
  margin: 0 0 6px
}

.lp-program {
  font-size: clamp(16px, 1.5vw+8px, 18px);
  font-weight: 700;
  margin: 0 0 4px;
  color: #1f2937
}

.lp-cycle {
  font-size: clamp(14px, 1.2vw+6px, 16px);
  font-weight: 700;
  color: #334155
}

.lp-subline {
  margin-top: 2px;
  font-size: 13px;
  color: var(--muted)
}

.lp-head-controls {
  display: flex;
  gap: 8px
}

.lp-head-editor {
  margin-top: 12px;
  padding: 14px
}

.lp-head-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
    gap: 12px
}

.lp-head-grid label {
  display: grid;
  gap: 6px;
  font-weight: 700;
  font-size: 13px
}

.lp-head-grid input {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  font: inherit
}

.lp-hint {
  color: var(--muted);
  font-weight: 500;
  font-size: 12px
}

.lp-edit-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px
}

/* Buttons */
.btn {
  appearance: none;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink);
  padding: 10px 16px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: transform .04s ease
}

.btn:hover {
  transform: translateY(-1px)
}

.btn:active {
  transform: translateY(0)
}

.btn.btn-primary {
  background: var(--brand);
  border-color: var(--brand);
  color: var(--brand-ink)
}

.btn.btn-success {
  background: var(--success);
  border-color: var(--success);
  color: #fff
}

.btn.btn-danger {
  background: var(--danger);
  border-color: var(--danger);
  color: #fff
}

/* --- INNER SCROLL WRAPPER (keeps scroll inside tables) --- */
.lp-table-wrap {
  padding: 0
}

.lp-scroll {
  overflow: auto;
  /* both axes if needed */
  max-width: 100%;
  max-height: 72vh;
  /* keeps vertical scroll inside card */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  /* stop scrolling the page */
  touch-action: pan-x;
  /* horizontal gestures stay here */
}

/* Tables */
.lp-table {
  width: 100%;
  border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
    min-width: calc(var(--left-col) + 5 * var(--slot-w));
    /* force horizontal scroll on small screens */
    font-family: "Times New Roman", Georgia, serif;
  }
  
  .lp-table th,
  .lp-table td {
    border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    padding: 14px 12px;
    vertical-align: middle
  }
  
  .lp-day {
    text-align: center;
    background: #f8fafc;
    font-weight: 800;
    font-size: 17px
  }
  
  .lp-day-name {
    font-size: 18px
  }
  
  .lp-day-date {
  font-size: 14px;
  margin-top: 4px;
    color: #475569
  }
  
  .lp-row-head th {
    background: #fbfbff
  }
  
  .lp-unit {
    text-align: center;
    font-weight: 800;
    width: var(--left-col);
    min-width: var(--left-col)
  }
  
  .lp-unit-top {
    font-size: 16px
  }
  
  .lp-unit-sub {
    font-size: 13px;
    margin-top: 2px;
    color: #475569
  }
  
  .lp-time {
    text-align: center;
    font-size: 15px;
    font-weight: 800;
    background: #f7f8ff;
    min-width: var(--slot-w)
  }
  
  .sticky-top {
    position: sticky;
    top: 0;
    z-index: 2
  }
  
  .sticky-col {
    position: sticky;
    left: 0;
    z-index: 3;
    background: #fbfbff;
    box-shadow: 1px 0 0 var(--line)
}

.lp-unit-spacer {
  background: #fff;
  border-right: 1px solid var(--line)
}

.lp-topic {
  text-align: center;
  font-size: 15px;
  line-height: 1.35;
  background: #fff;
  min-width: var(--slot-w)
}

.lp-topic-btn {
  width: 100%;
  background: transparent;
  border: 0;
  text-align: center;
  padding: 8px 6px;
  cursor: pointer;
  color: black;
}

.lp-topic-btn:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: 1px
}

.lp-topic-empty {
  color: var(--muted);
  font-style: italic
}

.lp-topic-text {
  white-space: pre-wrap
}

.lp-textarea {
  width: 100%;
  border: 1px solid var(--line);
    border-radius: var(--radius-md);
    padding: 10px 12px;
    font: inherit;
    font-size: 14px;
    resize: vertical
  }
  
  /* Saved "view" style (screenshot-like) */
  .view-style {
    border: 2px solid #1f2937;
    min-width: calc(var(--left-col) + 5 * var(--slot-w))
  }
  
  .view-style th,
  .view-style td {
    border-color: #1f2937
  }
  
  .vw-day {
    text-align: center;
    font-weight: 800;
    background: #fff;
    width: var(--left-col);
    min-width: var(--left-col)
  }
  
  .vw-day-name {
    font-size: 18px
  }
  
  .vw-day-date {
  font-size: 14px;
  margin-top: 6px
  }
  
  .vw-time {
    text-align: center;
    font-weight: 800;
    background: #efefef;
    font-size: 16px;
    min-width: var(--slot-w)
  }
  
  .vw-unit {
    text-align: center;
    font-weight: 800;
    background: #fff;
    width: var(--left-col);
    min-width: var(--left-col)
  }
  
  .vw-topic {
    background: #fff;
    text-align: center;
    min-width: var(--slot-w)
  }
  
  .vw-topic-text {
    white-space: pre-wrap
  }
  
  .vw-topic-empty {
    color: #888
  }
  
  /* ---------- Saved panel: vertical inner scroll (page won't overflow) ---------- */
  .lp-saved-panel {
    margin-top: 24px;
    padding: 10px 12px 12px
  }
  
  .lp-saved-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 6px 8px
  }
  
  .lp-saved-scroll {
    max-height: 68vh;
    /* keep saved area inside its own scroll */
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
  
  .lp-saved-grid {
    display: grid;
    gap: 18px
}

.lp-saved-head {
  padding: 0 6px;
  margin-bottom: 6px
}

.lp-saved-name {
  font-weight: 800
}

.lp-saved-sub {
  font-size: 13px;
  color: #6b7280
}

/* Actions on saved items */
.lp-saved-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  padding: 6px 6px 10px;
}
/* Mini editor styling inside a saved card */
.lp-mini-editor {
  margin: 6px 0 10px;
  padding: 12px
}
.lp-mini-editor .lp-head-grid {
  grid-template-columns: repeat(3, minmax(160px, 1fr))
}

.lp-saved-item.editing {
  border-radius: var(--radius-lg)
}

/* Responsive */
@media (max-width:1024px) {
  .lp-head-grid {
    grid-template-columns: repeat(2, minmax(180px, 1fr));
  }

                                .lp-mini-editor .lp-head-grid {
                                  grid-template-columns: repeat(2, minmax(160px, 1fr));
                                }
}

@media (max-width:780px) {
  .lp-header-inner {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width:520px) {
  .lp-head-grid {
    grid-template-columns: 1fr;
  }

                                .lp-mini-editor .lp-head-grid {
                                  grid-template-columns: 1fr;
                                }

                                :root {
                                  --left-col: 180px;
                                  --slot-w: 200px;
  }
/* tighter columns on very small screens */
}

/* Print */
@media print {

  .lp-header-inner,
  .lp-head-editor,
  .lp-actions,
  .lp-saved-panel {
    display: none !important;
    
        .lp-scroll {
          max-height: none;
          overflow: visible
        }
        }`}</style>

    <section className="lp-only">
      <header className="lp-header">
        <div className="lp-header-inner">
          <div className="lp-header-text">
            <h1 className="lp-title">Lesson Plans</h1>
          </div>
          <div className="lp-head-controls">
            <button
              className="btn btn-primary"
              onClick={() => loadSavedWeeks(1, false)}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      {err && <div className="error-message">{err}</div>}

      {/* Saved previews (READ-ONLY) */}
      <section className="lp-saved-panel card" aria-label="Saved weeks">
        <div className="lp-saved-panel-head">
          <h3 className="lp-saved-title">Saved weeks</h3>
        </div>

        {loading && savedWeeks.length === 0 && (
          <div className="loading">Loading lesson plans...</div>
        )}

        {!loading && savedWeeks.length === 0 && (
          <div className="empty-state">No lesson plans available.</div>
        )}

        {savedWeeks.length > 0 && (
          <div className="lp-saved-scroll">
            <div className="lp-saved-grid">
              {savedWeeks.map((snap, i) => (
                <div className="lp-saved-item" key={snap._id || i}>
                  <div className="lp-saved-head">
                    <div className="lp-saved-name">
                      {snap?.head?.weekLabel || "Week"} —{" "}
                      {snap?.head?.programName || "Program"}
                    </div>
                    <div className="lp-saved-sub">
                      {snap?.head?.startDateISO
                        ? humanDate(snap.head.startDateISO)
                        : "—"}{" "}
                      –{" "}
                      {snap?.head?.endDateISO
                        ? humanDate(snap.head.endDateISO)
                        : "—"}{" "}
                      • {snap?.head?.institute || "—"}
                    </div>
                    {snap?.savedAt && (
                      <div className="lp-saved-date">
                        Saved: {new Date(snap.savedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <SavedWeekTable snap={snap} onWheelX={onWheelX} />
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="load-more-container">
                <button
                  className="btn btn-outline"
                  onClick={() => loadSavedWeeks(page + 1, true)}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </section>
    </>
  );
}
