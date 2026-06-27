import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { defaultThemeSettings } from '../../shared/theme/theme.constants'
import { AuthProvider } from './AuthProvider'

interface AppProvidersProps {
    children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
    const queryClient = useMemo(() => new QueryClient(), [])

    useEffect(() => {
        document.documentElement.dataset.theme = defaultThemeSettings.themeMode
        document.documentElement.dataset.accent = defaultThemeSettings.accentColor
    }, [])

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>{children}</AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    )
}