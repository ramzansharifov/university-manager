import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ className, error = false, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-lg border bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none transition-colors',
        'placeholder:text-[var(--color-text-muted)]',
        'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
        error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]',
        className
      )}
      {...props}
    />
  )
}
