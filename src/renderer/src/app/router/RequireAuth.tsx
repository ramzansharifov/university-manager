import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export function RequireAuth() {
    const auth = useAuth()
    const location = useLocation()

    if (auth.status === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] text-[var(--color-text)]">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
                    <p className="text-sm font-medium">Загрузка приложения…</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Проверяем активную сессию пользователя.
                    </p>
                </div>
            </div>
        )
    }

    if (!auth.isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return <Outlet />
}