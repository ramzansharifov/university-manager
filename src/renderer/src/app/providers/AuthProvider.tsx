import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { AuthUser, LoginParams } from '../../../../shared/types/auth'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
    user: AuthUser | null
    token: string | null
    status: AuthStatus
    isAuthenticated: boolean
    login: (params: LoginParams) => Promise<void>
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
}

interface AuthProviderProps {
    children: ReactNode
}

const authTokenStorageKey = 'university-manager.auth-token'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(authTokenStorageKey))
    const [status, setStatus] = useState<AuthStatus>('loading')

    const refreshUser = useCallback(async () => {
        const storedToken = localStorage.getItem(authTokenStorageKey)

        if (!storedToken) {
            setUser(null)
            setToken(null)
            setStatus('unauthenticated')
            return
        }

        try {
            const currentUser = await window.api.auth.getCurrentUser({ token: storedToken })

            if (!currentUser) {
                localStorage.removeItem(authTokenStorageKey)
                setUser(null)
                setToken(null)
                setStatus('unauthenticated')
                return
            }

            setUser(currentUser)
            setToken(storedToken)
            setStatus('authenticated')
        } catch {
            localStorage.removeItem(authTokenStorageKey)
            setUser(null)
            setToken(null)
            setStatus('unauthenticated')
        }
    }, [])

    useEffect(() => {
        void refreshUser()
    }, [refreshUser])

    const login = useCallback(async (params: LoginParams) => {
        const result = await window.api.auth.login(params)

        localStorage.setItem(authTokenStorageKey, result.token)

        setToken(result.token)
        setUser(result.user)
        setStatus('authenticated')
    }, [])

    const logout = useCallback(async () => {
        const storedToken = localStorage.getItem(authTokenStorageKey)

        if (storedToken) {
            await window.api.auth.logout({ token: storedToken })
        }

        localStorage.removeItem(authTokenStorageKey)

        setToken(null)
        setUser(null)
        setStatus('unauthenticated')
    }, [])

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            token,
            status,
            isAuthenticated: status === 'authenticated' && Boolean(user),
            login,
            logout,
            refreshUser
        }),
        [login, logout, refreshUser, status, token, user]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider')
    }

    return context
}