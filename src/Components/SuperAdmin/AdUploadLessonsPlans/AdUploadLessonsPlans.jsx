import React, { useState, useCallback, useEffect } from "react";
import { lessonPlanService } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import "./AdUploadLessonsPlans.css";

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

  const stickyColStyle = {
    position: "sticky",
    left: 0,
    background: "#f0f4f8",
    zIndex: 2,
    border: "1px solid #e0e0e0",
    padding: "10px 12px",
    textAlign: "left",
  };

  const stickyTopStyle = {
    position: "sticky",
    top: 0,
    background: "#f0f4f8",
    zIndex: 1,
    border: "1px solid #e0e0e0",
    padding: "10px 12px",
    textAlign: "left",
  };

  const topicStyle = {
    border: "1px solid #e0e0e0",
    padding: "10px 12px",
    textAlign: "left",
    minWidth: "150px",
  };

  return (
    <div
      style={{
        margin: "20px 0",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        background: "#eee2e2ff",
      }}
      aria-label="Saved weekly plan (read only)"
    >
      <div
        style={{
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
        onWheel={onWheelX}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
          role="table"
        >
          <tbody>
            {/* SATURDAY */}
            <tr>
              <th
                style={{ ...stickyColStyle, verticalAlign: "top" }}
                rowSpan={2}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  Saturday
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  {head.startDateISO ? humanDate(head.startDateISO) : "—"}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontStyle: "italic",
                  }}
                >
                  {head.unitSat || "—"}
                  {unitTag}
                </div>
              </th>
              {timesSat.map((t, i) => (
                <th key={`sat-t-${t}`} style={stickyTopStyle}>
                  {compact(t)}-{plus60(t)}
                </th>
              ))}
            </tr>
            <tr>
              {timesSat.map((_, i) => (
                <td key={`sat-c-${i}`} style={topicStyle}>
                  {cells[i]?.text ? (
                    <div
                      style={{
                        lineHeight: "1.4",
                      }}
                    >
                      {cells[i].text}
                    </div>
                  ) : (
                    <div
                      style={{
                        color: "#bf1c1cff",
                        fontStyle: "italic",
                      }}
                    >
                      —
                    </div>
                  )}
                </td>
              ))}
            </tr>

            {/* SUNDAY */}
            <tr>
              <th
                style={{ ...stickyColStyle, verticalAlign: "top" }}
                rowSpan={2}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  Sunday
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  {head.endDateISO ? humanDate(head.endDateISO) : "—"}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontStyle: "italic",
                  }}
                >
                  {head.unitSun || "—"}
                  {unitTag}
                </div>
              </th>
              {timesSun.map((t, i) => {
                const idx = sundayOffset + i;
                return (
                  <th key={`sun-t-${t}`} style={stickyTopStyle}>
                    {compact(t)}-{plus60(t)}
                  </th>
                );
              })}
            </tr>
            <tr>
              {timesSun.map((_, i) => {
                const idx = sundayOffset + i;
                return (
                  <td key={`sun-c-${i}`} style={topicStyle}>
                    {cells[idx]?.text ? (
                      <div
                        style={{
                          lineHeight: "1.4",
                        }}
                      >
                        {cells[idx].text}
                      </div>
                    ) : (
                      <div
                        style={{
                          color: "#999",
                          fontStyle: "italic",
                        }}
                      >
                        —
                      </div>
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

  // Inline styles
  const savedItemStyle = {
    marginBottom: "30px",
    padding: "20px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    background: "#cfbfbfff",
  };

  const savedHeadStyle = {
    marginBottom: "15px",
  };

  const savedNameStyle = {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "5px",
  };

  const savedSubStyle = {
    fontSize: "14px",
    color: "#666",
    marginBottom: "5px",
  };

  const savedDateStyle = {
    fontSize: "12px",
    color: "#999",
  };

  const errorMessageStyle = {
    color: "#d32f2f",
    padding: "10px",
    margin: "10px 0",
    background: "#ffebee",
    borderRadius: "4px",
  };

  const savedActionsStyle = {
    display: "flex",
    gap: "10px",
    marginBottom: "15px",
  };

  const btnDangerStyle = {
    padding: "8px 16px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    background: "#f5f5f5",
    cursor: "pointer",
    background: "#f44336",
    color: "#000",
    border: "none",
  };

  const miniEditorStyle = {
    padding: "15px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    marginBottom: "15px",
    background: "#f9f9f9",
  };

  const headGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "15px",
  };

  const labelStyle = {
    display: "flex",
    flexDirection: "column",
    fontSize: "14px",
  };

  const inputStyle = {
    padding: "8px 10px",
    border: "1px solid #c51d1dff",
    borderRadius: "4px",
    fontSize: "14px",
  };

  const hintStyle = {
    fontSize: "12px",
    color: "#666",
    marginTop: "4px",
  };

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
      <th
        style={{
          background: "#f0f4f8",
          padding: "10px",
          fontWeight: "bold",
          textAlign: "center",
          minWidth: "100px",
        }}
        key={`${index}-${start}`}
      >
        {start.replace(":", "")}-{plus60(start)}
      </th>
    ));

  const TopicCell = ({ idx }) => {
    const item = cells[idx];
    const isEditing = editingCell === idx;
    return (
      <td
        style={{
          padding: "10px",
          border: "1px solid #e0e0e0",
          minWidth: "150px",

          verticalAlign: "top",
        }}
      >
        {!isEditing ? (
          <button
            style={{
              width: "100%",
              height: "100%",
              minHeight: "80px",
              border: "1px dashed #ccc",
              background: "transparent",
              cursor: "pointer",
              textAlign: "left",
              padding: "10px",
            }}
            onClick={() => setEditingCell(idx)}
          >
            {item?.text ? (
              <div
                style={{
                  lineHeight: "1.4",
                }}
              >
                {item.text}
              </div>
            ) : (
              <div
                style={{
                  color: "#999",
                  fontStyle: "italic",
                }}
              >
                + Add lesson
              </div>
            )}
          </button>
        ) : (
          <textarea
            style={{
              width: "100%",
              minHeight: "80px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              resize: "vertical",
              fontFamily: "inherit",

              fontSize: "14px",
            }}
            rows={4}
            value={item?.text || ""}
            placeholder="Type the topic/notes here…"
            autoFocus
            onBlur={() => setEditingCell(null)}
            onChange={(e) => {
              const next = [...cells];
              next[idx] = { text: e.target.value };
              setCells(next);
            }}
          />
        )}
      </td>
    );
  };

  if (!editing) {
    return (
      <div style={savedItemStyle}>
        <div style={savedHeadStyle}>
          <div style={savedNameStyle}>
            {snap.head.weekLabel} — {snap.head.programName}
          </div>
          <div style={savedSubStyle}>
            {humanDate(snap.head.startDateISO)} –{" "}
            {humanDate(snap.head.endDateISO)} • {snap.head.institute}
          </div>
          {snap.savedAt && (
            <div style={savedDateStyle}>
              Saved: {new Date(snap.savedAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {error && <div style={errorMessageStyle}>{error}</div>}

        <div style={savedActionsStyle}>
          <button
            style={{
              padding: "8px 16px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              background: "#075303ff",
              cursor: "pointer",
            }}
            onClick={() => setEditing(true)}
            disabled={loading}
          >
            Edit
          </button>
          <button
            style={btnDangerStyle}
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
    <div style={{ ...savedItemStyle, borderColor: "#1976d2" }}>
      <div style={savedHeadStyle}>
        <div style={savedNameStyle}>
          {head.weekLabel} — {head.programName}
        </div>
        <div style={savedSubStyle}>
          {humanDate(head.startDateISO)} – {humanDate(head.endDateISO)} •{" "}
          {head.institute}
        </div>
      </div>

      {error && <div style={errorMessageStyle}>{error}</div>}

      {/* mini header editor */}
      <div style={miniEditorStyle}>
        <div style={headGridStyle}>
          <label style={labelStyle}>
            Banner Title
            <input
              style={inputStyle}
              value={head.bannerTitle}
              onChange={(e) =>
                setHead((s) => ({ ...s, bannerTitle: e.target.value }))
              }
            />
          </label>
          <label style={labelStyle}>
            Program Name
            <input
              style={inputStyle}
              value={head.programName}
              onChange={(e) =>
                setHead((s) => ({ ...s, programName: e.target.value }))
              }
            />
          </label>
          <label style={labelStyle}>
            Week Label
            <input
              style={inputStyle}
              value={head.weekLabel}
              onChange={(e) =>
                setHead((s) => ({ ...s, weekLabel: e.target.value }))
              }
            />
          </label>
          <label style={labelStyle}>
            Start Date
            <input
              style={inputStyle}
              type="date"
              value={head.startDateISO}
              onChange={(e) =>
                setHead((s) => ({ ...s, startDateISO: e.target.value }))
              }
            />
          </label>
          <label style={labelStyle}>
            End Date
            <input
              style={inputStyle}
              type="date"
              value={head.endDateISO}
              onChange={(e) =>
                setHead((s) => ({ ...s, endDateISO: e.target.value }))
              }
            />
          </label>
          <label style={labelStyle}>
            Institute
            <input
              style={inputStyle}
              value={head.institute}
              onChange={(e) =>
                setHead((s) => ({ ...s, institute: e.target.value }))
              }
            />
          </label>
          <label style={labelStyle}>
            Saturday Unit
            <input
              style={inputStyle}
              value={head.unitSat}
              onChange={(e) =>
                setHead((s) => ({ ...s, unitSat: e.target.value }))
              }
            />
          </label>
          <label style={labelStyle}>
            Sunday Unit
            <input
              style={inputStyle}
              value={head.unitSun}
              onChange={(e) =>
                setHead((s) => ({ ...s, unitSun: e.target.value }))
              }
            />
          </label>
          <label style={labelStyle}>
            Unit Tag
            <input
              style={inputStyle}
              value={head.unitTag || ""}
              onChange={(e) =>
                setHead((s) => ({ ...s, unitTag: e.target.value }))
              }
              placeholder="AI"
            />
          </label>
          <label style={labelStyle}>
            Saturday start time
            <input
              style={inputStyle}
              type="time"
              value={timesSat[0]}
              onChange={(e) =>
                setTimesSat(makeHourSeries(e.target.value || "00:00"))
              }
            />
            <small style={hintStyle}>Generates 5 slots, 1 hour apart.</small>
          </label>
          <label style={labelStyle}>
            Sunday start time
            <input
              style={inputStyle}
              type="time"
              value={timesSun[0]}
              onChange={(e) =>
                setTimesSun(makeHourSeries(e.target.value || "00:00"))
              }
            />
            <small style={hintStyle}>Generates 5 slots, 1 hour apart.</small>
          </label>
        </div>
      </div>

      {/* inline editor table with inner scroll */}
      <div
        style={{
          // margin: "20px 0",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          background: "#e8e3e3ff",
        }}
        aria-label="Saved week editor"
      >
        <div
          style={{
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
          onWheel={onWheelX}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
            role="table"
          >
            <tbody>
              {/* Saturday */}
              <tr>
                <th
                  style={{
                    background: "#f0f4f8",
                    // padding: "10px",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                  colSpan={1 + timesSat.length}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "16px",
                    }}
                  >
                    Saturday
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#666",
                    }}
                  >
                    {humanDate(head.startDateISO)}
                  </div>
                </th>
              </tr>
              <tr>
                <th
                  style={{
                    background: "#f0f4f8",
                    // padding: "10px",
                    fontWeight: "bold",
                    textAlign: "center",
                    minWidth: "120px",

                    fontSize: "14px",
                    fontStyle: "italic",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                    }}
                  >
                    {head.unitSat}
                    {head.unitTag ? ` (${head.unitTag})` : ""}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    ({head.weekLabel})
                  </div>
                </th>
                {renderTimeHeaderCells(timesSat)}
              </tr>
              <tr>
                <td
                  style={{
                    background: "#f0f4f8",
                    border: "1px solid #e0e0e0",
                    minWidth: "120px",
                  }}
                  aria-hidden
                />
                {timesSat.map((_, i) => (
                  <TopicCell key={`e-sat-${i}`} idx={i} />
                ))}
              </tr>

              {/* Sunday */}
              <tr>
                <th
                  style={{
                    background: "#f0f4f8",
                    padding: "10px",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                  colSpan={1 + timesSun.length}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "16px",
                    }}
                  >
                    Sunday
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#666",
                    }}
                  >
                    {humanDate(head.endDateISO)}
                  </div>
                </th>
              </tr>
              <tr>
                <th
                  style={{
                    background: "#f0f4f8",
                    padding: "10px",
                    fontWeight: "bold",
                    textAlign: "center",
                    minWidth: "120px",

                    fontSize: "14px",
                    fontStyle: "italic",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                    }}
                  >
                    {head.unitSun}
                    {head.unitTag ? ` (${head.unitTag})` : ""}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    ({head.weekLabel})
                  </div>
                </th>
                {renderTimeHeaderCells(timesSun)}
              </tr>
              <tr>
                <td
                  style={{
                    background: "#f0f4f8",
                    border: "1px solid #e0e0e0",
                    minWidth: "120px",
                  }}
                  aria-hidden
                />
                {timesSun.map((_, i) => (
                  <TopicCell key={`e-sun-${i}`} idx={5 + i} />
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* actions */}
      <div style={savedActionsStyle}>
        <button
          style={{
            padding: "8px 16px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "#f5f5f5",
            cursor: "pointer",
          }}
          onClick={cancelChanges}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          style={{
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            background: "#4caf50",
            color: "#000",
            border: "none",
          }}
          onClick={saveChanges}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
        <button
          style={btnDangerStyle}
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
  const HeaderEditor = () => {
    const headEditorStyle = {
      padding: "20px",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      marginBottom: "20px",
      background: "#f9f9f9",
    };

    const editActionsStyle = {
      marginTop: "15px",
      display: "flex",
      justifyContent: "flex-end",
    };

    return (
      <div style={headEditorStyle}>
        <div style={headGridStyle}>
          <label style={labelStyle}>
            City
            <input
              style={inputStyle}
              value={head.city}
              onChange={(e) => setHead((s) => ({ ...s, city: e.target.value }))}
            />
          </label>
          <label style={labelStyle}>
            Banner Title
            <input
              style={inputStyle}
              value={head.bannerTitle}
              onChange={(e) =>
                setHead((s) => ({ ...s, bannerTitle: e.target.value }))
              }
            />
          </label>
          <label style={labelStyle}>
            Program Name
            <input
              style={inputStyle}
              value={head.programName}
              onChange={(e) =>
                setHead((s) => ({ ...s, programName: e.target.value }))
              }
            />
          </label>
          <label style={labelStyle}>
            Week Label
            <input
              style={inputStyle}
              value={head.weekLabel}
              onChange={(e) =>
                setHead((s) => ({ ...s, weekLabel: e.target.value }))
              }
            />
          </label>
          <label style={labelStyle}>
            Start Date
            <input
              style={inputStyle}
              type="date"
              value={head.startDateISO}
              onChange={(e) =>
                setHead((s) => ({ ...s, startDateISO: e.target.value }))
              }
            />
          </label>
          <label style={labelStyle}>
            End Date
            <input
              style={inputStyle}
              type="date"
              value={head.endDateISO}
              onChange={(e) =>
                setHead((s) => ({ ...s, endDateISO: e.target.value }))
              }
            />
          </label>
          <label style={labelStyle}>
            Institute
            <input
              style={inputStyle}
              value={head.institute}
              onChange={(e) =>
                setHead((s) => ({ ...s, institute: e.target.value }))
              }
            />
          </label>
          <label style={labelStyle}>
            Saturday Unit
            <input
              style={inputStyle}
              value={head.unitSat}
              onChange={(e) =>
                setHead((s) => ({ ...s, unitSat: e.target.value }))
              }
            />
          </label>
          <label style={labelStyle}>
            Sunday Unit
            <input
              style={inputStyle}
              value={head.unitSun}
              onChange={(e) =>
                setHead((s) => ({ ...s, unitSun: e.target.value }))
              }
            />
          </label>
          <label style={labelStyle}>
            Unit Tag (optional)
            <input
              style={inputStyle}
              value={head.unitTag || ""}
              onChange={(e) =>
                setHead((s) => ({ ...s, unitTag: e.target.value }))
              }
              placeholder="AI"
            />
          </label>

          <label style={labelStyle}>
            Saturday start time
            <input
              style={inputStyle}
              type="time"
              value={timesSat[0]}
              onChange={(e) =>
                setTimesSat(makeHourSeries(e.target.value || "00:00"))
              }
            />
            <small style={hintStyle}>Generates 5 slots, 1 hour apart.</small>
          </label>
          <label style={labelStyle}>
            Sunday start time
            <input
              style={inputStyle}
              type="time"
              value={timesSun[0]}
              onChange={(e) =>
                setTimesSun(makeHourSeries(e.target.value || "00:00"))
              }
            />
            <small style={hintStyle}>Generates 5 slots, 1 hour apart.</small>
          </label>
        </div>

        <div style={editActionsStyle}>
          <button
            style={{
              padding: "8px 16px",
              background: "#1976d2",
              color: "#000",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => setEditingHead(false)}
          >
            Done
          </button>
        </div>
      </div>
    );
  };

  // Inline styles for main component
  const sectionStyle = {
    padding: "30px",
    maxWidth: "1100px",
    margin: "auto",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)",
  };

  const headerStyle = {
    marginBottom: "25px",
  };

  const headerInnerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  };

  const headerTextStyle = {
    flex: 1,
  };

  const titleStyle = {
    fontSize: "28px",
    color: "#333",
    fontWeight: "600",
    marginBottom: "10px",
  };

  const programStyle = {
    fontSize: "18px",
    color: "#555",
    marginBottom: "8px",
  };

  const cycleStyle = {
    fontSize: "14px",
    color: "#666",
    marginBottom: "5px",
  };

  const sublineStyle = {
    fontSize: "14px",
    color: "#777",
  };

  const headControlsStyle = {
    marginLeft: "20px",
  };

  const actionsStyle = {
    display: "flex",
    gap: "10px",
    margin: "20px 0",
  };

  const savedPanelStyle = {
    padding: "20px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    marginTop: "30px",
    background: "#fff",
  };

  const savedPanelHeadStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  };

  const savedTitleStyle = {
    fontSize: "20px",
    fontWeight: "bold",
  };

  const btnSmStyle = {
    padding: "6px 12px",
    fontSize: "12px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    background: "#f5f5f5",
    cursor: "pointer",
  };

  const loadingStyle = {
    padding: "20px",
    textAlign: "center",
    color: "#666",
  };

  const emptyStateStyle = {
    padding: "30px",
    textAlign: "center",
    color: "#999",
    fontStyle: "italic",
  };

  const savedScrollStyle = {
    maxHeight: "500px",
    overflowY: "auto",
  };

  const savedGridStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  };

  const loadMoreContainerStyle = {
    textAlign: "center",
    marginTop: "20px",
  };

  const btnOutlineStyle = {
    padding: "8px 16px",
    border: "1px solid #1976d2",
    background: "transparent",
    color: "#1976d2",
    borderRadius: "4px",
    cursor: "pointer",
  };

  // inline topic cell editor
  const TopicCell = ({ idx }) => {
    const item = draftCells[idx];
    const isEditing = editingCell === idx;
    return (
      <td
        style={{
          padding: "10px",
          border: "1px solid #e0e0e0",
          minWidth: "150px",
          verticalAlign: "top",
        }}
      >
        {!isEditing ? (
          <button
            style={{
              width: "100%",
              height: "100%",
              minHeight: "80px",
              border: "1px dashed #ccc",
              background: "transparent",
              cursor: "pointer",
              textAlign: "left",
              padding: "10px",
            }}
            onClick={() => setEditingCell(idx)}
          >
            {item?.text ? (
              <div
                style={{
                  lineHeight: "1.4",
                }}
              >
                {item.text}
              </div>
            ) : (
              <div
                style={{
                  color: "#999",
                  fontStyle: "italic",
                }}
              >
                + Add lesson
              </div>
            )}
          </button>
        ) : (
          <textarea
            style={{
              width: "100%",
              minHeight: "80px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              resize: "vertical",
              fontFamily: "inherit",
              fontSize: "14px",
            }}
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
      <th
        style={{
          background: "#f0f4f8",
          padding: "10px",
          fontWeight: "bold",
          textAlign: "center",
          minWidth: "100px",
        }}
        key={start}
      >
        {start.replace(":", "")}-{plus60(start)}
      </th>
    ));

  const handleLoadMore = () => {
    loadSavedWeeks(page + 1, true);
  };

  return (
    <section style={sectionStyle}>
      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <div style={headerTextStyle}>
            <h1 style={titleStyle}>
              {head.bannerTitle || `WEEKLY PLAN — ${head.city.toUpperCase()}`}
            </h1>
            <h2 style={programStyle}>{head.programName}</h2>
            <div style={cycleStyle}>
              ({humanDate(head.startDateISO)} – {humanDate(head.endDateISO)} •{" "}
              {head.weekLabel})
            </div>
            <div style={sublineStyle}>{head.institute}</div>
          </div>
          <div style={headControlsStyle}>
            <button
              style={{
                padding: "8px 16px",
                background: "#1976d2",
                color: "#000",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={() => setEditingHead(true)}
            >
              Edit header
            </button>
          </div>
        </div>
        {editingHead && <HeaderEditor />}
      </header>

      {error && <div style={errorMessageStyle}>{error}</div>}

      {/* Editable weekly plan (INNER SCROLL) */}
      <div
        style={{
          margin: "20px 0",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          background: "#fff",
        }}
        aria-label="Weekly plan editor"
      >
        <div
          style={{
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
          onWheel={onWheelX}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
            role="table"
          >
            <tbody>
              {/* SATURDAY */}
              <tr>
                <th
                  style={{
                    background: "#f0f4f8",
                    padding: "10px",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                  colSpan={1 + timesSat.length}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "16px",
                    }}
                  >
                    Saturday
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#666",
                    }}
                  >
                    {humanDate(head.startDateISO)}
                  </div>
                </th>
              </tr>
              <tr>
                <th
                  style={{
                    background: "#f0f4f8",
                    padding: "10px",
                    fontWeight: "bold",
                    textAlign: "center",
                    minWidth: "120px",

                    fontSize: "14px",
                    fontStyle: "italic",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                    }}
                  >
                    {head.unitSat}
                    {head.unitTag ? ` (${head.unitTag})` : ""}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    ({head.weekLabel})
                  </div>
                </th>
                {renderTimeHeaderCells(timesSat)}
              </tr>
              <tr>
                <td
                  style={{
                    background: "#f0f4f8",
                    border: "1px solid #e0e0e0",
                    minWidth: "120px",
                    color: "black",
                  }}
                  aria-hidden
                />
                {timesSat.map((_, i) => (
                  <TopicCell key={`sat-${i}`} idx={i} />
                ))}
              </tr>

              {/* SUNDAY */}
              <tr>
                <th
                  style={{
                    background: "#f0f4f8",
                    padding: "10px",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                  colSpan={1 + timesSun.length}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "16px",
                      color: "black",
                    }}
                  >
                    Sunday
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#666",
                    }}
                  >
                    {humanDate(head.endDateISO)}
                  </div>
                </th>
              </tr>
              <tr>
                <th
                  style={{
                    background: "#f0f4f8",
                    padding: "10px",
                    fontWeight: "bold",
                    textAlign: "center",
                    minWidth: "120px",

                    fontSize: "14px",
                    fontStyle: "italic",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                    }}
                  >
                    {head.unitSun}
                    {head.unitTag ? ` (${head.unitTag})` : ""}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    ({head.weekLabel})
                  </div>
                </th>
                {renderTimeHeaderCells(timesSun)}
              </tr>
              <tr>
                <td
                  style={{
                    background: "#f0f4f8",
                    border: "1px solid #e0e0e0",
                    minWidth: "120px",
                  }}
                  aria-hidden
                />
                {timesSun.map((_, i) => (
                  <TopicCell key={`sun-${i}`} idx={5 + i} />
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={actionsStyle}>
        <button
          style={{
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            background: "#0f69d1ff",
            color: "#ffffffff",
            border: "none",
          }}
          onClick={saveWeek}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save week"}
        </button>
      </div>

      {/* Saved previews (editable & deletable) in a VERTICAL SCROLLING PANEL */}
      <section style={savedPanelStyle} aria-label="Saved weeks">
        <div style={savedPanelHeadStyle}>
          <h3 style={savedTitleStyle}>Saved weeks</h3>
          <button
            style={btnSmStyle}
            onClick={() => loadSavedWeeks(1, false)}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading && savedWeeks.length === 0 && (
          <div style={loadingStyle}>Loading Lesson Plans...</div>
        )}

        {!loading && savedWeeks.length === 0 && (
          <div style={emptyStateStyle}>No Lesson Plans Saved yet.</div>
        )}

        {savedWeeks.length > 0 && (
          <div style={savedScrollStyle}>
            <div style={savedGridStyle}>
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
              <div style={loadMoreContainerStyle}>
                <button
                  style={btnOutlineStyle}
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