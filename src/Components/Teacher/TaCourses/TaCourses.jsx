import React, { useEffect, useMemo, useState } from "react";
import {
  MdSearch,
  MdExpandMore,
  MdExpandLess,
  MdAssessment,
  MdArrowBack,
  MdGrade,
  MdAdd,
  MdEdit,
  MdDelete,
  MdSave,
} from "react-icons/md";

const API_BASE = "/api/v1";
const token = () => localStorage.getItem("token");

const TYPE_OPTIONS = [
  "quiz",
  "assignment",
  "midterm",
  "final",
  "project",
  "practical",
  "viva",
];

const CoursesOffered = () => {
  const [courses, setCourses] = useState([]);
  const [query, setQuery] = useState("");
  const [expandedCourse, setExpandedCourse] = useState(null);

  const [view, setView] = useState("courses"); // 'courses' | 'assessment'
  const [currentCourseId, setCurrentCourseId] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState({
    title: "",
    type: "quiz",
    totalMarks: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const [marksDraft, setMarksDraft] = useState({});
  const [marksDirty, setMarksDirty] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  // Cache: assessments per course, students per course
  const [batches, setBatches] = useState({});
  const [courseStudents, setCourseStudents] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ---------- Load teacher courses ----------
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/teacher/courses`, {
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || `Failed to fetch courses: ${res.status}`);
      }
      const json = await res.json();
      if (json.success) setCourses(json.data || []);
    } catch (e) {
      setError(e.message || "Failed to fetch courses.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Load students for a course (with fallback to campus-wide students) ----------
  const fetchCourseStudents = async (courseId) => {
    if (!courseId) return [];
    // Return cached
    if (courseStudents[courseId]) return courseStudents[courseId];

    // Try course-specific endpoint first
    try {
      const res = await fetch(
        `${API_BASE}/teacher/courses/${courseId}/students`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      if (res.ok) {
        const json = await res.json();
        const arr =
          json?.data?.students ||
          json?.students ||
          json?.data ||
          [];
        if (Array.isArray(arr) && arr.length > 0) {
          setCourseStudents((p) => ({ ...p, [courseId]: arr }));
          return arr;
        }
      }
      // If not ok or empty, fall through to campus endpoint
    } catch {
      // ignore and fallback
    }

    // Fallback: campus students (teacher/studentdetails) → use everyone
    try {
      const res2 = await fetch(`${API_BASE}/teacher/studentdetails`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res2.ok) throw new Error("Failed to fetch campus students");
      const json2 = await res2.json();
      const arr2 = json2?.data?.students || [];
      setCourseStudents((p) => ({ ...p, [courseId]: arr2 }));
      return arr2;
    } catch (e) {
      console.error("Fallback students error:", e);
      setError("Unable to load students.");
      return [];
    }
  };

  // ---------- Load assessments for a course ----------
  const fetchCourseBatches = async (courseId) => {
    try {
      const res = await fetch(`${API_BASE}/assessments/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setError(e.message || "Failed to fetch assessments");
        return [];
      }
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      setError("Failed to fetch assessments. Please check your connection.");
      return [];
    }
  };

  // ---------- Normalize results payload ----------
  const normalizeBatch = (data) => {
    if (!data) return { assessment: {}, results: [] };
    // Accept: { assessment, results } OR { _id,title,type,totalMarks,date,description, results }
    if (data.assessment) {
      return {
        assessment: data.assessment,
        results: Array.isArray(data.results) ? data.results : [],
      };
    }
    const { _id, title, type, totalMarks, date, description } = data;
    return {
      assessment: { _id, title, type, totalMarks, date, description },
      results: Array.isArray(data.results) ? data.results : [],
    };
  };

  // ---------- Load one assessment with results ----------
  const fetchAssessmentBatch = async (assessmentId) => {
    try {
      const res = await fetch(
        `${API_BASE}/assessments/${assessmentId}/results`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setError(e.message || "Failed to fetch assessment details");
        return null;
      }
      const json = await res.json();
      // json.data = { assessment, results }
      return normalizeBatch(json.data);
    } catch (e) {
      setError(
        "Failed to fetch assessment details. Please check your connection."
      );
      return null;
    }
  };

  // ---------- Create assessment (returns richer result for 409 handling) ----------
  const createAssessment = async (assessmentData) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/assessments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assessmentData),
      });

      // Success
      if (res.ok) {
        const json = await res.json();
        return { success: true, data: json.data };
      }

      // Error
      const e = await res.json().catch(() => ({}));
      return {
        success: false,
        status: res.status,
        message: e.message || "Failed to create assessment",
      };
    } catch (e) {
      return {
        success: false,
        status: 500,
        message: "Failed to create assessment. Please check your connection.",
      };
    } finally {
      setLoading(false);
    }
  };

  // ---------- Bulk mark update ----------
  const updateMarks = async (assessmentId, entries) => {
    try {
      setSavingMarks(true);
      const res = await fetch(
        `${API_BASE}/assessments/${assessmentId}/marks/bulk`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ students: entries }),
        }
      );
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setError(e.message || "Failed to update marks");
        return null;
      }
      const json = await res.json();
      return json;
    } catch (e) {
      setError("Failed to update marks. Please check your connection.");
      return null;
    } finally {
      setSavingMarks(false);
    }
  };

  // ---------- Delete assessment ----------
  const deleteAssessment = async (assessmentId) => {
    try {
      const res = await fetch(`${API_BASE}/assessments/${assessmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      return res.ok;
    } catch (e) {
      setError("Failed to delete assessment. Please check your connection.");
      return false;
    }
  };

  // ---------- Initial load ----------
  useEffect(() => {
    fetchCourses();
  }, []);

  // ---------- Search filter ----------
  const filteredCourses = useMemo(() => {
    if (!query.trim()) return courses;
    const q = query.toLowerCase();
    return (courses || []).filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.code || "").toLowerCase().includes(q)
    );
  }, [courses, query]);

  // ---------- Create modal submit ----------
  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    setError("");

    if (!currentCourseId) {
      setError("Please select a course.");
      return;
    }
    const assessmentData = {
      title: form.title?.trim(),
      type: form.type,
      courseId: currentCourseId,
      totalMarks: Number(form.totalMarks),
      date: form.date,
      description: form.description,
    };

    const created = await createAssessment(assessmentData);

    // Success path: refresh list, open new assessment
    if (created?.success) {
      setSuccess("Assessment created successfully!");
      setShowModal(false);

      // Refresh batches for the course
      const updatedBatches = await fetchCourseBatches(currentCourseId);
      setBatches((prev) => ({ ...prev, [currentCourseId]: updatedBatches }));

      const createdId = created.data?._id || created.data?.assessment?._id;
      if (createdId) {
        // Ensure students and open assessment
        let students = courseStudents[currentCourseId];
        if (!students) students = await fetchCourseStudents(currentCourseId);

        const batch = await fetchAssessmentBatch(createdId);
        if (batch) {
          setSelectedBatch(batch);
          setView("assessment");

          const draft = {};
          const resultsMap = new Map(
            (batch.results || []).map((r) => [r?.student?._id, r])
          );
          (students || []).forEach((stu) => {
            const r = resultsMap.get(stu._id);
            draft[stu._id] = {
              marks: r ? r.marks : "",
              remarks: r?.remarks || "",
            };
          });
          setMarksDraft(draft);
          setMarksDirty(false);
        }
      }
      return;
    }

    // 409 Conflict: open the existing assessment with same (title, type)
    if (created?.status === 409) {
      // Refresh batches to find the existing one
      const updatedBatches = await fetchCourseBatches(currentCourseId);
      setBatches((prev) => ({ ...prev, [currentCourseId]: updatedBatches }));

      const existing = (updatedBatches || []).find(
        (b) =>
          (b.title || "").trim().toLowerCase() ===
            (form.title || "").trim().toLowerCase() &&
          String(b.type) === String(form.type)
      );

      if (existing) {
        setShowModal(false);
        setSuccess("Opened existing assessment with same title & type.");

        // Ensure students and open assessment
        let students = courseStudents[currentCourseId];
        if (!students) students = await fetchCourseStudents(currentCourseId);

        const batch = await fetchAssessmentBatch(existing._id);
        if (batch) {
          setSelectedBatch(batch);
          setView("assessment");

          const draft = {};
          const resultsMap = new Map(
            (batch.results || []).map((r) => [r?.student?._id, r])
          );
          (students || []).forEach((stu) => {
            const r = resultsMap.get(stu._id);
            draft[stu._id] = {
              marks: r ? r.marks : "",
              remarks: r?.remarks || "",
            };
          });
          setMarksDraft(draft);
          setMarksDirty(false);
        }
        return;
      }

      // If not found, show the backend message
      setError(created?.message || "This assessment already exists.");
      return;
    }

    // Other errors
    setError(created?.message || "Failed to create assessment");
  };

  const handleSaveMarks = async () => {
    if (!selectedBatch?.assessment?._id) return;

    const entries = Object.entries(marksDraft)
      .filter(
        ([, data]) =>
          data &&
          data.marks !== "" &&
          data.marks !== null &&
          !isNaN(Number(data.marks))
      )
      .map(([studentId, data]) => ({
        studentId,
        marks: Number(data.marks),
        remarks: data.remarks || "",
      }));

    const res = await updateMarks(selectedBatch.assessment._id, entries);
    if (res && res.success) {
      setMarksDirty(false);
      setSuccess("Marks saved successfully!");

      // Reload results to reflect saved values
      const refreshed = await fetchAssessmentBatch(selectedBatch.assessment._id);
      if (refreshed) {
        setSelectedBatch(refreshed);
        const draft = { ...marksDraft };
        (refreshed.results || []).forEach((r) => {
          draft[r.student._id] = {
            marks: r.marks,
            remarks: r.remarks || "",
          };
        });
        setMarksDraft(draft);
      }
    }
  };

  const handleDeleteAssessment = async (assessmentId) => {
    if (!assessmentId) return;
    if (window.confirm("Are you sure you want to delete this assessment?")) {
      const ok = await deleteAssessment(assessmentId);
      if (ok) {
        setSuccess("Assessment deleted successfully!");
        // Refresh course batches
        const updatedBatches = await fetchCourseBatches(currentCourseId);
        setBatches((prev) => ({ ...prev, [currentCourseId]: updatedBatches }));

        if (selectedBatch && selectedBatch.assessment._id === assessmentId) {
          setSelectedBatch(null);
          setView("courses");
        }
      }
    }
  };

  const toggleExpand = async (courseId) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
      return;
    }
    setExpandedCourse(courseId);
    setCurrentCourseId(courseId);

    // Load batches if not cached
    if (!batches[courseId]) {
      const courseBatches = await fetchCourseBatches(courseId);
      setBatches((prev) => ({ ...prev, [courseId]: courseBatches }));
    }
    // Preload students for this course (will fallback to campus students)
    await fetchCourseStudents(courseId);
  };

  const openCreateModal = (courseId) => {
    setCurrentCourseId(courseId);
    setMode("create");
    setForm({
      title: "",
      type: "quiz",
      totalMarks: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
    });
    setShowModal(true);
    setError("");
    setSuccess("");
  };

  const openEditModal = (courseId, batch) => {
    setCurrentCourseId(courseId);
    setMode("edit");
    setForm({
      title: batch.title,
      type: batch.type,
      totalMarks: batch.totalMarks,
      date: batch.date
        ? new Date(batch.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      description: batch.description || "",
    });
    setShowModal(true);
    setError("");
    setSuccess("");
  };

  const loadAssessment = async (batchId, courseId) => {
    setCurrentCourseId(courseId);
    const batch = await fetchAssessmentBatch(batchId);
    if (!batch) return;

    setSelectedBatch(batch);
    setView("assessment");

    // Ensure students for this course are present
    let students = courseStudents[courseId];
    if (!students) {
      students = await fetchCourseStudents(courseId);
    }

    // Build draft combining students with any existing results
    const draft = {};
    const resultsMap = new Map(
      (batch.results || []).map((r) => [r?.student?._id, r])
    );
    (students || []).forEach((stu) => {
      const r = resultsMap.get(stu._id);
      draft[stu._id] = {
        marks: r ? r.marks : "",
        remarks: r?.remarks || "",
      };
    });
    setMarksDraft(draft);
    setMarksDirty(false);
  };

  // auto-clear success
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Assessment Management</h2>
        {view === "courses" && (
          <button className="btn btn-primary" onClick={() => setView("manage")}>
            <MdGrade className="me-1" /> Manage Assessments
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
        </div>
      )}

      <div className="input-group mb-3">
        <span className="input-group-text">
          <MdSearch />
        </span>
        <input
          type="text"
          className="form-control"
          placeholder="Search courses..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && !batches && (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {view === "courses" && (
        <div className="row">
          {filteredCourses.map((course) => (
            <div key={course._id} className="col-md-6 col-lg-4 mb-3">
              <div className="card h-100">
                <div
                  className="card-header d-flex justify-content-between align-items-center"
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleExpand(course._id)}
                >
                  <div>
                    <h5 className="card-title mb-0">{course.name}</h5>
                    <p className="card-text mb-0 text-muted">{course.code}</p>
                  </div>
                  <div>
                    {expandedCourse === course._id ? <MdExpandLess /> : <MdExpandMore />}
                  </div>
                </div>

                {expandedCourse === course._id && (
                  <div className="card-body">
                    <button
                      className="btn btn-primary btn-sm mb-3 w-100"
                      onClick={() => openCreateModal(course._id)}
                    >
                      <MdAdd className="me-1" /> Create Assessment
                    </button>

                    <h6 className="card-subtitle mb-2 text-muted">Assessments:</h6>
                    {batches[course._id] && batches[course._id].length > 0 ? (
                      <div className="list-group">
                        {batches[course._id].map((batch) => (
                          <div
                            key={batch._id}
                            className="list-group-item d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <strong>{batch.title}</strong>
                              <br />
                              <small className="text-muted">
                                {batch.type} –{" "}
                                {batch.date ? new Date(batch.date).toLocaleDateString() : "—"}
                                <br />
                                Total Marks: {batch.totalMarks}
                              </small>
                            </div>
                            <div>
                              <button
                                className="btn btn-outline-primary btn-sm me-1"
                                onClick={() => loadAssessment(batch._id, course._id)}
                                title="View Assessment"
                              >
                                <MdAssessment />
                              </button>
                              <button
                                className="btn btn-outline-secondary btn-sm me-1"
                                onClick={() => openEditModal(course._id, batch)}
                                title="Edit Assessment"
                              >
                                <MdEdit />
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleDeleteAssessment(batch._id)}
                                title="Delete Assessment"
                              >
                                <MdDelete />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No assessments created yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "assessment" && selectedBatch && (
        <div className="card">
          <div className="card-header d-flex align-items-center">
            <button className="btn btn-secondary btn-sm me-2" onClick={() => setView("courses")}>
              <MdArrowBack className="me-1" /> Back to Courses
            </button>
            <h5 className="mb-0 ms-2">{selectedBatch.assessment.title}</h5>
            <span className="badge bg-info ms-2">{selectedBatch.assessment.type}</span>
            <span className="badge bg-secondary ms-2">
              Total: {selectedBatch.assessment.totalMarks} marks
            </span>
          </div>

          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Marks</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {(courseStudents[currentCourseId] || []).map((student, idx) => (
                    <tr key={student._id}>
                      <td>{idx + 1}</td>
                      <td>{student.name}</td>
                      <td>{student.email || "—"}</td>
                      <td>{student.phone || "—"}</td>
                      <td style={{ maxWidth: 140 }}>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          min="0"
                          max={selectedBatch.assessment.totalMarks}
                          value={marksDraft[student._id]?.marks ?? ""}
                          onChange={(e) => {
                            setMarksDraft((prev) => ({
                              ...prev,
                              [student._id]: {
                                ...prev[student._id],
                                marks: e.target.value,
                              },
                            }));
                            setMarksDirty(true);
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={marksDraft[student._id]?.remarks ?? ""}
                          onChange={(e) => {
                            setMarksDraft((prev) => ({
                              ...prev,
                              [student._id]: {
                                ...prev[student._id],
                                remarks: e.target.value,
                              },
                            }));
                            setMarksDirty(true);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {marksDirty && (
              <div className="d-flex justify-content-end mt-3">
                <button
                  className="btn btn-success"
                  onClick={handleSaveMarks}
                  disabled={savingMarks}
                >
                  <MdSave className="me-1" />
                  {savingMarks ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" />
                      Saving...
                    </>
                  ) : (
                    "Save Marks"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {mode === "create" ? "Create Assessment" : "Edit Assessment"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateAssessment}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Type *</label>
                    <select
                      className="form-select"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      required
                    >
                      {TYPE_OPTIONS.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Total Marks *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.totalMarks}
                      onChange={(e) => setForm({ ...form, totalMarks: e.target.value })}
                      required
                      min="1"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" />
                        {mode === "create" ? "Creating..." : "Saving..."}
                      </>
                    ) : mode === "create" ? (
                      "Create"
                    ) : (
                      "Save"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesOffered;
