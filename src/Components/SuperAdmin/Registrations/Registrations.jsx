import { useState, useEffect } from "react";
import {
  MdSchool,
  MdPeople,
  MdPerson,
  MdAttachFile,
  MdAdd,
  MdDelete,
  MdVisibility,
  MdVisibilityOff,
  MdEdit,
  MdSearch,
} from "react-icons/md";
import * as XLSX from "xlsx";
import {
  createCampus,
  createCoordinator,
  createTeacher,
  createStudent,
  createCourse,
  getTeachers,
  getCampuses,
  getStudents,
  getCourses,
  getCoordinators,
  updateCampus,
  updateCoordinator,
  updateTeacher,
  updateStudent,
  updateCourse,
  deleteCampus,
  deleteCoordinator,
  deleteTeacher,
  deleteStudent,
  deleteCourse,
} from "../../../services/api";
import "./Registrations.css";

const Registrations = () => {
  const [activeTab, setActiveTab] = useState("campus");
  const [viewMode, setViewMode] = useState("add"); // 'add' or 'view'
  const [formData, setFormData] = useState({
    campus: {
      name: "",
      location: "",
      address: "",
      contactNumber: "",
    },
    principal: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
    teacher: {
      name: "",
      email: "",
      phone: "",
      cnic: "",
      password: "",
      subjectSpecialization: "",
      qualifications: "",
      campusId: "",
    },
    student: {
      name: "",
      email: "",
      phone: "",
      cnic: "",
      pncNo: "",
      passport: "",
      status: "Active",
      studentExcelFile: null,
      documentstatus: "notverified",
      city: "",
    },
    course: {
      name: "",
      code: "",
      description: "",
      creditHours: "",
      startDate: "",
      endDate: "",
      courseContent: [],
      currentContent: {
        title: "",
        duration: "",
        description: "",
        remarks: "",
      },
      courseFile: null,
    },
  });

  // --- Helpers ---
  const normalizeCNIC = (cnic) => (cnic || "").replace(/\D/g, ""); // keep digits only
  const normalizePhone = (p) => (p || "").replace(/\D/g, "");
  const isValidEmail = (e) => !!e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const [loading, setLoading] = useState(false);
  const [campuses, setCampuses] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);

  // --- Fetch applicants and register ---
  const handleFetchAndRegisterFromPortal = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      // 1) Fetch remote applicants
      const res = await fetch(
        "https://unruffled-mirzakhani.210-56-25-68.plesk.page/api/applicants/searchbywholedata",
        { method: "GET" }
      );
      if (!res.ok) {
        throw new Error(`Remote fetch failed: ${res.status} ${res.statusText}`);
      }
      const remote = await res.json();
      const remoteList = Array.isArray(remote?.data) ? remote.data : [];

      // 2) Pull existing students once, build a CNIC set to de-dup
      const existing = await getStudents();
      const existingByCNIC = new Set(
        (existing?.data || []).map((s) => normalizeCNIC(s.cnic)).filter(Boolean)
      );

      const toCreate = [];
      const skipped = [];

      for (const record of remoteList) {
        const a = record?.applicant || {};
        const r = record?.result || {};

        const total =
          Number(r?.testMark || 0) +
          Number(r?.essayMark || 0) +
          Number(r?.interviewMark || 0);

        // Normalize
        const cnicDigits = normalizeCNIC(a.cnic);
        const phoneDigits = normalizePhone(a.contact);

        // Basic validations
        const payload = {
          name: (a.applicant_name || "").trim(),
          email: (a.email || "").trim(),
          phone: phoneDigits,
          cnic: cnicDigits,
          pncNo: (a.pnmc_no || "").trim(),
          passport: "",
          status: "Active",
          documentstatus: "notverified",
          city: (a.district || a.province || "").trim(),
        };

        if (!payload.name) {
          skipped.push({ cnic: a.cnic, reason: "Missing name" });
          continue;
        }
        if (!payload.cnic || payload.cnic.length !== 13) {
          skipped.push({ cnic: a.cnic, reason: "Invalid CNIC (need 13 digits)" });
          continue;
        }
        if (!payload.phone || payload.phone.length < 10) {
          skipped.push({ cnic: a.cnic, reason: "Missing/invalid phone" });
          continue;
        }
        if (!isValidEmail(payload.email)) {
          skipped.push({ cnic: a.cnic, reason: "Missing/invalid email" });
          continue;
        }
        if (!payload.pncNo) {
          skipped.push({ cnic: a.cnic, reason: "Missing PNC No" });
          continue;
        }

        if (total < 50) {
          skipped.push({ cnic: a.cnic, reason: `Total marks ${total} < 50` });
          continue;
        }

        if (existingByCNIC.has(payload.cnic)) {
          skipped.push({ cnic: a.cnic, reason: "Already exists" });
          continue;
        }

        toCreate.push(payload);
      }

      // 5) Create in parallel
      const results = await Promise.allSettled(
        toCreate.map((stu) => createStudent(stu))
      );

      let createdCount = 0;
      results.forEach((r, idx) => {
        if (r.status === "fulfilled") {
          createdCount += 1;
          existingByCNIC.add(toCreate[idx].cnic);
        } else {
          skipped.push({
            cnic: toCreate[idx].cnic,
            reason: r.reason?.message || "API create failed",
          });
        }
      });

      setSuccessMessage(
        `Portal import done: ${createdCount} registered, ${skipped.length} skipped.`
      );

      if (skipped.length) {
        const preview = skipped
          .slice(0, 5)
          .map((s) => `• ${s.cnic || "CNIC?"}: ${s.reason}`)
          .join("\n");
        setErrorMessage(
          `${skipped.length} skipped:\n${preview}${
            skipped.length > 5 ? "\n…more" : ""
          }`
        );
      }

      if (activeTab === "student" && viewMode === "view") {
        const refreshed = await getStudents();
        setDataList(refreshed.data || []);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Failed to fetch/register from portal");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data based on active tab and view mode
  useEffect(() => {
    const fetchData = async () => {
      if (viewMode === "view") {
        try {
          setLoading(true);
          let response;
          switch (activeTab) {
            case "campus":
              response = await getCampuses();
              break;
            case "principal":
              response = await getCoordinators();
              break;
            case "teacher":
              response = await getTeachers();
              break;
            case "student":
              response = await getStudents();
              break;
            case "course":
              response = await getCourses();
              break;
            default:
              response = { data: [] };
          }
          setDataList(response.data);
        } catch (error) {
          console.error("Failed to fetch data:", error);
          setErrorMessage("Failed to fetch data. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [viewMode, activeTab]);

  // Fetch campuses when teacher tab is active in add mode
  useEffect(() => {
    if (activeTab === "teacher" && viewMode === "add") {
      const fetchCampuses = async () => {
        try {
          const response = await getCampuses();
          setCampuses(response.data);
        } catch (error) {
          console.error("Failed to fetch campuses:", error);
          setErrorMessage("Failed to fetch campuses. Please try again.");
        }
      };
      fetchCampuses();
    }
  }, [activeTab, viewMode]);

  useEffect(() => {
    // Clear messages after 5 seconds
    const timer = setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 5000);
    return () => clearTimeout(timer);
  }, [successMessage, errorMessage]);

  // Map the active tab to its key
  const activeKey = (tab) => tab; // "campus" | "principal" | "teacher" | "student" | "course"

  const handleInputChange = (field, value) => {
    const key = activeKey(activeTab);
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const handleContentChange = (field, value) => {
    // Only used for course.currentContent
    setFormData((prev) => ({
      ...prev,
      course: {
        ...prev.course,
        currentContent: {
          ...prev.course.currentContent,
          [field]: value,
        },
      },
    }));
  };

  const addContentItem = () => {
    const cur = formData.course.currentContent;
    if (!cur.title) {
      setErrorMessage("Content title is required");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      course: {
        ...prev.course,
        courseContent: [...prev.course.courseContent, prev.course.currentContent],
        currentContent: {
          title: "",
          duration: "",
          description: "",
          remarks: "",
        },
      },
    }));
  };

  const removeContentItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      course: {
        ...prev.course,
        courseContent: prev.course.courseContent.filter((_, i) => i !== index),
      },
    }));
  };

  const handleFileChange = (field, e) => {
    const key = activeKey(activeTab);
    const file = e.target.files[0];
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: file,
      },
    }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      campus: { name: "", location: "", address: "", contactNumber: "" },
      principal: { name: "", email: "", phone: "", password: "" },
      teacher: {
        name: "",
        email: "",
        phone: "",
        cnic: "",
        password: "",
        subjectSpecialization: "",
        qualifications: "",
        campusId: "",
      },
      student: {
        name: "",
        email: "",
        phone: "",
        cnic: "",
        pncNo: "",
        passport: "",
        status: "Active",
        studentExcelFile: null,
        documentstatus: "notverified",
        city: "",
      },
      course: {
        name: "",
        code: "",
        description: "",
        creditHours: "",
        startDate: "",
        endDate: "",
        courseContent: [],
        currentContent: {
          title: "",
          duration: "",
          description: "",
          remarks: "",
        },
        courseFile: null,
      },
    });
    setErrorMessage("");
    setSuccessMessage("");
    setShowPassword(false);
    setEditingId(null);
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    const re = /^[0-9]{10,15}$/;
    return re.test(phone);
  };

  const validateCNIC = (cnic) => {
    const re = /^[0-9]{13}$/;
    return re.test(cnic);
  };

  const validatePassword = (password) => {
    return (password || "").length >= 6;
  };

  const handleImport = async () => {
    if (!formData.student.studentExcelFile) {
      setErrorMessage("Please select an Excel file first");
      return;
    }

    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // Validate imported data
        const validationErrors = [];
        const validStudents = jsonData.map((student, index) => {
          if (!student.name) {
            validationErrors.push(`Row ${index + 2}: Name is required`);
          }
          if (!student.cnic) {
            validationErrors.push(`Row ${index + 2}: CNIC is required`);
          } else if (!validateCNIC(student.cnic)) {
            validationErrors.push(`Row ${index + 2}: CNIC must be 13 digits`);
          }
          if (student.email && !validateEmail(student.email)) {
            validationErrors.push(`Row ${index + 2}: Invalid email format`);
          }
          if (student.phone && !validatePhone(student.phone)) {
            validationErrors.push(`Row ${index + 2}: Invalid phone format`);
          }
          return {
            ...student,
            documentstatus: "notverified",
            status: "Active",
          };
        });

        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join("\n"));
        }

        const response = await Promise.all(
          validStudents.map((student) => createStudent(student))
        );

        setSuccessMessage(`${response.length} students imported successfully!`);
        setFormData((prev) => ({
          ...prev,
          student: { ...prev.student, studentExcelFile: null },
        }));
        setLoading(false);
      };
      reader.readAsArrayBuffer(formData.student.studentExcelFile);
    } catch (error) {
      console.error("Import error:", error);
      setErrorMessage(error.message || "Failed to import students");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      let validationErrors = [];
      let apiCall;
      let dataToSend = {};

      const key = activeKey(activeTab);
      const cur = formData[key];

      switch (activeTab) {
        case "campus": {
          if (!cur.name) validationErrors.push("Campus name is required");
          if (!cur.location) validationErrors.push("Location is required");
          if (!cur.contactNumber) {
            validationErrors.push("Contact number is required");
          } else if (!validatePhone(cur.contactNumber)) {
            validationErrors.push("Invalid contact number format");
          }

          dataToSend = {
            name: cur.name,
            location: cur.location,
            address: cur.address,
            contactNumber: cur.contactNumber,
          };
          apiCall = editingId
            ? (data) => updateCampus(editingId, data)
            : createCampus;
          break;
        }

        case "principal": {
          if (!cur.name) validationErrors.push("Name is required");
          if (!cur.email) {
            validationErrors.push("Email is required");
          } else if (!validateEmail(cur.email)) {
            validationErrors.push("Invalid email format");
          }
          if (!editingId && !cur.password) {
            validationErrors.push("Password is required");
          } else if (cur.password && !validatePassword(cur.password)) {
            validationErrors.push("Password must be at least 6 characters");
          }
          if (cur.phone && !validatePhone(cur.phone)) {
            validationErrors.push("Invalid phone number format");
          }

          dataToSend = {
            name: cur.name,
            email: cur.email,
            contactNumber: cur.phone,
          };
          if (cur.password) dataToSend.password = cur.password;

          apiCall = editingId
            ? (data) => updateCoordinator(editingId, data)
            : createCoordinator;
          break;
        }

        case "teacher": {
          if (!cur.name) validationErrors.push("Name is required");
          if (!cur.email) {
            validationErrors.push("Email is required");
          } else if (!validateEmail(cur.email)) {
            validationErrors.push("Invalid email format");
          }
          if (!editingId && !cur.password) {
            validationErrors.push("Password is required");
          } else if (cur.password && !validatePassword(cur.password)) {
            validationErrors.push("Password must be at least 6 characters");
          }
          if (!cur.subjectSpecialization) {
            validationErrors.push("Subject specialization is required");
          }
          if (!cur.qualifications) {
            validationErrors.push("Qualifications are required");
          }
          if (cur.phone && !validatePhone(cur.phone)) {
            validationErrors.push("Invalid phone number format");
          }

          dataToSend = {
            name: cur.name,
            email: cur.email,
            contactNumber: cur.phone,
            subjectSpecialization: cur.subjectSpecialization,
            qualifications: cur.qualifications,
          };
          if (cur.password) dataToSend.password = cur.password;

          apiCall = editingId
            ? (data) => updateTeacher(editingId, data)
            : createTeacher;
          break;
        }

        case "student": {
          if (!cur.name) validationErrors.push("Name is required");
          if (!cur.cnic) {
            validationErrors.push("CNIC is required");
          } else if (!validateCNIC(cur.cnic)) {
            validationErrors.push("CNIC must be 13 digits");
          }
          if (cur.email && !validateEmail(cur.email)) {
            validationErrors.push("Invalid email format");
          }
          if (cur.phone && !validatePhone(cur.phone)) {
            validationErrors.push("Invalid phone number format");
          }

          dataToSend = {
            name: cur.name,
            email: cur.email,
            phone: cur.phone,
            cnic: cur.cnic,
            pncNo: cur.pncNo,
            passport: cur.passport,
            status: cur.status,
            documentstatus: cur.documentstatus,
            city: cur.city,
          };
          apiCall = editingId
            ? (data) => updateStudent(editingId, data)
            : createStudent;
          break;
        }

        case "course": {
          if (!cur.name) validationErrors.push("Course name is required");
          if (!cur.code) validationErrors.push("Course code is required");
          if (!cur.creditHours) {
            validationErrors.push("Credit hours are required");
          } else if (isNaN(cur.creditHours)) {
            validationErrors.push("Credit hours must be a number");
          }
          if (cur.startDate && cur.endDate && cur.startDate > cur.endDate) {
            validationErrors.push("End date must be after start date");
          }

          dataToSend = {
            name: cur.name,
            code: cur.code,
            description: cur.description,
            creditHours: cur.creditHours,
            startDate: cur.startDate,
            endDate: cur.endDate,
            courseContent: cur.courseContent,
          };
          apiCall = editingId
            ? (data) => updateCourse(editingId, data)
            : createCourse;
          break;
        }

        default:
          break;
      }

      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join("\n"));
      }

      await apiCall(dataToSend);
      setSuccessMessage(
        `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} ${
          editingId ? "updated" : "registered"
        } successfully!`
      );
      resetForm();
      setViewMode("view");
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setViewMode("add");

    switch (activeTab) {
      case "campus":
        setFormData((prev) => ({
          ...prev,
          campus: {
            name: item.name || "",
            location: item.location || "",
            address: item.address || "",
            contactNumber: item.contactNumber || "",
          },
        }));
        break;
      case "principal":
        setFormData((prev) => ({
          ...prev,
          principal: {
            name: item.name || "",
            email: item.user?.email || "",
            phone: item.contactNumber || "",
            password: "",
          },
        }));
        break;
      case "teacher":
        setFormData((prev) => ({
          ...prev,
          teacher: {
            name: item.name || "",
            email: item.user?.email || "",
            phone: item.contactNumber || "",
            cnic: item.cnic || "",
            password: "",
            subjectSpecialization: item.subjectSpecialization || "",
            qualifications: item.qualifications || "",
            campusId: item.campus?._id || "",
          },
        }));
        break;
      case "student":
        setFormData((prev) => ({
          ...prev,
          student: {
            name: item.name || "",
            email: item.email || "",
            phone: item.phone || "",
            cnic: item.cnic || "",
            pncNo: item.pncNo || "",
            passport: item.passport || "",
            status: item.status || "Active",
            documentstatus: item.documentstatus || "notverified",
            city: item.city || "",
            studentExcelFile: null,
          },
        }));
        break;
      case "course":
        setFormData((prev) => ({
          ...prev,
          course: {
            name: item.name || "",
            code: item.code || "",
            description: item.description || "",
            creditHours: item.creditHours || "",
            startDate: item.startDate || "",
            endDate: item.endDate || "",
            courseContent: item.courseContent || [],
            currentContent: { title: "", duration: "", description: "", remarks: "" },
            courseFile: null,
          },
        }));
        break;
      default:
        break;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) {
      return;
    }

    try {
      setLoading(true);
      switch (activeTab) {
        case "campus":
          await deleteCampus(id);
          break;
        case "principal":
          await deleteCoordinator(id);
          break;
        case "teacher":
          await deleteTeacher(id);
          break;
        case "student":
          await deleteStudent(id);
          break;
        case "course":
          await deleteCourse(id);
          break;
        default:
          break;
      }

      setSuccessMessage(
        `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} deleted successfully!`
      );

      // Refresh the data list
      let response;
      switch (activeTab) {
        case "campus":
          response = await getCampuses();
          break;
        case "principal":
          response = await getCoordinators();
          break;
        case "teacher":
          response = await getTeachers();
          break;
        case "student":
          response = await getStudents();
          break;
        case "course":
          response = await getCourses();
          break;
        default:
          response = { data: [] };
      }
      setDataList(response.data);
    } catch (error) {
      console.error("Delete error:", error);
      setErrorMessage("Failed to delete. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---- search / filter computed list ----
  const filteredData = dataList.filter((item) => {
    const searchFields = {
      campus: ["name", "location", "contactNumber"],
      principal: ["name", "user.email", "contactNumber"],
      teacher: ["name", "user.email", "subjectSpecialization"],
      student: ["name", "email", "cnic"],
      course: ["name", "code"],
    };

    const fields = searchFields[activeTab] || [];
    return fields.some((field) => {
      const value = field.split(".").reduce((obj, key) => obj?.[key], item);
      return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  const renderForm = () => {
    const cur = formData[activeKey(activeTab)];

    return (
      <form onSubmit={handleSubmit} className="form-container">
        {activeTab === "campus" && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Campus Name *</label>
                <input
                  type="text"
                  value={cur.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  value={cur.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={cur.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Contact Number *</label>
                <input
                  type="tel"
                  value={cur.contactNumber}
                  onChange={(e) =>
                    handleInputChange("contactNumber", e.target.value)
                  }
                  required
                  pattern="[0-9]{10,15}"
                  title="10-15 digit phone number"
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "principal" && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={cur.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={cur.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>
                  {editingId ? "New Password" : "Password *"}
                  {!editingId && (
                    <small className="hint">Minimum 6 characters</small>
                  )}
                </label>
                <div className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={cur.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required={!editingId}
                    minLength="6"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  value={cur.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  pattern="[0-9]{10,15}"
                  title="10-15 digit phone number"
                  required
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "teacher" && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={cur.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={cur.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>
                  {editingId ? "New Password" : "Password *"}
                  {!editingId && (
                    <small className="hint">Minimum 6 characters</small>
                  )}
                </label>
                <div className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={cur.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required={!editingId}
                    minLength="6"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
              </div>
              {/* 
              <div className="form-group">
                <label>Campus *</label>
                <select
                  value={cur.campusId}
                  onChange={(e) => handleInputChange("campusId", e.target.value)}
                  required
                >
                  <option value="">Select Campus</option>
                  {campuses.map((campus) => (
                    <option key={campus._id} value={campus._id}>
                      {campus.name}
                    </option>
                  ))}
                </select>
              </div> 
              */}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Subject Specialization *</label>
                <input
                  type="text"
                  value={cur.subjectSpecialization}
                  onChange={(e) =>
                    handleInputChange("subjectSpecialization", e.target.value)
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Qualifications </label>
                <input
                  type="text"
                  value={cur.qualifications}
                  onChange={(e) =>
                    handleInputChange("qualifications", e.target.value)
                  }
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={cur.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  pattern="[0-9]{10,15}"
                  title="10-15 digit phone number"
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "student" && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={cur.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>CNIC *</label>
                <input
                  type="text"
                  value={cur.cnic}
                  onChange={(e) => handleInputChange("cnic", e.target.value)}
                  required
                  pattern="[0-9]{13}"
                  title="13 digit CNIC number"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={cur.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  value={cur.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  pattern="[0-9]{10,15}"
                  title="10-15 digit phone number"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>PNC No</label>
                <input
                  type="text"
                  value={cur.pncNo}
                  onChange={(e) => handleInputChange("pncNo", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Passport</label>
                <input
                  type="text"
                  value={cur.passport}
                  onChange={(e) => handleInputChange("passport", e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Document Status</label>
                <select
                  value={cur.documentstatus}
                  onChange={(e) =>
                    handleInputChange("documentstatus", e.target.value)
                  }
                >
                  <option value="notverified">Not Verified</option>
                  <option value="verified">Verified</option>
                </select>
              </div>
            </div>
            {!editingId && (
              <div className="form-row">
                <div className="form-group">
                  <label>Bulk Import Students (Excel)</label>
                  <div className="file-upload">
                    <input
                      type="file"
                      id="student-excel"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => handleFileChange("studentExcelFile", e)}
                    />
                    <label htmlFor="student-excel" className="file-upload-btn">
                      <MdAttachFile />{" "}
                      {cur.studentExcelFile
                        ? cur.studentExcelFile.name
                        : "Choose Excel File"}
                    </label>
                    {cur.studentExcelFile && (
                      <button
                        type="button"
                        onClick={handleImport}
                        className="import-btn"
                        disabled={loading}
                      >
                        {loading ? "Importing..." : "Import Students"}
                      </button>
                    )}

                    {/* Fetch & Register from Portal */}
                    <button
                      type="button"
                      onClick={handleFetchAndRegisterFromPortal}
                      className="import-btn secondary"
                      disabled={loading}
                      style={{ marginLeft: "8px" }}
                    >
                      {loading ? "Processing..." : "Fetch & Register from Portal"}
                    </button>
                  </div>
                  <small className="hint">
                    Excel should contain columns: name, email, phone, cnic, pncNo,
                    passport
                  </small>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "course" && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Course Name *</label>
                <input
                  type="text"
                  value={cur.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Course Code *</label>
                <input
                  type="text"
                  value={cur.code}
                  onChange={(e) => handleInputChange("code", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Credit Hours *</label>
                <input
                  type="number"
                  value={cur.creditHours}
                  onChange={(e) =>
                    handleInputChange("creditHours", e.target.value)
                  }
                  required
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={cur.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows="3"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={cur.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={cur.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  min={cur.startDate}
                />
              </div>
            </div>
          </>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => {
              setViewMode("view");
              resetForm();
            }}
          >
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading
              ? "Processing..."
              : `${editingId ? "Update" : "Save"} ${
                  activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                }`}
          </button>
        </div>
      </form>
    );
  };

  const renderDataTable = () => {
    if (loading) {
      return <div className="loading">Loading...</div>;
    }

    if (filteredData.length === 0) {
      return <div className="no-data">No data found</div>;
    }

    const getColumns = () => {
      switch (activeTab) {
        case "campus":
          return [
            { header: "Name", accessor: "name" },
            { header: "Location", accessor: "location" },
            { header: "Contact", accessor: "contactNumber" },
            { header: "Actions", accessor: "actions" },
          ];
        case "principal":
          return [
            { header: "Name", accessor: "name" },
            { header: "Email", accessor: "user.email" },
            { header: "Phone", accessor: "contactNumber" },
            { header: "Actions", accessor: "actions" },
          ];
        case "teacher":
          return [
            { header: "Name", accessor: "name" },
            { header: "Email", accessor: "user.email" },
            { header: "Specialization", accessor: "subjectSpecialization" },
            { header: "Qualification", accessor: "qualifications" },
            { header: "Actions", accessor: "actions" },
          ];
        case "student":
          return [
            { header: "Name", accessor: "name" },
            { header: "CNIC", accessor: "cnic" },
            { header: "Email", accessor: "email" },
            { header: "Phone", accessor: "phone" },
            { header: "City", accessor: "city" },
            { header: "PNC No", accessor: "pncNo" },
            { header: "Passport", accessor: "passport" },
            { header: "Doc Status", accessor: "documentstatus" },
            { header: "Actions", accessor: "actions" },
          ];
        case "course":
          return [
            { header: "Name", accessor: "name" },
            { header: "Code", accessor: "code" },
            { header: "Credit Hours", accessor: "creditHours" },
            {
              header: "Duration",
              accessor: (item) =>
                `${
                  item.startDate
                    ? new Date(item.startDate).toLocaleDateString()
                    : ""
                } -
                 ${
                   item.endDate
                     ? new Date(item.endDate).toLocaleDateString()
                     : ""
                 }`,
            },
            { header: "Actions", accessor: "actions" },
          ];
        default:
          return [];
      }
    };

    const getNestedValue = (obj, path) => {
      return path
        .split(".")
        .reduce((o, key) => (o && o[key] !== undefined ? o[key] : ""), obj);
    };

    return (
      <div className="data-table-container">
        <div className="search-bar">
          <MdSearch className="search-icon" />
          <input
            type="text"
            placeholder={`Search ${activeTab}s...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              {getColumns().map((column, index) => (
                <th key={index}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item._id}>
                {getColumns().map((column, colIndex) => {
                  if (column.accessor === "actions") {
                    return (
                      <td key={colIndex} className="actions-cell">
                        <button
                          onClick={() => handleEdit(item)}
                          className="edit-btn"
                          title="Edit"
                        >
                          <MdEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="delete-btn"
                          title="Delete"
                        >
                          <MdDelete />
                        </button>
                      </td>
                    );
                  }

                  const value =
                    typeof column.accessor === "function"
                      ? column.accessor(item)
                      : getNestedValue(item, column.accessor);

                  return <td key={colIndex}>{value || "-"}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ---- component return (kept same layout / classes) ----
  return (
    <div className="registrations-container">
      <div className="header">
        <h2>Registrations</h2>
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === "add" ? "active" : ""}`}
            onClick={() => {
              setViewMode("add");
              resetForm();
            }}
          >
            <MdAdd /> Add New
          </button>
          <button
            className={`view-btn ${viewMode === "view" ? "active" : ""}`}
            onClick={() => setViewMode("view")}
          >
            <MdPeople /> View All
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "campus" ? "active" : ""}`}
          onClick={() => handleTabChange("campus")}
        >
          <MdSchool /> Campuses
        </button>
        <button
          className={`tab-btn ${activeTab === "principal" ? "active" : ""}`}
          onClick={() => handleTabChange("principal")}
        >
          <MdPerson /> Principals
        </button>
        <button
          className={`tab-btn ${activeTab === "teacher" ? "active" : ""}`}
          onClick={() => handleTabChange("teacher")}
        >
          <MdPerson /> Teachers
        </button>
        <button
          className={`tab-btn ${activeTab === "student" ? "active" : ""}`}
          onClick={() => handleTabChange("student")}
        >
          <MdPeople /> Students
        </button>
        <button
          className={`tab-btn ${activeTab === "course" ? "active" : ""}`}
          onClick={() => handleTabChange("course")}
        >
          <MdSchool /> Courses
        </button>
      </div>

      {successMessage && <div className="alert success">{successMessage}</div>}
      {errorMessage && <div className="alert error">{errorMessage}</div>}

      <div className="content-area">
        {viewMode === "add" ? renderForm() : renderDataTable()}
      </div>
    </div>
  );
};

export default Registrations;
