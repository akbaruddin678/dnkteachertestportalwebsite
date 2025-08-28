import React, { useState, useEffect, useCallback } from "react";
import "./CoUploadLessonsPlans.css";
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
  );
}
