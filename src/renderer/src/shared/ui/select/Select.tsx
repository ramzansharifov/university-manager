import * as SelectPrimitive from '@radix-ui/react-select'
import type { ComponentPropsWithoutRef, ComponentRef } from 'react'
import { forwardRef } from 'react'
import { FiCheck, FiChevronDown } from 'react-icons/fi'
import { cn } from '../../lib/cn'

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = forwardRef<
    ComponentRef<typeof SelectPrimitive.Trigger>,
    ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none transition-colors',
            'placeholder:text-[var(--color-text-muted)]',
            'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
        )}
        {...props}
    >
        {children}

        <SelectPrimitive.Icon asChild>
            <FiChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
        </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
))

SelectTrigger.displayName = 'SelectTrigger'

const SelectContent = forwardRef<
    ComponentRef<typeof SelectPrimitive.Content>,
    ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
    <SelectPrimitive.Portal>
        <SelectPrimitive.Content
            ref={ref}
            data-university-manager-select-content=""
            position={position}
            className={cn(
                'z-[70] max-h-72 min-w-[8rem] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-xl',
                'data-[state=open]:animate-in data-[state=closed]:animate-out',
                position === 'popper' &&
                'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
                className
            )}
            {...props}
        >
            <SelectPrimitive.Viewport
                className={cn('p-1', position === 'popper' && 'w-full min-w-[var(--radix-select-trigger-width)]')}
            >
                {children}
            </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
))

SelectContent.displayName = 'SelectContent'

const SelectItem = forwardRef<
    ComponentRef<typeof SelectPrimitive.Item>,
    ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
        ref={ref}
        className={cn(
            'relative flex h-9 cursor-pointer select-none items-center rounded-lg px-8 text-sm outline-none transition-colors',
            'focus:bg-[var(--color-surface-muted)]',
            'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            className
        )}
        {...props}
    >
        <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
            <SelectPrimitive.ItemIndicator>
                <FiCheck className="h-4 w-4" />
            </SelectPrimitive.ItemIndicator>
        </span>

        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
))

SelectItem.displayName = 'SelectItem'

export { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue }