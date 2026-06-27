import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'muted'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant
    children: ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
    success: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
    danger: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
    muted: 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium',
                variantClasses[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    )
}