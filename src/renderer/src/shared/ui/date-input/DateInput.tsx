import { cn } from '../../lib/cn'

interface DateInputProps {
  value: string
  placeholder?: string
  disabled?: boolean
  className?: string
  onChange: (value: string) => void
  onBlur?: () => void
}

export function DateInput({ value, disabled, className, onChange, onBlur }: DateInputProps) {
  return (
    <input
      type="date"
      lang="ru-RU"
      value={value || ''}
      disabled={disabled}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        'h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none transition-colors',
        'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    />
  )
}
