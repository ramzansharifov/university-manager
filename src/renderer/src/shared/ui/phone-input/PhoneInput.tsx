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
  placeholder = 'Номер телефона',
  disabled,
  className,
  onChange,
  onBlur
}: PhoneInputProps) {
  function handleChange(rawValue: string) {
    onChange(formatPhoneValue(rawValue))
  }

  return (
    <input
      type="tel"
      inputMode="tel"
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onBlur={onBlur}
      onChange={(event) => handleChange(event.target.value)}
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

function formatPhoneValue(value: string): string {
  const trimmedValue = value.trim()
  const hasPlus = trimmedValue.startsWith('+')
  const digits = trimmedValue.replace(/\D/g, '').slice(0, 15)

  if (!digits) {
    return ''
  }

  const formattedDigits = formatPhoneDigits(digits)

  return hasPlus ? `+${formattedDigits}` : formattedDigits
}

function formatPhoneDigits(digits: string): string {
  if (digits.length <= 3) {
    return digits
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`
  }

  if (digits.length <= 8) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  if (digits.length <= 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`
  }

  if (digits.length === 11) {
    return `${digits.slice(0, 1)} ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`
  }

  return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}${digits.length > 12 ? `-${digits.slice(12)}` : ''}`
}
