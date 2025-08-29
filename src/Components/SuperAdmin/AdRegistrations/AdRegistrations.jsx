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

const Registrations = () => {
  const [activeTab, setActiveTab] = useState("campus");
  const [viewMode, setViewMode] = useState("add");
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
  const normalizeCNIC = (cnic) => (cnic || "").replace(/\D/g, "");
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
          city: (a.preferred_institute || "").trim(),
        };

        if (total < 50) {
          skipped.push({ cnic: a.cnic, reason: `Total marks ${total} < 50` });
          continue;
        }
        console.log(payload);
        console.log(total);
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
  const activeKey = (tab) => tab;

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
        courseContent: [
          ...prev.course.courseContent,
          prev.course.currentContent,
        ],
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

    if (tab === "student") {
      // Force student tab to open in view mode only
      setViewMode("view");
    } else {
      resetForm(); // others behave normally
    }
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
      setErrorMessage(
        error.message || "Registration failed. Please try again."
      );
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
            currentContent: {
              title: "",
              duration: "",
              description: "",
              remarks: "",
            },
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
        `${
          activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
        } deleted successfully!`
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
      <form onSubmit={handleSubmit} style={styles.formContainer}>
        {activeTab === "campus" && (
          <>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Campus Name *</label>
                <input
                  type="text"
                  value={cur.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Location *</label>
                <input
                  type="text"
                  value={cur.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  required
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Address</label>
                <textarea
                  value={cur.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  rows="3"
                  style={styles.textarea}
                />
              </div>
              <div style={styles.formGroup}>
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
                  style={styles.input}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "principal" && (
          <>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Name *</label>
                <input
                  type="text"
                  value={cur.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Email *</label>
                <input
                  type="email"
                  value={cur.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>
                  {editingId ? "New Password" : "Password *"}
                  {!editingId && (
                    <small style={styles.hint}>Minimum 6 characters</small>
                  )}
                </label>
                <div style={styles.passwordInput}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={cur.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    required={!editingId}
                    minLength="6"
                    style={styles.input}
                  />
                  <button
                    type="button"
                    style={styles.togglePassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label>Phone *</label>
                <input
                  type="tel"
                  value={cur.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  pattern="[0-9]{10,15}"
                  title="10-15 digit phone number"
                  required
                  style={styles.input}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "teacher" && (
          <>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Name *</label>
                <input
                  type="text"
                  value={cur.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Email *</label>
                <input
                  type="email"
                  value={cur.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>
                  {editingId ? "New Password" : "Password *"}
                  {!editingId && (
                    <small style={styles.hint}>Minimum 6 characters</small>
                  )}
                </label>
                <div style={styles.passwordInput}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={cur.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    required={!editingId}
                    minLength="6"
                    style={styles.input}
                  />
                  <button
                    type="button"
                    style={styles.togglePassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Subject Specialization *</label>
                <input
                  type="text"
                  value={cur.subjectSpecialization}
                  onChange={(e) =>
                    handleInputChange("subjectSpecialization", e.target.value)
                  }
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Qualifications </label>
                <input
                  type="text"
                  value={cur.qualifications}
                  onChange={(e) =>
                    handleInputChange("qualifications", e.target.value)
                  }
                  required
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Phone</label>
                <input
                  type="tel"
                  value={cur.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  pattern="[0-9]{10,15}"
                  title="10-15 digit phone number"
                  style={styles.input}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "student" && (
          <>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Name *</label>
                <input
                  type="text"
                  value={cur.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>CNIC *</label>
                <input
                  type="text"
                  value={cur.cnic}
                  onChange={(e) => handleInputChange("cnic", e.target.value)}
                  required
                  pattern="[0-9]{13}"
                  title="13 digit CNIC number"
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  value={cur.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Phone *</label>
                <input
                  type="tel"
                  value={cur.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  pattern="[0-9]{10,15}"
                  title="10-15 digit phone number"
                  required
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>PNC No</label>
                <input
                  type="text"
                  value={cur.pncNo}
                  onChange={(e) => handleInputChange("pncNo", e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Passport</label>
                <input
                  type="text"
                  value={cur.passport}
                  onChange={(e) =>
                    handleInputChange("passport", e.target.value)
                  }
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Document Status</label>
                <select
                  value={cur.documentstatus}
                  onChange={(e) =>
                    handleInputChange("documentstatus", e.target.value)
                  }
                  style={styles.input}
                >
                  <option value="notverified">Not Verified</option>
                  <option value="verified">Verified</option>
                </select>
              </div>
            </div>
            {!editingId && (
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>Bulk Import Students (Excel)</label>
                  <div style={styles.fileUpload}>
                    <input
                      type="file"
                      id="student-excel"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => handleFileChange("studentExcelFile", e)}
                      style={{ display: "none" }}
                    />
                    <label htmlFor="student-excel" style={styles.fileUploadBtn}>
                      <MdAttachFile />{" "}
                      {cur.studentExcelFile
                        ? cur.studentExcelFile.name
                        : "Choose Excel File"}
                    </label>
                    {cur.studentExcelFile && (
                      <button
                        type="button"
                        onClick={handleImport}
                        style={styles.importBtn}
                        disabled={loading}
                      >
                        {loading ? "Importing..." : "Import Students"}
                      </button>
                    )}

                    {/* Fetch & Register from Portal */}
                    <button
                      type="button"
                      onClick={handleFetchAndRegisterFromPortal}
                      style={{
                        ...styles.importBtn,
                        ...styles.secondaryBtn,
                        marginLeft: "8px",
                      }}
                      disabled={loading}
                    >
                      {loading
                        ? "Processing..."
                        : "Fetch & Register from Portal"}
                    </button>
                  </div>
                  <small style={styles.hint}>
                    Excel should contain columns: name, email, phone, cnic,
                    pncNo, passport
                  </small>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "course" && (
          <>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Course Name *</label>
                <input
                  type="text"
                  value={cur.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Course Code *</label>
                <input
                  type="text"
                  value={cur.code}
                  onChange={(e) => handleInputChange("code", e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Credit Hours *</label>
                <input
                  type="number"
                  value={cur.creditHours}
                  onChange={(e) =>
                    handleInputChange("creditHours", e.target.value)
                  }
                  required
                  min="1"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={cur.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows="3"
                  style={styles.textarea}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Start Date</label>
                <input
                  type="date"
                  value={cur.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>End Date</label>
                <input
                  type="date"
                  value={cur.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  min={cur.startDate}
                  style={styles.input}
                />
              </div>
            </div>
          </>
        )}

        <div style={styles.formActions}>
          <button
            type="button"
            style={styles.cancelBtn}
            onClick={() => {
              setViewMode("view");
              resetForm();
            }}
          >
            Cancel
          </button>
          <button type="submit" style={styles.submitBtn} disabled={loading}>
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
      return <div style={styles.loading}>Loading...</div>;
    }

    if (filteredData.length === 0) {
      return <div style={styles.noData}>No data found</div>;
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
            { header: "S.No", accessor: "serial" },
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
      <div style={styles.dataTableContainer}>
        <div style={styles.searchBar}>
          <MdSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder={`Search ${activeTab}s...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <table style={styles.dataTable}>
          <thead>
            <tr>
              {getColumns().map((column, index) => (
                <th key={index} style={styles.tableHeader}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr key={item._id} style={styles.tableRow}>
                {getColumns().map((column, colIndex) => {
                  if (column.accessor === "actions") {
                    return (
                      <td key={colIndex} style={styles.actionsCell}>
                        <button
                          onClick={() => handleEdit(item)}
                          style={styles.editBtn}
                          title="Edit"
                        >
                          <MdEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          style={styles.deleteBtn}
                          title="Delete"
                        >
                          <MdDelete />
                        </button>
                      </td>
                    );
                  }

                  // ✅ Handle serial number
                  if (column.accessor === "serial") {
                    return (
                      <td key={colIndex} style={styles.tableCell}>
                        {index + 1}
                      </td>
                    );
                  }

                  const value =
                    typeof column.accessor === "function"
                      ? column.accessor(item)
                      : getNestedValue(item, column.accessor);

                  return (
                    <td key={colIndex} style={styles.tableCell}>
                      {value || "-"}
                    </td>
                  );
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
    <>
      <style>{`* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.registrations {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
    background-color: #f5f7fa;
    min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
    background-color: #1976d2;
    color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header h1 {
  font-size: 2.2rem;
  margin-bottom: 10px;
}

.header p {
  font-size: 1rem;
  opacity: 0.9;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 5px;
    margin-bottom: 25px;
    background-color: #e3f2fd;
    padding: 8px;
  border-radius: 8px;
  flex-wrap: wrap;
}

.tab {
  padding: 12px 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  font-weight: 500;
  color: #333;
    transition: all 0.3s ease;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab.active {
  background-color: white;
  color: #1976d2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tab:hover:not(.active) {
  background-color: rgba(255, 255, 255, 0.7);
}

.import-export {
  display: flex;
  justify-content: space-between;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
}

.import-section {
  display: flex;
  align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  
  .import-btn,
  .export-btn,
  .process-btn {
    padding: 10px 16px;
    border-radius: 6px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
  }
  
  .import-btn {
    background-color: #e3f2fd;
    color: #1976d2;
    border: 1px solid #bbdefb;
  }
  
  .import-btn:hover {
    background-color: #bbdefb;
  }
  
  .export-btn {
    background-color: #4caf50;
    color: white;
  }
  
  .export-btn:hover {
    background-color: #3d8b40;
  }
  
  .process-btn {
    background-color: #2196f3;
    color: white;
  }
  
  .process-btn:hover {
    background-color: #0b7dda;
  }
  
  .form-container {
    background: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin-bottom: 30px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
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
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
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

.content-section {
  margin: 30px 0;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.content-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.content-form {
  margin-bottom: 20px;
}

.add-content-btn {
  padding: 10px 16px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.add-content-btn:hover {
  background-color: #1565c0;
}

.content-list {
  margin-top: 20px;
}

.content-list h4 {
  margin-bottom: 15px;
  color: #555;
}

.content-list ul {
  list-style: none;
  padding: 0;
}

.content-list li {
  margin-bottom: 15px;
  padding: 15px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
}

.content-item strong {
  color: #333;
}

.content-item p {
  margin: 5px 0;
  color: #666;
}

.content-item .remarks {
  font-style: italic;
  color: #888;
}

.remove-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: #f44336;
  cursor: pointer;
  font-size: 1.2rem;
}

.file-upload-section {
  margin: 25px 0;
}

.file-upload {
  margin-top: 15px;
}

.file-upload input[type="file"] {
  display: none;
}

.file-upload-btn {
  padding: 12px 16px;
  border: 1px dashed #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-upload-btn:hover {
  border-color: #1976d2;
  background-color: #f0f7ff;
}

.form-actions {
  display: flex;
    justify-content: flex-end;
    margin-top: 30px;
      padding-top: 25px;
      border-top: 1px solid #eee;
    }

.submit-btn {
  padding: 12px 24px;
    background-color: #1976d2;
      color: white;
    border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      font-size: 14px;
    transition: background-color 0.3s ease;
    }
        .registrations {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
    
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e0e0e0;
        }
    
        .header h2 {
          margin: 0;
          color: #333;
          font-size: 24px;
          font-weight: 600;
        }
    
        .view-toggle {
          display: flex;
          gap: 10px;
        }
    
        .view-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
    background-color: #f8f9fa;
    color: #555;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
}

.view-btn:hover {
  background-color: #e9ecef;
  border-color: #ccc;
}

.view-btn.active {
  background-color: #3f51b5;
  border-color: #3f51b5;
  color: white;
}

.view-btn svg {
  font-size: 18px;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.header p {
  color: #7f8c8d;
  font-size: 16px;
}

.tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #ddd;
}

.tab {
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #7f8c8d;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.tab:hover {
  color: #3498db;
}

.tab.active {
  color: #3498db;
  border-bottom-color: #3498db;
  font-weight: 600;
}

.form-container {
  background: #fff;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-row {
  display: flex;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .form-group {
    flex: 1;
    margin-bottom: 15px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #2c3e50;
  }
  
  .form-group label:after {
    content: attr(data-required);
    color: #e74c3c;
    margin-left: 4px;
  }

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    transition: border-color 0.3s;
  }
  
  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    border-color: #3498db;
    outline: none;
  }
  
  .form-group textarea {
    min-height: 80px;
    resize: vertical;
  }
  
  .password-input {
    position: relative;
  }
  
  .password-input input {
    padding-right: 40px;
  }
  
  .toggle-password {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #7f8c8d;
    font-size: 20px;
  }
  
  .hint {
    color: #7f8c8d;
    font-size: 12px;
    margin-top: 4px;
    display: block;
  }
  
  .content-section {
    margin-top: 30px;
    border-top: 1px solid #eee;
    padding-top: 20px;
  }
  
  .content-form {
    background: #f9f9f9;
    padding: 15px;
    border-radius: 6px;
    margin-bottom: 20px;
  }
  
  .content-list {
    margin-top: 20px;
  }
  
  .content-list ul {
    list-style: none;
    padding: 0;
  }
  
  .content-list li {
    background: #f5f5f5;
    padding: 15px;
    border-radius: 6px;
    margin-bottom: 10px;
    position: relative;
  }
  
  .content-item {
    padding-right: 40px;
  }
  
  .content-item strong {
    color: #2c3e50;
  }
  
  .content-item p {
    margin: 5px 0;
    color: #555;
  }
  
  .remarks {
    font-style: italic;
    color: #7f8c8d !important;
  }
  
  .remove-btn {
    position: absolute;
    right: 15px;
    top: 15px;
    background: none;
    border: none;
    cursor: pointer;
    color: #e74c3c;
    font-size: 18px;
  }
  
  .add-content-btn {
    background: #3498db;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
    margin-top: 10px;
  }
  
  .add-content-btn:hover {
    background: #2980b9;
  }
  
  .file-upload {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .file-upload input[type="file"] {
    display: none;
  }
  
  .file-upload-btn {
    background: #ecf0f1;
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
    border: 1px dashed #bdc3c7;
    flex: 1;
  }
  
  .file-upload-btn:hover {
    background: #dfe6e9;
  }
  
  .import-btn {
    background: #2ecc71;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }
  
  .import-btn:hover {
    background: #27ae60;
  }

.import-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.form-actions {
  margin-top: 30px;
    text-align: right;
  }
  
  .submit-btn {
    background: #2ecc71;
    color: white;
    border: none;
    padding: 12px 25px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
  
    .submit-btn:disabled {
      background-color: #95a5a6;
      cursor: not-allowed;
    }
  
    .alert {
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
    }
  
    .alert-success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
  
    .alert-error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
  
    .alert-content {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
  
    .alert-icon {
      font-weight: bold;
      font-size: 18px;
    }
  
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .form-row {
      flex-direction: column;
        gap: 0;
        
          .tabs {
            overflow-x: auto;
            padding-bottom: 10px;
        
            .tab {
              white-space: nowrap;
            }
          }
        }
        }
        
        
        .data-table-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin-top: 20px;
          overflow: hidden;
        }
        
        .search-bar {
          display: flex;
          justify-content: flex-end;
          padding: 15px 20px;
          background-color: #f8f9fa;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .search-bar-inner {
          display: flex;
          align-items: center;
          background: white;
          border-radius: 20px;
          padding: 5px 15px;
          border: 1px solid #ddd;
          width: 300px;
          transition: all 0.3s ease;
        }
        
        .search-bar-inner:focus-within {
          border-color: #1976d2;
          box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
        }
        
        .search-bar .search-icon {
          font-size: 18px;
          color: #6c757d;
          margin-right: 10px;
        }
        
        .search-bar input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          padding: 8px 0;
          background: transparent;
        }
        
        .search-bar input::placeholder {
          color: #adb5bd;
      

.data-table {
  width: 100%;
  border-collapse: collapse;
    font-size: 14px;
  }
  
  .data-table th {
    background-color: #f5f7fa;
    padding: 12px 20px;
    text-align: left;
    font-weight: 600;
    color: #495057;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .data-table td {
    padding: 12px 20px;
    border-bottom: 1px solid #f0f0f0;
    color: #212529;
  }
  
  .data-table tr:last-child td {
    border-bottom: none;
  }
  
  .data-table tr:hover td {
    background-color: #f8fafc;
  }
  
  .actions-cell {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  
  .edit-btn,
  .delete-btn {
    padding: 6px;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 50%;
    color: #6c757d;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
  }
  
  .edit-btn:hover {
    background-color: rgba(25, 118, 210, 0.1);
    color: #1976d2;
  }
  
  .delete-btn:hover {
    background-color: rgba(220, 53, 69, 0.1);
    color: #dc3545;
  }
  
  .loading {
    padding: 30px;
    text-align: center;
    color: #6c757d;
    font-size: 15px;
  }
  
  .no-data {
    padding: 30px;
    text-align: center;
    color: #6c757d;
    font-style: italic;
    font-size: 15px;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .search-bar {
      padding: 10px;
  }
    .search-bar-inner {
      width: 100%;
  
        .data-table th,
        .data-table td {
          padding: 10px 12px;
  
    .actions-cell {
        gap: 6px;
  }
  
        .edit-btn,
        .delete-btn {
          width: 28px;
          height: 28px;
          padding: 5px;
  }
}

`}</style>
      <div style={styles.registrationsContainer}>
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>Registrations</h2>
          <div style={styles.viewToggle}>
            <button
              style={{
                ...styles.viewBtn,
                ...(viewMode === "add" ? styles.viewBtnActive : {}),
                ...(activeTab === "student"
                  ? {
                      backgroundColor: "#ccc",
                      cursor: "not-allowed",
                      color: "#666",
                    }
                  : {}),
              }}
              onClick={() => {
                if (activeTab !== "student") {
                  setViewMode("add");
                  resetForm();
                }
              }}
              disabled={activeTab === "student"} // 👈 disable when student is active
            >
              <MdAdd /> Add New
            </button>

            <button
              style={{
                ...styles.viewBtn,
                ...(viewMode === "view" ? styles.viewBtnActive : {}),
              }}
              onClick={() => setViewMode("view")}
            >
              <MdPeople /> View All
            </button>
          </div>
        </div>

        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === "campus" ? styles.tabBtnActive : {}),
            }}
            onClick={() => handleTabChange("campus")}
          >
            <MdSchool /> Campuses
          </button>
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === "principal" ? styles.tabBtnActive : {}),
            }}
            onClick={() => handleTabChange("principal")}
          >
            <MdPerson /> Principals
          </button>
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === "teacher" ? styles.tabBtnActive : {}),
            }}
            onClick={() => handleTabChange("teacher")}
          >
            <MdPerson /> Teachers
          </button>

          {/* // For Student Registration Make Sur this is only Visible  based on requirement and time  */}
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === "student" ? styles.tabBtnActive : {}),
            }}
            onClick={() => handleTabChange("student")}
          >
            <MdPeople /> Students
          </button>
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === "course" ? styles.tabBtnActive : {}),
            }}
            onClick={() => handleTabChange("course")}
          >
            <MdSchool /> Courses
          </button>
        </div>

        {successMessage && (
          <div style={{ ...styles.alert, ...styles.successAlert }}>
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div style={{ ...styles.alert, ...styles.errorAlert }}>
            {errorMessage}
          </div>
        )}

        <div style={styles.contentArea}>
          {viewMode === "add" ? renderForm() : renderDataTable()}
        </div>
      </div>
    </>
  );
};

// Inline styles object
const styles = {
  registrationsContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#f5f7fa",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    paddingBottom: "15px",
    borderBottom: "1px solid #e0e0e0",
  },
  headerTitle: {
    margin: 0,
    color: "#333",
    fontSize: "24px",
    fontWeight: 600,
  },
  viewToggle: {
    display: "flex",
    gap: "10px",
  },
  viewBtn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "8px 15px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    backgroundColor: "#f8f9fa",
    color: "#555",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  viewBtnActive: {
    backgroundColor: "#3f51b5",
    borderColor: "#3f51b5",
    color: "white",
  },
  tabs: {
    display: "flex",
    marginBottom: "20px",
    borderBottom: "1px solid #ddd",
    overflowX: "auto",
    paddingBottom: "10px",
  },
  tabBtn: {
    padding: "10px 20px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#7f8c8d",
    borderBottom: "3px solid transparent",
    transition: "all 0.3s ease",
    whiteSpace: "nowrap",
  },
  tabBtnActive: {
    color: "#3498db",
    borderBottomColor: "#3498db",
    fontWeight: 600,
  },
  formContainer: {
    background: "#fff",
    padding: "25px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
  },
  formRow: {
    display: "flex",
    gap: "20px",
    marginBottom: "20px",
  },
  formGroup: {
    flex: 1,
    marginBottom: "15px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "16px",
    transition: "border-color 0.3s",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "16px",
    transition: "border-color 0.3s",
    minHeight: "80px",
    resize: "vertical",
  },
  passwordInput: {
    position: "relative",
  },
  togglePassword: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#7f8c8d",
    fontSize: "20px",
  },
  hint: {
    color: "#7f8c8d",
    fontSize: "12px",
    marginTop: "4px",
    display: "block",
  },
  fileUpload: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  fileUploadBtn: {
    background: "#ecf0f1",
    padding: "10px 15px",
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "14px",
    border: "1px dashed #bdc3c7",
    flex: 1,
  },
  importBtn: {
    background: "#2ecc71",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  },
  secondaryBtn: {
    background: "#2196f3",
  },
  formActions: {
    marginTop: "30px",
    textAlign: "right",
  },
  submitBtn: {
    background: "#2ecc71",
    color: "white",
    border: "none",
    padding: "12px 25px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 500,
  },
  cancelBtn: {
    background: "#95a5a6",
    color: "white",
    border: "none",
    padding: "12px 25px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 500,
    marginRight: "10px",
  },
  alert: {
    padding: "15px",
    borderRadius: "4px",
    marginBottom: "20px",
  },
  successAlert: {
    background: "#d4edda",
    color: "#155724",
    border: "1px solid #c3e6cb",
  },
  errorAlert: {
    background: "#f8d7da",
    color: "#721c24",
    border: "1px solid #f5c6cb",
  },
  dataTableContainer: {
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    marginTop: "20px",
    overflow: "hidden",
  },
  searchBar: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "15px 20px",
    backgroundColor: "#f8f9fa",
    borderBottom: "1px solid #e0e0e0",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "14px",
    padding: "8px 0",
    background: "transparent",
  },
  searchIcon: {
    fontSize: "18px",
    color: "#6c757d",
    marginRight: "10px",
  },
  dataTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  tableHeader: {
    backgroundColor: "#f5f7fa",
    padding: "12px 20px",
    textAlign: "left",
    fontWeight: 600,
    color: "#495057",
    borderBottom: "1px solid #e0e0e0",
  },
  tableRow: {
    borderBottom: "1px solid #f0f0f0",
  },
  tableCell: {
    padding: "12px 20px",
    color: "#212529",
  },
  actionsCell: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    padding: "12px 20px",
  },
  editBtn: {
    padding: "6px",
    border: "none",
    background: "none",
    cursor: "pointer",
    borderRadius: "50%",
    color: "#6c757d",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
  },
  deleteBtn: {
    padding: "6px",
    border: "none",
    background: "none",
    cursor: "pointer",
    borderRadius: "50%",
    color: "#6c757d",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
  },
  loading: {
    padding: "30px",
    textAlign: "center",
    color: "#6c757d",
    fontSize: "15px",
  },
  noData: {
    padding: "30px",
    textAlign: "center",
    color: "#6c757d",
    fontStyle: "italic",
    fontSize: "15px",
  },
  contentArea: {
    marginTop: "20px",
  },
};

export default Registrations;