import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from '../../layouts/MainLayout'
import { AcademicProcessPage } from '../../pages/academic-process/AcademicProcessPage'
import { AdministrationPage } from '../../pages/administration/AdministrationPage'
import { AuditLogPage } from '../../pages/audit-log/AuditLogPage'
import { AdminDashboardPage } from '../../pages/dashboard/AdminDashboardPage'
import { FilterEmployeesPage } from '../../pages/filters/FilterEmployeesPage'
import { FilterStudentsPage } from '../../pages/filters/FilterStudentsPage'
import { FilterTeachersPage } from '../../pages/filters/FilterTeachersPage'
import { LearningJournalPage } from '../../pages/learning-journal/LearningJournalPage'
import { LoginPage } from '../../pages/login/LoginPage'
import { PeoplePage } from '../../pages/people/PeoplePage'
import { StudentDetailsPage } from '../../pages/people/StudentDetailsPage'
import { ReportsPage } from '../../pages/reports/ReportsPage'
import { SchedulePage } from '../../pages/schedule/SchedulePage'
import { SettingsPage } from '../../pages/settings/SettingsPage'
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
          <Route path="/filters" element={<Navigate to="/filters/students" replace />} />
          <Route path="/filters/students" element={<FilterStudentsPage />} />
          <Route path="/filters/teachers" element={<FilterTeachersPage />} />
          <Route path="/filters/employees" element={<FilterEmployeesPage />} />
          <Route path="/academic-process" element={<AcademicProcessPage />} />
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
