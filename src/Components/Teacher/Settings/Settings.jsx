"use client"

import { useState } from "react"
import "./Settings.css"

const Settings = () => {
  const [settings, setSettings] = useState({
    siteName: "Nclex LMS",
    adminEmail: "admin@Nclex.edu",
    notifications: true,
    emailNotifications: true,
    autoBackup: true,
    maintenanceMode: false,
  });

  const handleSettingChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    localStorage.setItem("systemSettings", JSON.stringify(settings));
    alert("Settings saved successfully!");
  };

  const handleReset = () => {
    if (
      window.confirm("Are you sure you want to reset all settings to default?")
    ) {
      setSettings({
        siteName: "Nclex LMS",
        adminEmail: "admin@Nclex.edu",
        notifications: true,
        emailNotifications: true,
        autoBackup: true,
        maintenanceMode: false,
      });
    }
  };

  return (
    <div className="settings">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage system configuration and preferences</p>
      </div>

      <div className="settings-container">
        <div className="settings-section">
          <h2>General Settings</h2>
          <div className="setting-item">
            <label>Site Name</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => handleSettingChange("siteName", e.target.value)}
            />
          </div>
          <div className="setting-item">
            <label>Admin Email</label>
            <input
              type="email"
              value={settings.adminEmail}
              onChange={(e) => handleSettingChange("adminEmail", e.target.value)}
            />
          </div>
        </div>

        <div className="settings-section">
          <h2>Notification Settings</h2>
          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => handleSettingChange("notifications", e.target.checked)}
              />
              Enable System Notifications
            </label>
          </div>
          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange("emailNotifications", e.target.checked)}
              />
              Enable Email Notifications
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2>System Settings</h2>
          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.autoBackup}
                onChange={(e) => handleSettingChange("autoBackup", e.target.checked)}
              />
              Enable Auto Backup
            </label>
          </div>
          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleSettingChange("maintenanceMode", e.target.checked)}
              />
              Maintenance Mode
            </label>
          </div>
        </div>

        <div className="settings-actions">
          <button className="reset-btn" onClick={handleReset}>
            Reset to Default
          </button>
          <button className="save-btn" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
