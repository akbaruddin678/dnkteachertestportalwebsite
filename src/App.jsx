import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";

import SuperAdminLayout from "./Layout/SuperAdminLayout";
import SuperAdminCategory from './Components/SuperAdmin/AdCategory/AdCategory.jsx'
import SuperAdminDashboard from "./Components/SuperAdmin/AdDashbaord/AdDashboard";
import SuperAdminNotifications from "./Components/SuperAdmin/AdNotifications/AdNotifications";
import SuperAdminRegistrations from "./Components/SuperAdmin/AdRegistrations/AdRegistrations";
import SuperAdminReports from "./Components/SuperAdmin/AdReports/AdReports";
import SuperAdminSettings from "./Components/SuperAdmin/AdSettings/AdSettings";
import SuperAdminUploadLessonsPlans from "./Components/SuperAdmin/AdUploadLessonsPlans/AdUploadLessonsPlans";
import SuperAdminCourses from "./Components/SuperAdmin/AdCourses/AdCourses";

import CoordinatorLayout from "./Layout/CoordinatorLayout";
import CoordinatorDashboard from "./Components/Coordinator/CoDashbaord/CoDashboard";
import CoordinatorAttendance from "./Components/Coordinator/CoAttendance/CoAttendance.jsx";
import CoordinatorCategory from './Components/Coordinator/CoCategory/CoCategory.jsx'
import CoordinatorManageStudents from "./Components/Coordinator/CoManageStudents/CoManageStudents";
import CoordinatorManageTeachers from "./Components/Coordinator/CoManageTeachers/CoManageTeachers";
import CoordinatorNotifications from "./Components/Coordinator/CoNotifications/CoNotifications";
import CoordinatorRegistrations from "./Components/Coordinator/CoRegistrations/CoRegistrations";
import CoordinatorReports from "./Components/Coordinator/CoReports/CoReports";
import CoordinatorSettings from "./Components/Coordinator/CoSettings/CoSettings";
import CoordinatorUploadLessonsPlans from "./Components/Coordinator/CoUploadLessonsPlans/CoUploadLessonsPlans";
import CoordinatorCourses from "./Components/Coordinator/CoCourses/CoCourses";

import TeacherLayout from "./Layout/TeacherLayout";
import TeacherDashboard from "./Components/Teacher/TaDashbaord/TaDashboard";
import TeacherCategory from "./Components/Teacher/TaCategory/TaCategory.jsx";
import TeacherManageStudents from "./Components/Teacher/TaManageStudents/TaManageStudents";
import TeacherNotifications from "./Components/Teacher/TaNotifications/TaNotifications";
import TeacherRegistrations from "./Components/Teacher/TaRegistrations/TaRegistrations";
import TeacherReports from "./Components/Teacher/TaReports/TaReports";
import TeacherSettings from "./Components/Teacher/TaSettings/TaSettings";
import TeacherUploadLessonsPlans from "./Components/Teacher/TaUploadLessonsPlans/TaUploadLessonsPlans";
import TeacherCourses from "./Components/Teacher/TaCourses/TaCourses.jsx";
import TeacherAttendance from "./Components/Teacher/TaAttendance/TaAttendance.jsx";


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
