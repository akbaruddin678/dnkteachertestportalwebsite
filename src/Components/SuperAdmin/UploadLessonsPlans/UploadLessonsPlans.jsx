import React, { useState, useCallback, useEffect } from "react";
import "./UploadLessonsPlans.css";
import { lessonPlanService } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

/** ---------- Initial header ---------- */
const initialHeader = {
  city: "Islamabad",
  bannerTitle: "WEEKLY PLAN — NCLEX-RN, ISLAMABAD",
  programName: "NCLEX-RN Program — 2025",
  weekLabel: "Week 5",
  startDateISO: "2025-08-16",
  endDateISO: "2025-08-17",
  institute: "Islamabad Campus 1",
  unitSat: "Unit I–II",
  unitSun: "Unit III",
  unitTag: "AI", // shows like "(AI)"
};

/** ---------- helpers ---------- */
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
const addMinutes = (hhmm, mins) => {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  d.setMinutes(d.getMinutes() + mins);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const makeHourSeries = (start, count = 5) =>
  Array.from({ length: count }, (_, i) => addMinutes(start, i * 60));
const plus60 = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  d.setMinutes(d.getMinutes() + 60);
  return `${pad2(d.getHours())}${pad2(d.getMinutes())}`;
};
const compact = (hhmm) => hhmm.replace(":", "");
const ymd = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

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

/** ---------- Saved Week Card (view / edit / delete) ---------- */
function SavedWeekCard({ index, snap, onWheelX, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // local editable copies
  const [head, setHead] = useState(snap.head);
  const [timesSat, setTimesSat] = useState(snap.timesSat);
  const [timesSun, setTimesSun] = useState(snap.timesSun);
  const [cells, setCells] = useState(snap.cells);
  const [editingCell, setEditingCell] = useState(null);

  const saveChanges = async () => {
    try {
      setLoading(true);
      setError(null);

      const updatedData = {
        head: { ...head },
        timesSat: [...timesSat],
        timesSun: [...timesSun],
        cells: cells.map((c) => ({ text: (c.text || "").trim() })),
      };

      const response = await lessonPlanService.update(snap._id, updatedData);

      onUpdate({
        ...response.data,
        savedAt: snap.savedAt,
      });
      setEditing(false);
      setEditingCell(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update lesson plan");
      console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Delete this saved week? This cannot be undone.")) {
      try {
        setLoading(true);
        setError(null);
        await lessonPlanService.delete(snap._id);
        onDelete();
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete lesson plan");
        console.error("Delete error:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const cancelChanges = () => {
    // revert to original snapshot
    setHead(snap.head);
    setTimesSat(snap.timesSat);
    setTimesSun(snap.timesSun);
    setCells(snap.cells);
    setEditing(false);
    setEditingCell(null);
    setError(null);
  };

  const renderTimeHeaderCells = (times) =>
    times.map((start) => (
      <th className="lp-time sticky-top" key={`${index}-${start}`}>
        {start.replace(":", "")}-{plus60(start)}
      </th>
    ));

  const TopicCell = ({ idx }) => {
    const item = cells[idx];
    const isEditing = editingCell === idx;
    return (
      <td className="lp-topic" style={{ direction: "ltr" }}>
        {!isEditing ? (
          <button className="lp-topic-btn" onClick={() => setEditingCell(idx)}>
            {item?.text ? (
              <div className="lp-topic-text">{item.text}</div>
            ) : (
              <div className="lp-topic-empty">+ Add lesson</div>
            )}
          </button>
        ) : (
          <textarea
            className="lp-textarea"
            rows={4}
            value={item?.text || ""}
            placeholder="Type the topic/notes here…"
            autoFocus
            // dir="ltr" // Explicitly set the direction for text input
            onBlur={() => setEditingCell(null)}
            onChange={(e) => {
              const next = [...cells];
              next[idx] = { text: e.target.value };
              setCells(next);
            }}
            style={{
              direction: "rtl", // Ensures left-to-right writing
              textAlign: "left", // Ensures text aligns left, fixing cursor behavior
              writingMode: "horizontal-tb", // Ensures the default writing mode
            }}
          />
        )}
      </td>
    );
  };

  if (!editing) {
    return (
      <div className="lp-saved-item">
        <div className="lp-saved-head">
          <div className="lp-saved-name">
            {snap.head.weekLabel} — {snap.head.programName}
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

        {error && <div className="error-message">{error}</div>}

        <div className="lp-saved-actions">
          <button
            className="btn"
            onClick={() => setEditing(true)}
            disabled={loading}
          >
            Edit
          </button>
          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>

        <SavedWeekTable snap={snap} onWheelX={onWheelX} />
      </div>
    );
  }

  // EDIT MODE
  return (
    <div className="lp-saved-item editing">
      <div className="lp-saved-head">
        <div className="lp-saved-name">
          {head.weekLabel} — {head.programName}
        </div>
        <div className="lp-saved-sub">
          {humanDate(head.startDateISO)} – {humanDate(head.endDateISO)} •{" "}
          {head.institute}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* mini header editor */}
      <div className="lp-mini-editor card">
        <div className="lp-head-grid">
          <label>
            Banner Title
            <input
              value={head.bannerTitle}
              onChange={(e) =>
                setHead((s) => ({ ...s, bannerTitle: e.target.value }))
              }
            />
          </label>
          <label>
            Program Name
            <input
              value={head.programName}
              onChange={(e) =>
                setHead((s) => ({ ...s, programName: e.target.value }))
              }
            />
          </label>
          <label>
            Week Label
            <input
              value={head.weekLabel}
              onChange={(e) =>
                setHead((s) => ({ ...s, weekLabel: e.target.value }))
              }
            />
          </label>
          <label>
            Start Date
            <input
              type="date"
              value={head.startDateISO}
              onChange={(e) =>
                setHead((s) => ({ ...s, startDateISO: e.target.value }))
              }
            />
          </label>
          <label>
            End Date
            <input
              type="date"
              value={head.endDateISO}
              onChange={(e) =>
                setHead((s) => ({ ...s, endDateISO: e.target.value }))
              }
            />
          </label>
          <label>
            Institute
            <input
              value={head.institute}
              onChange={(e) =>
                setHead((s) => ({ ...s, institute: e.target.value }))
              }
            />
          </label>
          <label>
            Saturday Unit
            <input
              value={head.unitSat}
              onChange={(e) =>
                setHead((s) => ({ ...s, unitSat: e.target.value }))
              }
            />
          </label>
          <label>
            Sunday Unit
            <input
              value={head.unitSun}
              onChange={(e) =>
                setHead((s) => ({ ...s, unitSun: e.target.value }))
              }
            />
          </label>
          <label>
            Unit Tag
            <input
              value={head.unitTag || ""}
              onChange={(e) =>
                setHead((s) => ({ ...s, unitTag: e.target.value }))
              }
              placeholder="AI"
            />
          </label>
          <label>
            Saturday start time
            <input
              type="time"
              value={timesSat[0]}
              onChange={(e) =>
                setTimesSat(makeHourSeries(e.target.value || "00:00"))
              }
            />
            <small className="lp-hint">Generates 5 slots, 1 hour apart.</small>
          </label>
          <label>
            Sunday start time
            <input
              type="time"
              value={timesSun[0]}
              onChange={(e) =>
                setTimesSun(makeHourSeries(e.target.value || "00:00"))
              }
            />
            <small className="lp-hint">Generates 5 slots, 1 hour apart.</small>
          </label>
        </div>
      </div>

      {/* inline editor table with inner scroll */}
      <div className="lp-table-wrap card" aria-label="Saved week editor">
        <div className="lp-scroll" onWheel={onWheelX}>
          <table className="lp-table" role="table">
            <tbody>
              {/* Saturday */}
              <tr>
                <th className="lp-day" colSpan={1 + timesSat.length}>
                  <div className="lp-day-name">Saturday</div>
                  <div className="lp-day-date">
                    {humanDate(head.startDateISO)}
                  </div>
                </th>
              </tr>
              <tr className="lp-row-head">
                <th className="lp-unit sticky-col">
                  <div className="lp-unit-top">
                    {head.unitSat}
                    {head.unitTag ? ` (${head.unitTag})` : ""}
                  </div>
                  <div className="lp-unit-sub">({head.weekLabel})</div>
                </th>
                {renderTimeHeaderCells(timesSat)}
              </tr>
              <tr>
                <td className="lp-unit-spacer sticky-col" aria-hidden />
                {timesSat.map((_, i) => (
                  <TopicCell key={`e-sat-${i}`} idx={i} />
                ))}
              </tr>

              {/* Sunday */}
              <tr>
                <th className="lp-day" colSpan={1 + timesSun.length}>
                  <div className="lp-day-name">Sunday</div>
                  <div className="lp-day-date">
                    {humanDate(head.endDateISO)}
                  </div>
                </th>
              </tr>
              <tr className="lp-row-head">
                <th className="lp-unit sticky-col">
                  <div className="lp-unit-top">
                    {head.unitSun}
                    {head.unitTag ? ` (${head.unitTag})` : ""}
                  </div>
                  <div className="lp-unit-sub">({head.weekLabel})</div>
                </th>
                {renderTimeHeaderCells(timesSun)}
              </tr>
              <tr>
                <td className="lp-unit-spacer sticky-col" aria-hidden />
                {timesSun.map((_, i) => (
                  <TopicCell key={`e-sun-${i}`} idx={5 + i} />
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* actions */}
      <div className="lp-saved-actions">
        <button className="btn" onClick={cancelChanges} disabled={loading}>
          Cancel
        </button>
        <button
          className="btn btn-success"
          onClick={saveChanges}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
        <button
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={loading}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

/** ---------- Component (main editor + saved panel) ---------- */
export default function UploadLessonsPlans() {
  const [head, setHead] = useState(initialHeader);
  const [editingHead, setEditingHead] = useState(false);

  // draft content (10 cells: 5 Sat + 5 Sun)
  const [draftCells, setDraftCells] = useState([
    {
      text: "Introduction to NCLEX-RN, Clinical Judgement & Test Taking Strategies",
    },
    {
      text: "Universal Testing Toolkit & Types + How to answer NCLEX Style Questions",
    },
    {
      text: "Answering SATA Questions & How to optimize your study for NCLEX-RN",
    },
    { text: "Test Taking Strategies, Positioning & Assistive Devices" },
    { text: "Dosage Calculation" },
    { text: "Medical Terminology & Medication Administration" },
    { text: "Diets & Nutrition + Lab values" },
    { text: "ABG Interpretation & Hemodynamic Parameters" },
    { text: "Prioritization" },
    { text: "Delegation" },
  ]);

  // time slots (generated from start time; ends auto +60)
  const [timesSat, setTimesSat] = useState(makeHourSeries("15:00"));
  const [timesSun, setTimesSun] = useState(makeHourSeries("09:00"));

  // cell in edit mode
  const [editingCell, setEditingCell] = useState(null); // 0..9

  // saved snapshots (editable now)
  const [savedWeeks, setSavedWeeks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { user } = useAuth();

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

  // Load saved lesson plans on component mount
  useEffect(() => {
    loadSavedWeeks();
  }, []);

  const loadSavedWeeks = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await lessonPlanService.getAll(pageNum, 10);
      const lessonPlans = response.data;

      if (append) {
        setSavedWeeks((prev) => [...prev, ...lessonPlans]);
      } else {
        setSavedWeeks(lessonPlans);
      }

      setHasMore(lessonPlans.length === 10);
      setPage(pageNum);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load lesson plans");
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  /** Header editor — includes start times (auto 5 slots, 1h apart) */
  const HeaderEditor = () => (
    <div className="lp-head-editor card">
      <div className="lp-head-grid">
        <label>
          City
          <input
            value={head.city}
            onChange={(e) => setHead((s) => ({ ...s, city: e.target.value }))}
          />
        </label>
        <label>
          Banner Title
          <input
            value={head.bannerTitle}
            onChange={(e) =>
              setHead((s) => ({ ...s, bannerTitle: e.target.value }))
            }
          />
        </label>
        <label>
          Program Name
          <input
            value={head.programName}
            onChange={(e) =>
              setHead((s) => ({ ...s, programName: e.target.value }))
            }
          />
        </label>
        <label>
          Week Label
          <input
            value={head.weekLabel}
            onChange={(e) =>
              setHead((s) => ({ ...s, weekLabel: e.target.value }))
            }
          />
        </label>
        <label>
          Start Date
          <input
            type="date"
            value={head.startDateISO}
            onChange={(e) =>
              setHead((s) => ({ ...s, startDateISO: e.target.value }))
            }
          />
        </label>
        <label>
          End Date
          <input
            type="date"
            value={head.endDateISO}
            onChange={(e) =>
              setHead((s) => ({ ...s, endDateISO: e.target.value }))
            }
          />
        </label>
        <label>
          Institute
          <input
            value={head.institute}
            onChange={(e) =>
              setHead((s) => ({ ...s, institute: e.target.value }))
            }
          />
        </label>
        <label>
          Saturday Unit
          <input
            value={head.unitSat}
            onChange={(e) =>
              setHead((s) => ({ ...s, unitSat: e.target.value }))
            }
          />
        </label>
        <label>
          Sunday Unit
          <input
            value={head.unitSun}
            onChange={(e) =>
              setHead((s) => ({ ...s, unitSun: e.target.value }))
            }
          />
        </label>
        <label>
          Unit Tag (optional)
          <input
            value={head.unitTag || ""}
            onChange={(e) =>
              setHead((s) => ({ ...s, unitTag: e.target.value }))
            }
            placeholder="AI"
          />
        </label>

        <label>
          Saturday start time
          <input
            type="time"
            value={timesSat[0]}
            onChange={(e) =>
              setTimesSat(makeHourSeries(e.target.value || "00:00"))
            }
          />
          <small className="lp-hint">Generates 5 slots, 1 hour apart.</small>
        </label>
        <label>
          Sunday start time
          <input
            type="time"
            value={timesSun[0]}
            onChange={(e) =>
              setTimesSun(makeHourSeries(e.target.value || "00:00"))
            }
          />
          <small className="lp-hint">Generates 5 slots, 1 hour apart.</small>
        </label>
      </div>

      <div className="lp-edit-actions">
        <button
          className="btn btn-primary"
          onClick={() => setEditingHead(false)}
        >
          Done
        </button>
      </div>
    </div>
  );

  // inline topic cell editor
  const TopicCell = ({ idx }) => {
    const item = draftCells[idx];
    const isEditing = editingCell === idx;
    return (
      <td className="lp-topic">
        {!isEditing ? (
          <button className="lp-topic-btn" onClick={() => setEditingCell(idx)}>
            {item?.text ? (
              <div className="lp-topic-text">{item.text}</div>
            ) : (
              <div className="lp-topic-empty">+ Add lesson</div>
            )}
          </button>
        ) : (
          <textarea
            className="lp-textarea"
            rows={4}
            value={item?.text || ""}
            placeholder="Type the topic/notes here…"
            autoFocus
            onBlur={() => setEditingCell(null)}
            onChange={(e) => {
              const next = [...draftCells];
              next[idx] = { text: e.target.value };
              setDraftCells(next);
            }}
          />
        )}
      </td>
    );
  };

  const setToThisWeekend = () => {
    const today = new Date();
    const sat = new Date(today);
    sat.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7));
    const sun = new Date(sat);
    sun.setDate(sat.getDate() + 1);
    setHead((s) => ({ ...s, startDateISO: ymd(sat), endDateISO: ymd(sun) }));
  };

  const saveWeek = async () => {
    try {
      setSaving(true);
      setError(null);

      const lessonPlanData = {
        head: { ...head },
        timesSat: [...timesSat],
        timesSun: [...timesSun],
        cells: draftCells.map((c) => ({ text: (c.text || "").trim() })),
      };

      const response = await lessonPlanService.create(lessonPlanData);

      // Add the new lesson plan to the top of the list
      setSavedWeeks((prev) => [response.data, ...prev]);
      setEditingCell(null);

      // Show success message
      alert("Lesson plan saved successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save lesson plan");
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const renderTimeHeaderCells = (times) =>
    times.map((start) => (
      <th className="lp-time sticky-top" key={start}>
        {start.replace(":", "")}-{plus60(start)}
      </th>
    ));

  const handleLoadMore = () => {
    loadSavedWeeks(page + 1, true);
  };

  return (
    <section className="lp-only">
      <header className="lp-header">
        <div className="lp-header-inner">
          <div className="lp-header-text">
            <h1 className="lp-title">
              {head.bannerTitle || `WEEKLY PLAN — ${head.city.toUpperCase()}`}
            </h1>
            <h2 className="lp-program">{head.programName}</h2>
            <div className="lp-cycle">
              ({humanDate(head.startDateISO)} – {humanDate(head.endDateISO)} •{" "}
              {head.weekLabel})
            </div>
            <div className="lp-subline">{head.institute}</div>
          </div>
          <div className="lp-head-controls">
            <button
              className="btn btn-primary"
              onClick={() => setEditingHead(true)}
            >
              Edit header
            </button>
          </div>
        </div>
        {editingHead && <HeaderEditor />}
      </header>

      {error && <div className="error-message">{error}</div>}

      {/* Editable weekly plan (INNER SCROLL) */}
      <div className="lp-table-wrap card" aria-label="Weekly plan editor">
        <div className="lp-scroll" onWheel={onWheelX}>
          <table className="lp-table" role="table">
            <tbody>
              {/* SATURDAY */}
              <tr>
                <th className="lp-day" colSpan={1 + timesSat.length}>
                  <div className="lp-day-name">Saturday</div>
                  <div className="lp-day-date">
                    {humanDate(head.startDateISO)}
                  </div>
                </th>
              </tr>
              <tr className="lp-row-head">
                <th className="lp-unit sticky-col">
                  <div className="lp-unit-top">
                    {head.unitSat}
                    {head.unitTag ? ` (${head.unitTag})` : ""}
                  </div>
                  <div className="lp-unit-sub">({head.weekLabel})</div>
                </th>
                {renderTimeHeaderCells(timesSat)}
              </tr>
              <tr>
                <td className="lp-unit-spacer sticky-col" aria-hidden />
                {timesSat.map((_, i) => (
                  <TopicCell key={`sat-${i}`} idx={i} />
                ))}
              </tr>

              {/* SUNDAY */}
              <tr>
                <th className="lp-day" colSpan={1 + timesSun.length}>
                  <div className="lp-day-name">Sunday</div>
                  <div className="lp-day-date">
                    {humanDate(head.endDateISO)}
                  </div>
                </th>
              </tr>
              <tr className="lp-row-head">
                <th className="lp-unit sticky-col">
                  <div className="lp-unit-top">
                    {head.unitSun}
                    {head.unitTag ? ` (${head.unitTag})` : ""}
                  </div>
                  <div className="lp-unit-sub">({head.weekLabel})</div>
                </th>
                {renderTimeHeaderCells(timesSun)}
              </tr>
              <tr>
                <td className="lp-unit-spacer sticky-col" aria-hidden />
                {timesSun.map((_, i) => (
                  <TopicCell key={`sun-${i}`} idx={5 + i} />
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="lp-actions">
        <button className="btn" onClick={setToThisWeekend}>
          Set dates to this weekend
        </button>
        <button
          className="btn btn-success"
          onClick={saveWeek}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save week"}
        </button>
      </div>

      {/* Saved previews (editable & deletable) in a VERTICAL SCROLLING PANEL */}
      <section className="lp-saved-panel card" aria-label="Saved weeks">
        <div className="lp-saved-panel-head">
          <h3 className="lp-saved-title">Saved weeks</h3>
          <button
            className="btn btn-sm"
            onClick={() => loadSavedWeeks(1, false)}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading && savedWeeks.length === 0 && (
          <div className="loading">Loading lesson plans...</div>
        )}

        {!loading && savedWeeks.length === 0 && (
          <div className="empty-state">No lesson plans saved yet.</div>
        )}

        {savedWeeks.length > 0 && (
          <div className="lp-saved-scroll">
            <div className="lp-saved-grid">
              {savedWeeks.map((snap, i) => (
                <SavedWeekCard
                  key={snap._id || i}
                  index={i}
                  snap={snap}
                  onWheelX={onWheelX}
                  onUpdate={(updated) =>
                    setSavedWeeks((prev) =>
                      prev.map((s, idx) => (idx === i ? updated : s))
                    )
                  }
                  onDelete={() =>
                    setSavedWeeks((prev) => prev.filter((_, idx) => idx !== i))
                  }
                />
              ))}
            </div>

            {hasMore && (
              <div className="load-more-container">
                <button
                  className="btn btn-outline"
                  onClick={handleLoadMore}
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
