import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface SidebarProps extends HTMLAttributes<HTMLElement> {
    children: ReactNode
}

interface SidebarItemButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: ReactNode
    active?: boolean
    children: ReactNode
}

export function Sidebar({ className, children, ...props }: SidebarProps) {
    return (
        <aside
            className={cn(
                'flex h-screen w-72 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]',
                className
            )}
            {...props}
        >
            {children}
        </aside>
    )
}

export function SidebarHeader({ className, children, ...props }: SidebarProps) {
    return (
        <div className={cn('border-b border-[var(--color-border)] p-5', className)} {...props}>
            {children}
        </div>
    )
}

export function SidebarContent({ className, children, ...props }: SidebarProps) {
    return (
        <div className={cn('flex-1 overflow-y-auto p-3', className)} {...props}>
            {children}
        </div>
    )
}

export function SidebarFooter({ className, children, ...props }: SidebarProps) {
    return (
        <div className={cn('border-t border-[var(--color-border)] p-3', className)} {...props}>
            {children}
        </div>
    )
}

export function SidebarSection({ className, children, ...props }: SidebarProps) {
    return (
        <div className={cn('mb-4', className)} {...props}>
            {children}
        </div>
    )
}

export function SidebarSectionTitle({ className, children, ...props }: SidebarProps) {
    return (
        <p
            className={cn(
                'mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]',
                className
            )}
            {...props}
        >
            {children}
        </p>
    )
}

export function SidebarItemButton({
    icon,
    active = false,
    className,
    children,
    type = 'button',
    ...props
}: SidebarItemButtonProps) {
    return (
        <button
            type={type}
            className={cn(
                'flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors',
                active
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]',
                className
            )}
            {...props}
        >
            {icon ? <span className="flex h-5 w-5 items-center justify-center">{icon}</span> : null}
            <span className="truncate">{children}</span>
        </button>
    )
}