"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import api from "../../../services/api";

const Notifications = () => {
  const [formData, setFormData] = useState({
    recipientType: "",
    subject: "",
    message: "",
    schedule: "",
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/notifications");
      setNotifications(response.data?.data || []);
      setError(null);
    } catch (err) {
      setError("Failed to fetch notifications");
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.post("/admin/notifications", formData);
      setNotifications((prev) => [response.data?.data, ...prev]);
      setFormData({
        recipientType: "",
        subject: "",
        message: "",
        schedule: "",
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send notification");
      console.error("Error sending notification:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRecipientLabel = (type) => {
    switch (type) {
      case "principals":
        return "Principals";
      case "teachers":
        return "Teachers";
      case "all":
        return "All Users";
      default:
        return type || "Unknown";
    }
  };

  const filteredNotifications =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n?.recipientType === filter);

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    try {
      const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return new Date(dateString).toLocaleDateString("en-US", options);
    } catch {
      return "Invalid date";
    }
  };

  const getStatusClass = (status) => {
    const statusValue = status?.toLowerCase() || "unknown";
    switch (statusValue) {
      case "sent":
        return "sent";
      case "pending":
        return "pending";
      case "failed":
        return "failed";
      default:
        return "unknown";
    }
  };

  return (
    <>
    <style>{`.notifications-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1,
h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.error-message {
  background-color: #ffecec;
  color: #e74c3c;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border-left: 4px solid #e74c3c;
}

.notification-form {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.form-group input[type="text"],
.form-group input[type="datetime-local"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  font-size: 1rem;
}

.form-group textarea {
  min-height: 120px;
  resize: vertical;
}

button {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
    padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #2980b9;
}

button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.filter-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filter-select {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.notification-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.notification-card {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
}

.notification-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .recipient-badge {
    background-color: #e1f5fe;
    color: #0288d1;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
  }
  
  .notification-date {
    color: #7f8c8d;
    font-size: 0.9rem;
  }
  
  .status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
}

.status-badge.sent {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.pending {
  background-color: #fff8e1;
  color: #f57f17;
}

.status-badge.failed {
  background-color: #ffebee;
  color: #c62828;
}

.notification-subject {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.notification-message {
  color: #34495e;
  margin-bottom: 1rem;
  white-space: pre-wrap;
}

.notification-schedule {
  font-size: 0.9rem;
  color: #7f8c8d;
  padding-top: 0.5rem;
  border-top: 1px solid #ecf0f1;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
  font-style: italic;
}

@media (max-width: 768px) {
  .notifications-container {
    padding: 1rem;
  }
    .notification-cards {
      grid-template-columns: 1fr;
    }
    }`}</style>
    <div className="notifications-container">
      <h1>Notification Management</h1>

      <div className="notification-form">
        <h2>Create New Notification</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="recipientType">Recipient Type:</label>
            <select
              id="recipientType"
              name="recipientType"
              value={formData.recipientType}
              onChange={handleInputChange}
              required
            >
              <option value="">Select recipient type</option>
              <option value="principals">Principals</option>
              <option value="teachers">Teachers</option>
              <option value="all">All Users</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject:</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              maxLength="100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message:</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              rows="5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="schedule">Schedule (optional):</label>
            <input
              type="datetime-local"
              id="schedule"
              name="schedule"
              value={formData.schedule}
              onChange={handleInputChange}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Notification"}
          </button>
        </form>
      </div>

      <div className="notification-list">
        <div className="filter-controls">
          <h2>Notifications</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Notifications</option>
            <option value="principals">To Principals</option>
            <option value="teachers">To Teachers</option>
            <option value="all">To All Users</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">No notifications found</div>
        ) : (
          <div className="notification-cards">
            {filteredNotifications.map((notification) => (
              <div
                key={notification?._id || Math.random()}
                className="notification-card"
              >
                <div className="notification-header">
                  <span className="recipient-badge">
                    {getRecipientLabel(notification?.recipientType)}
                  </span>
                  <span className="notification-date">
                    {formatDate(notification?.createdAt)}
                  </span>
                  <span
                    className={`status-badge ${getStatusClass(
                      notification?.status
                    )}`}
                  >
                    {notification?.status || "Unknown"}
                  </span>
                </div>
                <h3 className="notification-subject">
                  {notification?.subject || "No subject"}
                </h3>
                <p className="notification-message">
                  {notification?.message || "No message content"}
                </p>
                {notification?.schedule && (
                  <div className="notification-schedule">
                    <strong>Scheduled for:</strong>{" "}
                    {formatDate(notification.schedule)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Notifications;
