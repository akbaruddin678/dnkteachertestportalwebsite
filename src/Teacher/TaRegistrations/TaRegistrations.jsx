import { useState, useEffect } from "react";

import { MdPeople } from "react-icons/md";


const Registration = ({ initialTab = "student" }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    campus: "",
    program: "",
    studentId: "",
    dateOfBirth: "",
    address: "",
    guardianName: "",
    guardianPhone: "",
    studentCnic: "",
    fees: "",
    status: "Active"
  });

  const [cities, setCities] = useState([]);
  const [campuses, setCampuses] = useState([]);

  useEffect(() => {
    // Extract city and campus data from JSON file
    const cityList = data.cities.map((city) => city.name);
    setCities(cityList);
  }, []);

  useEffect(() => {
    // Update campuses when city is selected
    const selectedCity = data.cities.find((city) => city.name === formData.city);
    if (selectedCity) {
      setCampuses(selectedCity.campuses.map((campus) => campus.name));
    }
  }, [formData.city]);

  const generateStudentId = () => `STD${Date.now().toString().slice(-6)}`;

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      city: "",
      campus: "",
      program: "",
      studentId: generateStudentId(),
      dateOfBirth: "",
      address: "",
      guardianName: "",
      guardianPhone: "",
      studentCnic: "",
      fees: "",
      status: "Active"
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    resetForm();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const requiredFields = ["name", "email", "city", "campus", "course", "program", "dateOfBirth", "guardianName", "guardianPhone", "studentCnic"];

    const missing = requiredFields.filter((f) => !formData[f]);
    if (missing.length) return alert("Please fill: " + missing.join(", "));

    const record = { id: Date.now(), ...formData, createdAt: new Date().toISOString() };
    const key = activeTab + "s";
    const prev = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([...prev, record]));

    alert(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} registered successfully!`);
    resetForm();
  };

  return (
    <><style>{`.registration {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 600;
}

.page-header p {
  color: #666;
  font-size: 16px;
}

.registration-tabs {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 40px;
  background-color: #f8f9fa;
  padding: 6px;
  border-radius: 8px;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
}

.tab-btn {
  padding: 12px 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s ease;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn.active {
  background-color: white;
  color: #1976d2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tab-btn:hover:not(.active) {
  background-color: rgba(255, 255, 255, 0.5);
}

.registration-form-container {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.registration-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-section {
  border-top: 1px solid #e9ecef;
  padding-top: 24px;
  margin-top: 8px;
}

.form-section h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
  font-weight: 600;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e9ecef;
}

.reset-btn,
.submit-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  min-width: 120px;
}

.reset-btn {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.reset-btn:hover {
  background-color: #e0e0e0;
  border-color: #ccc;
}

.submit-btn {
  background-color: #1976d2;
  color: white;
}

.submit-btn:hover {
  background-color: #1565c0;
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.2);
}

@media (max-width: 768px) {
  .registration {
    padding: 15px;
  }

  .registration-form-container {
    padding: 24px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .registration-tabs {
    width: 100%;
    flex-direction: column;
  }

  .tab-btn {
    justify-content: center;
  }

  .form-actions {
    flex-direction: column;
  }

  .reset-btn,
  .submit-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: 24px;
  }

  .registration-form-container {
    padding: 20px;
  }
}
`}</style>
    <div className="registration">
      <div className="page-header">
        <h1>User Registration</h1>
        <p>Register students</p>
      </div>

      <div className="registration-tabs">
        <button
          className={`tab-btn ${activeTab === "student" ? "active" : ""}`}
          onClick={() => handleTabChange("student")}
        >
          <MdPeople /> Student
        </button>
      </div>

      <form onSubmit={handleSubmit} className="registration-form-container">
        <div className="form-row">
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>City *</label>
            <select
              value={formData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              required
            >
              <option value="">Select City</option>
              {cities.map((city, idx) => (
                <option key={idx} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Campus *</label>
            <select
              value={formData.campus}
              onChange={(e) => handleInputChange("campus", e.target.value)}
              required
            >
              <option value="">Select Campus</option>
              {campuses.map((campus, idx) => (
                <option key={idx} value={campus}>
                  {campus}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Program *</label>
            <select
              value={formData.program}
              onChange={(e) => handleInputChange("program", e.target.value)}
              required
            >
              <option value="">Select Program</option>
              <option value="Nclex">Nclex</option>
              <option value="MatricTech">MatricTech</option>
              <option value="MedicalTech">MedicalTech</option>
            </select>
          </div>
          <div className="form-group">
            <label>Course *</label>
            <input
              type="text"
              value={formData.course}
              onChange={(e) => handleInputChange("course", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date of Birth *</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Student CNIC *</label>
            <input
              type="text"
              value={formData.studentCnic}
              onChange={(e) => handleInputChange("studentCnic", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Guardian Name *</label>
            <input
              type="text"
              value={formData.guardianName}
              onChange={(e) =>
                handleInputChange("guardianName", e.target.value)
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Guardian Phone *</label>
            <input
              type="text"
              value={formData.guardianPhone}
              onChange={(e) =>
                handleInputChange("guardianPhone", e.target.value)
              }
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Course Fees</label>
            <input
              type="number"
              value={formData.fees}
              onChange={(e) => handleInputChange("fees", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              rows="3"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={resetForm} className="reset-btn">
            Reset
          </button>
          <button type="submit" className="submit-btn">
            Register
          </button>
        </div>
      </form>
    </div>
</>

  );
};

export default Registration;
