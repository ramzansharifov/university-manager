import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { ComponentPropsWithoutRef, ComponentRef, HTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'
import { FiX } from 'react-icons/fi'
import { cn } from '../../lib/cn'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close

const DialogPortal = DialogPrimitive.Portal

const DialogOverlay = forwardRef<
    ComponentRef<typeof DialogPrimitive.Overlay>,
    ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            'fixed inset-0 z-50 bg-black/45 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            className
        )}
        {...props}
    />
))

DialogOverlay.displayName = 'DialogOverlay'

const DialogContent = forwardRef<
    ComponentRef<typeof DialogPrimitive.Content>,
    ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <DialogPortal>
        <DialogOverlay />

        <DialogPrimitive.Content
            ref={ref}
            className={cn(
                'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl outline-none',
                className
            )}
            {...props}
        >
            {children}

            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]">
                <FiX className="h-5 w-5" />
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </DialogPortal>
))

DialogContent.displayName = 'DialogContent'

interface DialogBlockProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
}

function DialogHeader({ className, children, ...props }: DialogBlockProps) {
    return (
        <div className={cn('pr-8', className)} {...props}>
            {children}
        </div>
    )
}

function DialogFooter({ className, children, ...props }: DialogBlockProps) {
    return (
        <div className={cn('mt-6 flex justify-end gap-3', className)} {...props}>
            {children}
        </div>
    )
}

const DialogTitle = forwardRef<
    ComponentRef<typeof DialogPrimitive.Title>,
    ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn('text-lg font-semibold text-[var(--color-text)]', className)}
        {...props}
    />
))

DialogTitle.displayName = 'DialogTitle'

const DialogDescription = forwardRef<
    ComponentRef<typeof DialogPrimitive.Description>,
    ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn('mt-2 text-sm text-[var(--color-text-muted)]', className)}
        {...props}
    />
))

DialogDescription.displayName = 'DialogDescription'

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
}