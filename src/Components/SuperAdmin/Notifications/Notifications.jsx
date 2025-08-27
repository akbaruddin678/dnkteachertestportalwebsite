"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import "./Notifications.css";
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
  );
};

export default Notifications;
