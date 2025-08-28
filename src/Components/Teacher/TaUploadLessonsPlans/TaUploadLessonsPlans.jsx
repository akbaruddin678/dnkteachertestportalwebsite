import React, { useState, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import { lessonPlanService } from "../../../services/api";
import "./TaUploadLessonsPlans.css";

// Helper functions
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
  if (!iso) return "—";
  const d = new Date(iso);
  return `${ordinal(d.getDate())} ${months[d.getMonth()]}`;
};
const formatTime = (time) => {
  if (!time) return "";
  return time.includes(":") ? time : `${time.slice(0, 2)}:${time.slice(2)}`;
};
const plus60 = (hhmm) => {
  if (!hhmm) return "";
  const [h, m] = String(hhmm).split(":").map(Number);
  const d = new Date(2000, 0, 1, h || 0, m || 0);
  d.setMinutes(d.getMinutes() + 60);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
};

// Read-only table component
function SavedWeekTable({ snap, onWheelX }) {
  const head = snap?.head || {};
  const timesSat = Array.isArray(snap?.timesSat) ? snap.timesSat : [];
  const timesSun = Array.isArray(snap?.timesSun) ? snap.timesSun : [];
  const cells = Array.isArray(snap?.cells) ? snap.cells : [];
  const unitTag = head.unitTag ? ` (${head.unitTag})` : "";
  const sundayOffset = timesSat.length;

  return (
    <div className="lp-table-wrap card lp-preview">
      <div className="lp-scroll" onWheel={onWheelX}>
        <table className="lp-table view-style">
          <tbody>
            {/* SATURDAY */}
            <tr>
              <th className="vw-day sticky-col" rowSpan={2}>
                <div className="vw-day-name">Saturday</div>
                <div className="vw-day-date">
                  {humanDate(head.startDateISO)}
                </div>
                <div className="vw-unit">
                  {head.unitSat || "—"}
                  {unitTag}
                </div>
              </th>
              {timesSat.map((t, i) => (
                <th key={`sat-t-${t}`} className="vw-time sticky-top">
                  {formatTime(t)}-{plus60(t)}
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
                <div className="vw-day-date">{humanDate(head.endDateISO)}</div>
                <div className="vw-unit">
                  {head.unitSun || "—"}
                  {unitTag}
                </div>
              </th>
              {timesSun.map((t, i) => (
                <th key={`sun-t-${t}`} className="vw-time sticky-top">
                  {formatTime(t)}-{plus60(t)}
                </th>
              ))}
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

// Main component
export default function UploadLessonsPlans() {
  const [savedWeeks, setSavedWeeks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Convert vertical wheel to horizontal inside the table
  const onWheelX = useCallback((e) => {
    const el = e.currentTarget;
    const canScrollX = el.scrollWidth > el.clientWidth;
    if (!canScrollX) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, []);

  // Load saved weeks from backend
  const loadSavedWeeks = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      setErr("");
      const response = await lessonPlanService.getAll(pageNum, 10);
      let list = Array.isArray(response?.data) ? response.data : [];

      // Sort by date (newest first)
      list.sort(
        (a, b) =>
          new Date(b.savedAt || b.createdAt) -
          new Date(a.savedAt || a.createdAt)
      );

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

  // Download as PDF
  const downloadPlanAsPDF = (plan) => {
    const doc = new jsPDF();
    const head = plan.head || {};

    // Set title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Lesson Plan", 105, 20, { align: "center" });

    // Add details
    doc.setFontSize(12);
    doc.text(`Week: ${head.weekLabel || "N/A"}`, 20, 35);
    doc.text(`Program: ${head.programName || "N/A"}`, 20, 45);
    doc.text(`Institute: ${head.institute || "N/A"}`, 20, 55);
    doc.text(
      `Date: ${humanDate(head.startDateISO)} - ${humanDate(head.endDateISO)}`,
      20,
      65
    );

    // Saturday schedule
    doc.setFontSize(14);
    doc.setTextColor(30, 64, 175);
    doc.text("Saturday", 20, 80);
    doc.setDrawColor(30, 64, 175);
    doc.line(20, 82, 50, 82);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    let yPos = 90;

    plan.timesSat.forEach((time, i) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(
        `${formatTime(time)}-${plus60(time)}: ${plan.cells[i]?.text || "—"}`,
        25,
        yPos
      );
      yPos += 7;
    });

    // Sunday schedule
    yPos += 5;
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(30, 64, 175);
    doc.text("Sunday", 20, yPos);
    doc.setDrawColor(30, 64, 175);
    doc.line(20, yPos + 2, 40, yPos + 2);

    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const satCount = plan.timesSat.length;
    plan.timesSun.forEach((time, i) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(
        `${formatTime(time)}-${plus60(time)}: ${
          plan.cells[satCount + i]?.text || "—"
        }`,
        25,
        yPos
      );
      yPos += 7;
    });

    // Save the PDF
    doc.save(`lesson-plan-${head.weekLabel || "unknown"}.pdf`);
  };

  // Filter plans based on search term
  const filteredPlans = savedWeeks.filter((plan) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const head = plan.head || {};
    return (
      (head.weekLabel || "").toLowerCase().includes(searchLower) ||
      (head.programName || "").toLowerCase().includes(searchLower) ||
      (head.institute || "").toLowerCase().includes(searchLower) ||
      (head.unitSat || "").toLowerCase().includes(searchLower) ||
      (head.unitSun || "").toLowerCase().includes(searchLower)
    );
  });

  // Load data on component mount
  useEffect(() => {
    loadSavedWeeks(1, false);
  }, []);

  return (
    <section className="lp-only">
      <header className="lp-header">
        <div className="lp-header-inner">
          <div className="lp-header-text">
            <h1 className="lp-title">Lesson Plans</h1>
            <p className="lp-subline">Manage and download your lesson plans</p>
          </div>
          <div className="lp-head-controls">
            <input
              type="text"
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
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

      {/* Saved previews */}
      <section className="lp-saved-panel card">
        <div className="lp-saved-panel-head">
          <h3 className="lp-saved-title">Saved Weeks</h3>
          <span className="lp-saved-count">
            {filteredPlans.length} plan{filteredPlans.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading && savedWeeks.length === 0 && (
          <div className="loading">Loading lesson plans...</div>
        )}

        {!loading && savedWeeks.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No lesson plans yet</h3>
            <p>Create your first lesson plan to get started</p>
          </div>
        )}

        {savedWeeks.length > 0 && filteredPlans.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No matching plans</h3>
            <p>Try adjusting your search terms</p>
          </div>
        )}

        {filteredPlans.length > 0 && (
          <div className="lp-saved-scroll">
            <div className="lp-saved-grid">
              {filteredPlans.map((snap, i) => (
                <div className="lp-saved-item card" key={snap._id || i}>
                  <div className="lp-saved-head">
                    <div className="lp-saved-name">
                      {snap?.head?.weekLabel || "Week"} —{" "}
                      {snap?.head?.programName || "Program"}
                    </div>
                    <div className="lp-saved-sub">
                      {humanDate(snap.head.startDateISO)} –{" "}
                      {humanDate(snap.head.endDateISO)} • {snap.head.institute}
                    </div>
                    {snap.savedAt && (
                      <div className="lp-saved-date">
                        Saved: {new Date(snap.savedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <SavedWeekTable snap={snap} onWheelX={onWheelX} />

                  <div className="lp-saved-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => downloadPlanAsPDF(snap)}
                    >
                      Download PDF
                    </button>
                    <button className="btn">Share</button>
                  </div>
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
