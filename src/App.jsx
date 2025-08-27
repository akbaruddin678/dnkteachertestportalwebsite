import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";

import SuperAdminLayout from "./Layout/SuperAdminLayout";
import SuperAdminCategory from './Components/SuperAdmin/Category/Category.jsx'
import SuperAdminDashboard from "./Components/SuperAdmin/Dashbaord/Dashboard";
import SuperAdminNotifications from "./Components/SuperAdmin/Notifications/Notifications";
import SuperAdminRegistrations from "./Components/SuperAdmin/Registrations/Registrations";
import SuperAdminReports from "./Components/SuperAdmin/Reports/Reports";
import SuperAdminSettings from "./Components/SuperAdmin/Settings/Settings";
import SuperAdminUploadLessonsPlans from "./Components/SuperAdmin/UploadLessonsPlans/UploadLessonsPlans";
import SuperAdminCourses from "./Components/SuperAdmin/Courses/Courses";

import CoordinatorLayout from "./Layout/CoordinatorLayout";
import CoordinatorDashboard from "./Components/Coordinator/Dashbaord/Dashboard";
import CoordinatorAttendance from "./Components/Coordinator/Attendance/Attendance.jsx";
import CoordinatorCategory from './Components/Coordinator/Category/Category.jsx'
import CoordinatorManageStudents from "./Components/Coordinator/ManageStudents/ManageStudents";
import CoordinatorManageTeachers from "./Components/Coordinator/ManageTeachers/ManageTeachers";
import CoordinatorNotifications from "./Components/Coordinator/Notifications/Notifications";
import CoordinatorRegistrations from "./Components/Coordinator/Registrations/Registrations";
import CoordinatorReports from "./Components/Coordinator/Reports/Reports";
import CoordinatorSettings from "./Components/Coordinator/Settings/Settings";
import CoordinatorUploadLessonsPlans from "./Components/Coordinator/UploadLessonsPlans/UploadLessonsPlans";
import CoordinatorCourses from "./Components/Coordinator/Courses/Courses";

import TeacherLayout from "./Layout/TeacherLayout";
import TeacherDashboard from "./Components/Teacher/Dashbaord/Dashboard";
import TeacherCategory from "./Components/Teacher/Category/Category.jsx";
import TeacherManageStudents from "./Components/Teacher/ManageStudents/ManageStudents";
import TeacherNotifications from "./Components/Teacher/Notifications/Notifications";
import TeacherRegistrations from "./Components/Teacher/Registrations/Registrations";
import TeacherReports from "./Components/Teacher/Reports/Reports";
import TeacherSettings from "./Components/Teacher/Settings/Settings";
import TeacherUploadLessonsPlans from "./Components/Teacher/UploadLessonsPlans/UploadLessonsPlans";
import TeacherCourses from "./Components/Teacher/Courses/Courses.jsx";
import TeacherAttendance from "./Components/Teacher/Attendance/Attendance.jsx";


import Help from './Components/Common/Help/Help'


import Login from "./Components/Auth/Login"

import ProtectedRoute from "./Components/Common/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {/* Nest all superadmin routes under this layout */}

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="category" element={<SuperAdminCategory />} />
        <Route path="notifications" element={<SuperAdminNotifications />} />
        <Route path="registrations" element={<SuperAdminRegistrations />} />
        <Route path="reports" element={<SuperAdminReports />} />
        <Route path="settings" element={<SuperAdminSettings />} />
        <Route
          path="uploadlessonsplans"
          element={<SuperAdminUploadLessonsPlans />}
        />
        <Route path="courses" element={<SuperAdminCourses />} />
        <Route path="help" element={<Help />} />
      </Route>

      {/* Nest all coordinator routes under this layout */}
      <Route path="/coordinator" element={<CoordinatorLayout />}>
        <Route path="dashboard" element={<CoordinatorDashboard />} />
        <Route path="attendance" element={<CoordinatorAttendance />} />
        <Route path="category" element={<CoordinatorCategory />} />
        <Route path="managestudents" element={<CoordinatorManageStudents />} />
        <Route path="manageteachers" element={<CoordinatorManageTeachers />} />
        <Route path="notifications" element={<CoordinatorNotifications />} />
        <Route path="registrations" element={<CoordinatorRegistrations />} />
        <Route path="reports" element={<CoordinatorReports />} />
        <Route path="settings" element={<CoordinatorSettings />} />
        <Route
          path="uploadlessonsplans"
          element={<CoordinatorUploadLessonsPlans />}
        />
        <Route path="courses" element={<CoordinatorCourses />} />
        <Route path="help" element={<Help />} />
      </Route>

      {/* Nest all teacher routes under this layout */}
      <Route path="/teacher" element={<TeacherLayout />}>
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="category" element={<TeacherCategory />} />
        <Route path="managestudents" element={<TeacherManageStudents />} />
        <Route path="notifications" element={<TeacherNotifications />} />
        <Route path="registrations" element={<TeacherRegistrations />} />
        <Route path="reports" element={<TeacherReports />} />
        <Route path="settings" element={<TeacherSettings />} />
        <Route
          path="uploadlessonsplans"
          element={<TeacherUploadLessonsPlans />}
        />
        <Route path="courses" element={<TeacherCourses />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="help" element={<Help />} />
      </Route>
    </Routes>
  );
}

export default App;
