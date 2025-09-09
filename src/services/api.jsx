import axios from "axios";

// const API_URL =
//   import.meta.env?.VITE_API_BASE || "/api/v1";

// const API_URL = "http://localhost:5000/api/v1";
const API_URL = import.meta.env?.VITE_API_BASE || "/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

// Campus API
export const getCampuses = async () => {
  const response = await api.get("/admin/campuses");
  return response.data;
};

export const createCampus = async (campusData) => {
  const response = await api.post("/admin/campuses", campusData);
  return response.data;
};

export const updateCampus = async (id, campusData) => {
  const response = await api.put(`/admin/campuses/${id}`, campusData);
  return response.data;
};

export const deleteCampus = async (id) => {
  const response = await api.delete(`/admin/campuses/${id}`);
  return response.data;
};

// Coordinator API
export const getCoordinators = async () => {
  const response = await api.get("/admin/coordinators");
  return response.data;
};

export const createCoordinator = async (coordinatorData) => {
  const response = await api.post("/admin/coordinators", coordinatorData);
  return response.data;
};

export const updateCoordinator = async (id, coordinatorData) => {
  const response = await api.put(`/admin/coordinators/${id}`, coordinatorData);
  return response.data;
};

export const deleteCoordinator = async (id) => {
  const response = await api.delete(`/admin/coordinators/${id}`);
  return response.data;
};

// Teacher API
export const getTeachers = async () => {
  const response = await api.get("/admin/teachers");
  return response.data;
};

export const createTeacher = async (teacherData) => {
  const response = await api.post("/admin/teachers", teacherData);
  return response.data;
};

export const updateTeacher = async (id, teacherData) => {
  const response = await api.put(`/admin/teachers/${id}`, teacherData);
  return response.data;
};

export const deleteTeacher = async (id) => {
  const response = await api.delete(`/admin/teachers/${id}`);
  return response.data;
};

// Student API
export const getStudents = async () => {
  const response = await api.get("/admin/students");
  return response.data;
};

export const createStudent = async (studentData) => {
  const response = await api.post("/admin/students", studentData);
  return response.data;
};

export const updateStudent = async (id, studentData) => {
  const response = await api.put(`/admin/students/${id}`, studentData);
  return response.data;
};

export const deleteStudent = async (id) => {
  const response = await api.delete(`/admin/students/${id}`);
  return response.data;
};

// Course API
export const getCourses = async () => {
  const response = await api.get("/admin/courses");
  return response.data;
};

export const createCourse = async (courseData) => {
  const response = await api.post("/admin/courses", courseData);
  return response.data;
};

export const updateCourse = async (id, courseData) => {
  const response = await api.put(`/admin/courses/${id}`, courseData);
  return response.data;
};

export const deleteCourse = async (id) => {
  const response = await api.delete(`/admin/courses/${id}`);
  return response.data;
};

// Assignment APIs
export const assignCoordinatorToCampus = async (coordinatorId, campusId) => {
  const response = await api.post("/admin/assign/coordinator", {
    coordinatorId,
    campusId,
  });
  return response.data;
};

export const assignTeachersToCourses = async (teacherId, courseIds) => {
  const response = await api.post(
    "/admin/assign/teacher-to-course-and-campus",
    {
      teacherId,
      courseIds,
    }
  );
  return response.data;
};

export const assignStudentsToCampusAndCourses = async (
  studentIds,
  campusId,
  courseIds
) => {
  const response = await api.post("/admin/assign/students", {
    studentIds,
    campusId,
    courseIds,
  });
  return response.data;
};
// Add these to your api.js
export const getStudentsByCity = async (city, page = 1) => {
  const response = await api.get(
    `/admin/students/city?city=${city}&page=${page}`
  );
  return response.data;
};

export const assignStudentsToCampus = async (studentIds, campusId) => {
  const response = await api.post("/admin/assign/students-to-campus", {
    studentIds,
    campusId,
  });
  return response.data;
};

// ✅ send the array key the backend expects
export const assignCourseToCampus = async (courseId, campusId) => {
  const { data } = await api.post("/admin/assign/course-to-campus", {
    courseIds: [courseId], // <-- array
    campusId,
  });
  return data;
};

// ✅ batch directly in one request (preferred)
export const assignCoursesToCampus = async (courseIds = [], campusId) => {
  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    throw new Error("courseIds must be a non-empty array");
  }
  const { data } = await api.post("/admin/assign/course-to-campus", {
    courseIds, // <-- array
    campusId,
  });
  return data;
};

export const getUnassignedCourses = async (page = 1) => {
  const response = await api.get(`/admin/courses/unassigned?page=${page}`);
  return response.data;
};

//API RELATED TO COORDINATOR PORTAL
export const getStudentsByCampus = async (campusId) => {
  const response = await api.get(`/admin/campuses/${campusId}/students`);
  return response.data;
};

export const getTeachersByCampus = async (campusId) => {
  const response = await axios.get(`/api/teachers?campus=${campusId}`);
  return response.data;
};

export const getCampusCourses = async (campusId) => {
  const response = await axios.get(`/api/courses?campus=${campusId}`);
  return response.data;
};

export const assignTeacherToCourse = async (courseId, teacherId) => {
  const response = await axios.put(`/api/courses/${courseId}/assign-teacher`, {
    teacherId,
  });
  return response.data;
};

//Lession Plans API

export const lessonPlanService = {
  // Create a new lesson plan
  create: async (lessonPlanData) => {
    const response = await api.post("/lesson-plans", lessonPlanData);
    return response.data;
  },

  // Get all lesson plans with pagination
  getAll: async (page = 1, limit = 10) => {
    const response = await api.get(`/lesson-plans?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get a single lesson plan
  getById: async (id) => {
    const response = await api.get(`/lesson-plans/${id}`);
    return response.data;
  },

  // Update a lesson plan
  update: async (id, lessonPlanData) => {
    const response = await api.put(`/lesson-plans/${id}`, lessonPlanData);
    return response.data;
  },

  // Delete a lesson plan (soft delete)
  delete: async (id) => {
    const response = await api.delete(`/lesson-plans/${id}`);
    return response.data;
  },

  // Duplicate a lesson plan
  duplicate: async (id) => {
    const response = await api.post(`/lesson-plans/${id}/duplicate`);
    return response.data;
  },

  // Search lesson plans
  search: async (query) => {
    const response = await api.get(
      `/lesson-plans/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },
};

// Coordinator Dashboard API
export const getCampusDashboard = async () => {
  const response = await api.get("/coordinator/dashboard");
  return response.data;
};

export const getCampusStudents = async () => {
  const response = await api.get("/coordinator/students");
  return response.data;
};

export const getCampusCoursescor = async () => {
  const response = await api.get("/coordinator/courses");
  return response.data;
};

export const getCampusTeachers = async () => {
  const response = await api.get("/coordinator/teachers");
  return response.data;
};
export default api;
