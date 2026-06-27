import type { ReactNode } from 'react'
import { cn } from '../shared/lib/cn'

interface AppLayoutProps {
    sidebar: ReactNode
    header?: ReactNode
    children: ReactNode
    className?: string
}

export function AppLayout({ sidebar, header, children, className }: AppLayoutProps) {
    return (
        <div className="flex min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
            {sidebar}

            <div className="flex min-w-0 flex-1 flex-col">
                {header ? (
                    <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6">
                        {header}
                    </header>
                ) : null}

                <main className={cn('flex-1 overflow-y-auto p-6', className)}>{children}</main>
            </div>
        </div>
    )
}