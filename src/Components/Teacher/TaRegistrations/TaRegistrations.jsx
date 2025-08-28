import { useState, useEffect } from "react";
import "./TaRegistrations.css";
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
  );
};

export default Registration;
