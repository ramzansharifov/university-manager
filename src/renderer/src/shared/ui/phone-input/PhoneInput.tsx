import { IMaskInput } from 'react-imask'
import { cn } from '../../lib/cn'

interface PhoneInputProps {
    value: string
    placeholder?: string
    disabled?: boolean
    className?: string
    onChange: (value: string) => void
    onBlur?: () => void
}

export function PhoneInput({
    value,
    placeholder = '+7 (___) ___-__-__',
    disabled,
    className,
    onChange,
    onBlur
}: PhoneInputProps) {
    return (
        <IMaskInput
            mask="+7 (000) 000-00-00"
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            onAccept={(nextValue) => onChange(String(nextValue))}
            onBlur={onBlur}
            className={cn(
                'h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none transition-colors',
                'placeholder:text-[var(--color-text-muted)]',
                'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
                'disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
        />
    )
}