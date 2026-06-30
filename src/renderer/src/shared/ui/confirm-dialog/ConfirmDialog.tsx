import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import type { ReactNode } from 'react'
import { FiAlertTriangle } from 'react-icons/fi'
import { cn } from '../../lib/cn'
import { Button } from '../button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  isLoading?: boolean
  children?: ReactNode
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  danger = false,
  isLoading = false,
  children,
  onOpenChange,
  onConfirm
}: ConfirmDialogProps) {
  async function handleConfirm() {
    await onConfirm()
  }

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/45 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out'
          )}
        />

        <AlertDialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl outline-none'
          )}
        >
          <div className="flex gap-4">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                danger
                  ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
                  : 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
              )}
            >
              <FiAlertTriangle className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <AlertDialogPrimitive.Title className="text-lg font-semibold text-[var(--color-text)]">
                {title}
              </AlertDialogPrimitive.Title>

              <AlertDialogPrimitive.Description className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                {description}
              </AlertDialogPrimitive.Description>

              {children ? <div className="mt-4">{children}</div> : null}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <AlertDialogPrimitive.Cancel asChild>
              <Button type="button" variant="secondary" disabled={isLoading}>
                {cancelText}
              </Button>
            </AlertDialogPrimitive.Cancel>

            <AlertDialogPrimitive.Action asChild>
              <Button
                type="button"
                variant={danger ? 'danger' : 'primary'}
                disabled={isLoading}
                onClick={() => void handleConfirm()}
              >
                {isLoading ? 'Выполняется...' : confirmText}
              </Button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}
