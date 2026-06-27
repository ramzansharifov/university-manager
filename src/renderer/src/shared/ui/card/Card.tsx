import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
}

export function Card({ className, children, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm',
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export function CardHeader({ className, children, ...props }: CardProps) {
    return (
        <div className={cn('border-b border-[var(--color-border)] p-5', className)} {...props}>
            {children}
        </div>
    )
}

export function CardTitle({ className, children, ...props }: CardProps) {
    return (
        <h2 className={cn('text-lg font-semibold text-[var(--color-text)]', className)} {...props}>
            {children}
        </h2>
    )
}

export function CardDescription({ className, children, ...props }: CardProps) {
    return (
        <p className={cn('mt-1 text-sm text-[var(--color-text-muted)]', className)} {...props}>
            {children}
        </p>
    )
}

export function CardContent({ className, children, ...props }: CardProps) {
    return (
        <div className={cn('p-5', className)} {...props}>
            {children}
        </div>
    )
}

export function CardFooter({ className, children, ...props }: CardProps) {
    return (
        <div className={cn('border-t border-[var(--color-border)] p-5', className)} {...props}>
            {children}
        </div>
    )
}