import * as PopoverPrimitive from '@radix-ui/react-popover'
import { format, isValid, parse, parseISO } from 'date-fns'
import { useEffect, useState } from 'react'
import { FiCalendar } from 'react-icons/fi'
import { cn } from '../../lib/cn'
import { Button } from '../button'

interface DateInputProps {
    value: string
    placeholder?: string
    disabled?: boolean
    className?: string
    onChange: (value: string) => void
    onBlur?: () => void
}

export function DateInput({
    value,
    placeholder = 'дд.мм.гггг',
    disabled,
    className,
    onChange,
    onBlur
}: DateInputProps) {
    const [displayValue, setDisplayValue] = useState(formatIsoDateToDisplay(value))

    useEffect(() => {
        setDisplayValue(formatIsoDateToDisplay(value))
    }, [value])

    function handleTextChange(rawValue: string) {
        const nextDisplayValue = formatDateTypingValue(rawValue)

        setDisplayValue(nextDisplayValue)

        if (!nextDisplayValue) {
            onChange('')
            return
        }

        if (nextDisplayValue.length === 10) {
            const parsedDate = parse(nextDisplayValue, 'dd.MM.yyyy', new Date())

            if (isValid(parsedDate)) {
                onChange(format(parsedDate, 'yyyy-MM-dd'))
            }
        }
    }

    return (
        <div className={cn('flex gap-2', className)}>
            <input
                value={displayValue}
                disabled={disabled}
                placeholder={placeholder}
                onBlur={onBlur}
                onChange={(event) => handleTextChange(event.target.value)}
                className={cn(
                    'h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none transition-colors',
                    'placeholder:text-[var(--color-text-muted)]',
                    'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                )}
            />

            <PopoverPrimitive.Root>
                <PopoverPrimitive.Trigger asChild>
                    <Button type="button" variant="secondary" disabled={disabled} aria-label="Выбрать дату">
                        <FiCalendar />
                    </Button>
                </PopoverPrimitive.Trigger>

                <PopoverPrimitive.Portal>
                    <PopoverPrimitive.Content
                        align="end"
                        sideOffset={8}
                        className="z-50 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-xl"
                    >
                        <input
                            type="date"
                            value={value || ''}
                            onChange={(event) => onChange(event.target.value)}
                            className={cn(
                                'h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none',
                                'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'
                            )}
                        />
                    </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
            </PopoverPrimitive.Root>
        </div>
    )
}

function formatIsoDateToDisplay(value: string): string {
    if (!value) {
        return ''
    }

    const parsedDate = parseISO(value)

    if (!isValid(parsedDate)) {
        return value
    }

    return format(parsedDate, 'dd.MM.yyyy')
}

function formatDateTypingValue(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    const day = digits.slice(0, 2)
    const month = digits.slice(2, 4)
    const year = digits.slice(4, 8)

    return [day, month, year].filter(Boolean).join('.')
}