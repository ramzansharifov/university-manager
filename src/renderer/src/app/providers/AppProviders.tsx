import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
import { defaultThemeSettings } from '../../shared/theme/theme.constants'

interface AppProvidersProps {
    children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
    const queryClient = useMemo(() => new QueryClient(), [])

    useEffect(() => {
        document.documentElement.dataset.theme = defaultThemeSettings.themeMode
        document.documentElement.dataset.accent = defaultThemeSettings.accentColor
    }, [])

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
