import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from '../../layouts/MainLayout'
import { AcademicProcessPage } from '../../pages/academic-process/AcademicProcessPage'
import { AdministrationPage } from '../../pages/administration/AdministrationPage'
import { AuditLogPage } from '../../pages/audit-log/AuditLogPage'
import { AdminDashboardPage } from '../../pages/dashboard/AdminDashboardPage'
import { FiltersPage } from '../../pages/filters/FiltersPage'
import { LearningJournalPage } from '../../pages/learning-journal/LearningJournalPage'
import { RoomsAndLessonsPage } from '../../pages/rooms-and-lessons/RoomsAndLessonsPage'
import { LoginPage } from '../../pages/login/LoginPage'
import { PeoplePage } from '../../pages/people/PeoplePage'
import { EmployeeDetailsPage } from '../../pages/people/EmployeeDetailsPage'
import { StudentDetailsPage } from '../../pages/people/StudentDetailsPage'
import { TeacherDetailsPage } from '../../pages/people/TeacherDetailsPage'
import { ReportsPage } from '../../pages/reports/ReportsPage'
import { SchedulePage } from '../../pages/schedule/SchedulePage'
import { SettingsPage } from '../../pages/settings/SettingsPage'
import { StudentPortalPage } from '../../pages/student-portal/StudentPortalPage'
import { UniversityPage } from '../../pages/university/UniversityPage'
import { RequireAuth } from './RequireAuth'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<AdminDashboardPage />} />
          <Route path="/university" element={<UniversityPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/people/students/:studentId" element={<StudentDetailsPage />} />
          <Route path="/people/teachers/:teacherId" element={<TeacherDetailsPage />} />
          <Route path="/people/employees/:employeeId" element={<EmployeeDetailsPage />} />
          <Route path="/student" element={<Navigate to="/student/schedule" replace />} />
          <Route path="/student/schedule" element={<StudentPortalPage section="schedule" />} />
          <Route path="/student/curriculum" element={<StudentPortalPage section="curriculum" />} />
          <Route path="/student/teachers" element={<StudentPortalPage section="teachers" />} />
          <Route path="/student/group" element={<StudentPortalPage section="group" />} />
          <Route path="/student/journal" element={<StudentPortalPage section="journal" />} />
          <Route
            path="/student/performance"
            element={<StudentPortalPage section="performance" />}
          />
          <Route path="/filters" element={<FiltersPage />} />
          <Route path="/filters/students" element={<Navigate to="/filters" replace />} />
          <Route path="/filters/teachers" element={<Navigate to="/filters" replace />} />
          <Route path="/filters/employees" element={<Navigate to="/filters" replace />} />
          <Route path="/academic-process" element={<AcademicProcessPage />} />
          <Route path="/rooms-and-lessons" element={<RoomsAndLessonsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/learning-journal" element={<LearningJournalPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/administration" element={<AdministrationPage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
