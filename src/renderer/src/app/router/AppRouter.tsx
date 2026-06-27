import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from '../../layouts/MainLayout'
import { AdminDashboardPage } from '../../pages/dashboard/AdminDashboardPage'
import { LoginPage } from '../../pages/login/LoginPage'
import { RequireAuth } from './RequireAuth'

export function AppRouter() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<RequireAuth />}>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<AdminDashboardPage />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}