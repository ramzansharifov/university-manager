import type { FormEvent } from 'react'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Input
} from '../../shared/ui'

export function LoginPage() {
    const auth = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const [username, setUsername] = useState('admin')
    const [password, setPassword] = useState('admin')
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const locationState = location.state as { from?: { pathname?: string } } | null
    const redirectTo = locationState?.from?.pathname ?? '/'

    if (auth.isAuthenticated) {
        return <Navigate to={redirectTo} replace />
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        setError(null)
        setIsSubmitting(true)

        try {
            await auth.login({
                username,
                password
            })

            navigate(redirectTo, { replace: true })
        } catch (loginError) {
            setError(loginError instanceof Error ? loginError.message : 'Не удалось войти в систему')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-6 text-[var(--color-text)]">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <p className="text-sm font-semibold text-[var(--color-primary)]">University Manager</p>
                    <CardTitle className="mt-3">Вход в систему</CardTitle>
                    <CardDescription>
                        Используй временный dev-доступ: логин <b>admin</b>, пароль <b>admin</b>.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form className="grid gap-4" onSubmit={handleSubmit}>
                        <label className="grid gap-2">
                            <span className="text-sm font-medium">Логин</span>
                            <Input
                                value={username}
                                autoComplete="username"
                                onChange={(event) => setUsername(event.target.value)}
                            />
                        </label>

                        <label className="grid gap-2">
                            <span className="text-sm font-medium">Пароль</span>
                            <Input
                                value={password}
                                type="password"
                                autoComplete="current-password"
                                onChange={(event) => setPassword(event.target.value)}
                            />
                        </label>

                        {error ? (
                            <div className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
                                {error}
                            </div>
                        ) : null}

                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Вход…' : 'Войти'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    )
}