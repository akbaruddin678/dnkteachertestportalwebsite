"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
const API_BASE =
  import.meta?.env?.VITE_API_BASE?.replace(/\/$/, "") ||
  "https://vigilant-moser.210-56-25-68.plesk.page/api/v1"; // Adjust as needed
const NOTIF_URL = `${API_BASE}/notifications`;

/** axios with Bearer token */
const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Try to get userId from localStorage or JWT payload */
const getCurrentUserId = () => {
  const stored = localStorage.getItem("userId");
  if (stored) return stored;
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    // basic decode (no verify) to read payload
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.id || payload?._id || null;
  } catch {
    return null;
  }
};

const Notifications = ({ role = "teacher" }) => {
  const [formData, setFormData] = useState({
    recipientType: "",
    subject: "",
    message: "",
    schedule: "",
  });
  const [allNotifications, setAllNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentUserId = useMemo(getCurrentUserId, []);

  /** Recipient options: teacher can only send to admin/principals/both */
  const recipientOptions = useMemo(() => {
    if (role === "teacher") {
      return [
        { value: "principals", label: "Principals" },
        { value: "admin", label: "Admin" },
        { value: "both", label: "Admin & Principals" },
      ];
    }
    // (kept for completeness)
    if (role === "admin" || role === "principal") {
      return [
        { value: "teachers", label: "Teachers" },
        { value: "principals", label: "Principals" },
        { value: "both", label: "Admin & Principals" },
        { value: "all", label: "Everyone (All)" },
        { value: "admin", label: "Admins" },
      ];
    }
    return [{ value: "all", label: "Everyone (All)" }];
  }, [role]);

  /** Fetch notifications (server already filters by role) */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(NOTIF_URL);
        if (!cancelled) setAllNotifications(res.data?.data || []);
        console.log("Notifications loaded:", res.data?.data);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError(
            err?.response?.data?.error ||
              err?.response?.data?.message ||
              "Failed to load notifications."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role]);

  const handleInputChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const toISOOrUndefined = (dtLocal) => {
    if (!dtLocal) return undefined;
    const d = new Date(dtLocal);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { recipientType, subject, message, schedule } = formData;
    if (!recipientType || !subject.trim() || !message.trim()) {
      setError("Please fill in recipient, subject, and message.");
      return;
    }

    // Teacher is only allowed to send to principals/admin/both
    if (
      role === "teachers" &&
      !["principals", "admin", "both"].includes(recipientType)
    ) {
      setError("You are not allowed to send to this recipient type.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        recipientType,
        subject: subject.trim(),
        message: message.trim(),
      };
      const iso = toISOOrUndefined(schedule);
      if (iso) payload.schedule = iso;

      const res = await api.post(NOTIF_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });

      const created = res.data?.data;
      if (created) {
        setAllNotifications((prev) => [created, ...prev]);
      }

      setFormData({
        recipientType: "",
        subject: "",
        message: "",
        schedule: "",
      });
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to send notification."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /** Split into Received vs Sent (teacher view):
   *  - Received: createdBy.role ∈ {admin, principal} AND recipientType ∈ {teachers, both, all}
   *  - Sent: createdBy._id === currentUserId
   */
  const { received, sent } = useMemo(() => {
    const norm = (s) => (s || "").toLowerCase();
    const result = { received: [], sent: [] };
    for (const n of allNotifications) {
      const creatorId = n?.createdBy?._id || n?.createdBy?.id || n?.createdBy;
      const creatorRole = norm(n?.createdBy?.role);
      const type = norm(n?.recipientType);

      // Sent by me
      if (
        currentUserId &&
        creatorId &&
        String(creatorId) === String(currentUserId)
      ) {
        result.sent.push(n);
        continue;
      }

      // Received (from admin/principal → to teachers/both/all)
      const fromAdminOrPrincipal =
        creatorRole === "admin" || creatorRole === "principal";
      const toTeachersGroup =
        type === "teachers" || type === "both" || type === "all";

      if (fromAdminOrPrincipal && toTeachersGroup) {
        result.received.push(n);
      }
    }
    return result;
  }, [allNotifications, currentUserId]);

  return (
    <><style>{`/* Notifications.css */
.notifications {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.07);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.notifications h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.notifications h2 {
  margin-top: 2rem;
  font-size: 1.5rem;
  color: #34495e;
  border-bottom: 2px solid #3498db;
  padding-bottom: 0.3rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

input[type="text"],
textarea,
select {
  padding: 0.75rem 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
}

textarea {
  resize: vertical;
  min-height: 100px;
}

button[type="submit"] {
  background-color: #3498db;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  align-self: flex-start;
  transition: background-color 0.3s ease;
}

button[type="submit"]:hover {
  background-color: #2980b9;
}

.notifications > div {
  margin-top: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e1e1e1;
}

.notifications strong {
  font-size: 1.1rem;
  color: #2c3e50;
}

.notifications p {
  color: #555;
  margin: 0.5rem 0;
}

.notifications small {
  color: #888;
  font-size: 0.85rem;
}

hr {
  border: none;
  border-top: 1px solid #ddd;
  margin-top: 1rem;
}
`}</style>
    <div className="notifications">
      <h1 className="title">Application</h1>

      {/* Composer */}
      <form className="notif-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Recipient</label>
            <select
              value={formData.recipientType}
              onChange={(e) =>
                handleInputChange("recipientType", e.target.value)
              }
              required
            >
              <option value="">Select recipient</option>
              {recipientOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div
              className="form-group"
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: "16px",
              }}
            >
              <label
                style={{
                  marginBottom: "6px",
                  // fontSize: "14px",
                  fontWeight: "500",
                  color: "#333",
                }}
              >
                Schedule (optional)
              </label>

              <input
                type="datetime-local"
                value={formData.schedule}
                onChange={(e) => handleInputChange("schedule", e.target.value)}
                style={{
                  padding: "12px 20px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  fontSize: "14px",
                  outline: "none",
                  transition: "0.2s ease-in-out",
                }}
              />
            </div>
        </div>

        <div className="form-group">
          <label>Subject</label>
          <input
            type="text"
            placeholder="Subject"
            value={formData.subject}
            onChange={(e) => handleInputChange("subject", e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Message</label>
          <textarea
            placeholder="Enter your message..."
            value={formData.message}
            onChange={(e) => handleInputChange("message", e.target.value)}
            rows={4}
            required
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send Application"}
        </button>
      </form>

      {/* Lists */}
      <div className="notif-sections">
        <section>
          <h2 className="subtitle">Received Notification</h2>
          {loading ? (
            <p>Loading...</p>
          ) : received.length === 0 ? (
            <p>No received notifications.</p>
          ) : (
            <div className="notif-list">
              {received.map((n) => (
                <article key={n._id} className="notif-card">
                  <header className="notif-card__head">
                    <strong className="notif-card__subject">{n.subject}</strong>
                    <span className="notif-card__time">
                      {n.createdAt
                        ? new Date(n.createdAt).toLocaleString()
                        : ""}
                    </span>
                  </header>
                  <p className="notif-card__msg">{n.message}</p>
                  <footer className="notif-card__foot">
                    <small>
                      To: <em>{n.recipientType}</em>
                      {n.schedule && (
                        <>
                          {" "}
                          • Scheduled: {new Date(n.schedule).toLocaleString()}
                        </>
                      )}
                      {" • "}From: {n.createdBy?.name || "Unknown"} (
                      {n.createdBy?.role})
                    </small>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="subtitle">Application Sent</h2>
          {loading ? (
            <p>Loading...</p>
          ) : sent.length === 0 ? (
            <p>You haven’t sent any notifications yet.</p>
          ) : (
            <div className="notif-list">
              {sent.map((n) => (
                <article key={n._id} className="notif-card">
                  <header className="notif-card__head">
                    <strong className="notif-card__subject">{n.subject}</strong>
                    <span className="notif-card__time">
                      {n.createdAt
                        ? new Date(n.createdAt).toLocaleString()
                        : ""}
                    </span>
                  </header>
                  <p className="notif-card__msg">{n.message}</p>
                  <footer className="notif-card__foot">
                    <small>
                      To: <em>{n.recipientType}</em>
                      {n.schedule && (
                        <>
                          {" "}
                          • Scheduled: {new Date(n.schedule).toLocaleString()}
                        </>
                      )}
                      {" • "}From: Me
                    </small>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
</>

  );
};

export default Notifications;
