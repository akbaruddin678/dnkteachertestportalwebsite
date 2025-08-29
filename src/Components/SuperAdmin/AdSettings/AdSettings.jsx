"use client"

import { useState } from "react"
import "./AdSettings.css"

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

  return (<>
  <style>{`
  .settings {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 600;
}

.page-header p {
  color: #666;
  font-size: 14px;
}

.settings-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.settings-section {
  padding: 30px;
  border-bottom: 1px solid #f0f0f0;
}

.settings-section:last-of-type {
  border-bottom: none;
}

.settings-section h2 {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
  font-weight: 600;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: block;
  margin-bottom: 6px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.setting-item input[type="text"],
.setting-item input[type="email"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  margin-bottom: 0 !important;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.settings-actions {
  padding: 30px;
  background-color: #f8f9fa;
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.reset-btn,
.save-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.reset-btn {
  background-color: #f5f5f5;
  color: #666;
}

.reset-btn:hover {
  background-color: #e0e0e0;
}

.save-btn {
  background-color: #1976d2;
  color: white;
}

.save-btn:hover {
  background-color: #1565c0;
}

@media (max-width: 768px) {
  .settings {
    padding: 15px;
  }

  .settings-section {
    padding: 20px;
  }

  .settings-actions {
    padding: 20px;
    flex-direction: column;
  }

  .reset-btn,
  .save-btn {
    width: 100%;
  }
}
`}</style>
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
</>

  )
}

export default Settings
