import type { FormEvent, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { FiArchive, FiEdit2, FiPlus, FiRefreshCcw, FiSearch } from 'react-icons/fi'
import {
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    ConfirmDialog,
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Input,
    DateInput,
    PhoneInput,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Textarea,
} from '../../../shared/ui'
import { cn } from '../../../shared/lib/cn'

type AdminCrudListResult = Awaited<ReturnType<Window['api']['adminCrud']['list']>>

export type AdminCrudRecord = AdminCrudListResult['items'][number]
export type AdminEntityKey = Parameters<Window['api']['adminCrud']['list']>[0]['entity']
type AdminCrudFilterValue = string | number | boolean | null
type AdminCrudFilterRecord = Record<string, AdminCrudFilterValue>

export interface AdminCrudSelectOption {
    value: string
    label: string
}

export interface AdminCrudFieldConfig {
    key: string
    label: string
    placeholder?: string
    required?: boolean
    type?: 'text' | 'number' | 'email' | 'phone' | 'date' | 'textarea' | 'select'
    valueType?: 'string' | 'number'
    options?: AdminCrudSelectOption[]
    disabled?: boolean
    fullWidth?: boolean
}

export interface AdminCrudColumnConfig {
    key: string
    label: string
    type?: 'text' | 'date'
    render?: (record: AdminCrudRecord) => ReactNode
}

interface AdminCrudEntityPanelProps {
    entity: AdminEntityKey
    title: string
    description: string
    createButtonLabel: string
    fields: AdminCrudFieldConfig[]
    columns: AdminCrudColumnConfig[]
    filters?: AdminCrudFilterRecord
    fixedData?: AdminCrudRecord
    emptyMessage?: string
    canCreate?: boolean
    canEdit?: boolean
    canArchive?: boolean
    onRowClick?: (record: AdminCrudRecord) => void
    extraRowActions?: (record: AdminCrudRecord) => ReactNode
    onAfterMutation?: () => void | Promise<void>
}
type DialogMode = 'create' | 'edit'

const pageSize = 20

export function AdminCrudEntityPanel({
    entity,
    title,
    description,
    createButtonLabel,
    fields,
    columns,
    filters,
    fixedData,
    emptyMessage = 'Записей пока нет.',
    canCreate = true,
    canEdit = true,
    canArchive = true,
    onRowClick,
    extraRowActions,
    onAfterMutation
}: AdminCrudEntityPanelProps) {
    const [items, setItems] = useState<AdminCrudRecord[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogMode, setDialogMode] = useState<DialogMode>('create')
    const [selectedRecord, setSelectedRecord] = useState<AdminCrudRecord | null>(null)
    const [archiveRecord, setArchiveRecord] = useState<AdminCrudRecord | null>(null)
    const emptyFormData = useMemo(() => {
        return fields.reduce<Record<string, string>>((result, field) => {
            result[field.key] = ''
            return result
        }, {})
    }, [fields])

    const formSchema = useMemo(() => createFormSchema(fields), [fields])

    const form = useForm<Record<string, string>>({
        resolver: zodResolver(formSchema) as Resolver<Record<string, string>>,
        defaultValues: emptyFormData
    })

    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const filtersKey = JSON.stringify(filters ?? {})

    useEffect(() => {
        form.reset(emptyFormData)
    }, [emptyFormData, form])

    const loadItems = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await window.api.adminCrud.list({
                entity,
                page,
                pageSize,
                search: search || undefined,
                filters,
                orderBy: 'id',
                orderDirection: 'desc'
            })

            setItems(result.items)
            setTotal(result.total)
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить данные')
        } finally {
            setIsLoading(false)
        }
    }, [entity, page, search, filtersKey])

    useEffect(() => {
        setPage(1)
    }, [entity, filtersKey])

    useEffect(() => {
        void loadItems()
    }, [loadItems])

    function openCreateDialog() {
        setDialogMode('create')
        setSelectedRecord(null)
        form.reset(emptyFormData)
        setDialogOpen(true)
    }

    function openEditDialog(record: AdminCrudRecord) {
        setDialogMode('edit')
        setSelectedRecord(record)

        const nextFormData = fields.reduce<Record<string, string>>((result, field) => {
            const value = record[field.key]
            result[field.key] = value === null || value === undefined ? '' : String(value)
            return result
        }, {})

        form.reset(nextFormData)
        setDialogOpen(true)
    }

    function handleDialogOpenChange(open: boolean) {
        setDialogOpen(open)

        if (!open) {
            setDialogMode('create')
            setSelectedRecord(null)
            form.reset(emptyFormData)
            setIsSubmitting(false)
        }
    }

    function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setPage(1)
        setSearch(searchInput.trim())
    }

    function handleResetSearch() {
        setSearchInput('')
        setSearch('')
        setPage(1)
    }

    async function handleFormSubmit(formValues: Record<string, string>) {
        setIsSubmitting(true)
        setError(null)

        try {
            const payload = {
                ...buildPayload(fields, formValues),
                ...(fixedData ?? {})
            }

            if (dialogMode === 'create') {
                await window.api.adminCrud.create({
                    entity,
                    data: payload
                })
            } else {
                if (!selectedRecord?.id) {
                    throw new Error('Запись для редактирования не выбрана')
                }

                await window.api.adminCrud.update({
                    entity,
                    id: Number(selectedRecord.id),
                    data: payload
                })
            }

            setDialogOpen(false)
            await loadItems()
            await onAfterMutation?.()
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Не удалось сохранить запись')
        } finally {
            setIsSubmitting(false)
        }
    }

    function requestArchive(record: AdminCrudRecord) {
        setArchiveRecord(record)
    }

    async function confirmArchive() {
        if (!archiveRecord?.id) {
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            await window.api.adminCrud.archive({
                entity,
                id: Number(archiveRecord.id)
            })

            setArchiveRecord(null)
            await loadItems()
            await onAfterMutation?.()
        } catch (archiveError) {
            setError(archiveError instanceof Error ? archiveError.message : 'Не удалось архивировать')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>

                    {canCreate ? (
                        <Button onClick={openCreateDialog}>
                            <FiPlus />
                            {createButtonLabel}
                        </Button>
                    ) : null}
                </div>
            </CardHeader>

            <CardContent>
                <div className="grid gap-4">
                    <form className="flex flex-col gap-3 md:flex-row" onSubmit={handleSearchSubmit}>
                        <div className="relative flex-1">
                            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                            <Input
                                className="pl-9"
                                value={searchInput}
                                placeholder="Поиск..."
                                onChange={(event) => setSearchInput(event.target.value)}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" variant="secondary">
                                Найти
                            </Button>

                            <Button type="button" variant="ghost" onClick={handleResetSearch}>
                                Сбросить
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => void loadItems()}
                                disabled={isLoading}
                            >
                                <FiRefreshCcw />
                            </Button>
                        </div>
                    </form>

                    {error ? (
                        <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
                            {error}
                        </div>
                    ) : null}

                    <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
                        <table className="w-full border-collapse text-sm">
                            <thead className="bg-[var(--color-surface-muted)]">
                                <tr>
                                    {columns.map((column) => (
                                        <th
                                            key={column.key}
                                            className="border-b border-[var(--color-border)] px-4 py-3 text-left font-semibold text-[var(--color-text-muted)]"
                                        >
                                            {column.label}
                                        </th>
                                    ))}

                                    <th className="w-56 border-b border-[var(--color-border)] px-4 py-3 text-right font-semibold text-[var(--color-text-muted)]">
                                        Действия
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {items.map((record) => (
                                    <tr
                                        key={String(record.id)}
                                        className={cn(
                                            'border-b border-[var(--color-border)] last:border-b-0',
                                            onRowClick ? 'cursor-pointer hover:bg-[var(--color-surface-muted)]' : ''
                                        )}
                                        onClick={() => onRowClick?.(record)}
                                    >
                                        {columns.map((column) => (
                                            <td key={column.key} className="px-4 py-3 text-[var(--color-text)]">
                                                {column.render ? column.render(record) : formatValue(record[column.key], column)}
                                            </td>
                                        ))}

                                        <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                                            <div className="flex justify-end gap-2">
                                                {extraRowActions?.(record)}

                                                {canEdit ? (
                                                    <Button size="sm" variant="secondary" onClick={() => openEditDialog(record)}>
                                                        <FiEdit2 />
                                                        Изм.
                                                    </Button>
                                                ) : null}

                                                {canArchive ? (
                                                    <Button size="sm" variant="ghost" onClick={() => requestArchive(record)}>
                                                        <FiArchive />
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {!isLoading && items.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={columns.length + 1}
                                            className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]"
                                        >
                                            {emptyMessage}
                                        </td>
                                    </tr>
                                ) : null}

                                {isLoading ? (
                                    <tr>
                                        <td
                                            colSpan={columns.length + 1}
                                            className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]"
                                        >
                                            Загрузка данных...
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <Badge variant="muted">Всего: {total}</Badge>
                            {search ? <Badge>Поиск: {search}</Badge> : null}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="secondary"
                                disabled={page <= 1 || isLoading}
                                onClick={() => setPage((current) => Math.max(1, current - 1))}
                            >
                                Назад
                            </Button>

                            <span className="text-sm text-[var(--color-text-muted)]">
                                {page} / {totalPages}
                            </span>

                            <Button
                                size="sm"
                                variant="secondary"
                                disabled={page >= totalPages || isLoading}
                                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                            >
                                Вперёд
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>

            <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogContent
                    className="flex max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] !max-w-5xl flex-col overflow-hidden p-0"
                    onPointerDownOutside={(event) => {
                        event.preventDefault()
                    }}
                    onInteractOutside={(event) => {
                        const target = event.target

                        if (
                            target instanceof HTMLElement &&
                            target.closest('[data-university-manager-select-content]')
                        ) {
                            event.preventDefault()
                        }
                    }}
                >
                    <DialogHeader className="border-b border-[var(--color-border)] px-6 py-5 pr-14">
                        <DialogTitle>
                            {dialogMode === 'create' ? createButtonLabel : 'Редактировать запись'}
                        </DialogTitle>
                        <DialogDescription>
                            Заполни поля формы. После сохранения данные будут записаны в SQLite через backend
                            admin CRUD.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        className="flex min-h-0 flex-1 flex-col"
                        onSubmit={(event) => void form.handleSubmit(handleFormSubmit)(event)}
                    >
                        <div className="grid min-h-0 grid-cols-1 gap-4 overflow-y-auto px-6 py-5 md:grid-cols-2 xl:grid-cols-3">
                            {fields.map((field) => {
                                const fieldError = form.formState.errors[field.key]?.message

                                return (
                                    <label key={field.key} className={getFieldWrapperClassName(field)}>
                                        <span className="text-sm font-medium text-[var(--color-text)]">
                                            {field.label}
                                            {field.required ? (
                                                <span className="text-[var(--color-danger)]"> *</span>
                                            ) : null}
                                        </span>

                                        <Controller
                                            name={field.key}
                                            control={form.control}
                                            render={({ field: controllerField }) => (
                                                <CrudFieldInput
                                                    field={field}
                                                    value={controllerField.value ?? ''}
                                                    onChange={controllerField.onChange}
                                                    onBlur={controllerField.onBlur}
                                                />
                                            )}
                                        />

                                        {fieldError ? (
                                            <span className="text-xs font-medium text-[var(--color-danger)]">
                                                {String(fieldError)}
                                            </span>
                                        ) : null}
                                    </label>
                                )
                            })}
                        </div>

                        <DialogFooter className="mt-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                    Отмена
                                </Button>
                            </DialogClose>

                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <ConfirmDialog
                open={Boolean(archiveRecord)}
                title="Архивировать запись?"
                description={`Запись "${archiveRecord ? getRecordName(archiveRecord) : ''}" будет скрыта из основного списка. Данные не будут удалены физически и останутся в базе.`}
                confirmText="Архивировать"
                cancelText="Отмена"
                danger
                isLoading={isSubmitting}
                onOpenChange={(open) => {
                    if (!open) {
                        setArchiveRecord(null)
                    }
                }}
                onConfirm={confirmArchive}
            />
        </Card>
    )
}

function getFieldWrapperClassName(field: AdminCrudFieldConfig): string {
    return cn(
        'grid gap-2',
        (field.fullWidth || field.type === 'textarea') && 'md:col-span-2 xl:col-span-3'
    )
}

function CrudFieldInput({
    field,
    value,
    onChange,
    onBlur
}: {
    field: AdminCrudFieldConfig
    value: string
    onChange: (value: string) => void
    onBlur: () => void
}) {
    if (field.type === 'textarea') {
        return (
            <Textarea
                value={value}
                placeholder={field.placeholder}
                disabled={field.disabled}
                onBlur={onBlur}
                onChange={(event) => onChange(event.target.value)}
            />
        )
    }

    if (field.type === 'phone') {
        return (
            <PhoneInput
                value={value}
                placeholder={field.placeholder}
                disabled={field.disabled}
                onBlur={onBlur}
                onChange={onChange}
            />
        )
    }

    if (field.type === 'date') {
        return (
            <DateInput
                value={value}
                placeholder={field.placeholder}
                disabled={field.disabled}
                onBlur={onBlur}
                onChange={onChange}
            />
        )
    }

    if (field.type === 'select') {
        return (
            <Select
                value={value || undefined}
                disabled={field.disabled || field.options?.length === 0}
                onValueChange={onChange}
            >
                <SelectTrigger>
                    <SelectValue placeholder={field.placeholder ?? 'Выбери значение'} />
                </SelectTrigger>

                <SelectContent>
                    {(field.options ?? []).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        )
    }

    return (
        <Input
            type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
            value={value}
            placeholder={field.placeholder}
            disabled={field.disabled}
            onBlur={onBlur}
            onChange={(event) => onChange(event.target.value)}
        />
    )
}

function createFormSchema(fields: AdminCrudFieldConfig[]) {
    const shape: Record<string, z.ZodType<string>> = {}

    for (const field of fields) {
        let schema: z.ZodType<string> = z.string()

        if (field.required) {
            schema = schema.refine((value) => value.trim().length > 0, {
                message: 'Поле обязательно'
            })
        }

        if (field.type === 'email') {
            schema = schema.refine(
                (value) => !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
                {
                    message: 'Некорректный email'
                }
            )
        }

        if (field.type === 'date') {
            schema = schema.refine((value) => !value.trim() || /^\d{4}-\d{2}-\d{2}$/.test(value), {
                message: 'Выбери дату'
            })
        }

        shape[field.key] = schema
    }

    return z.object(shape)
}

function buildPayload(
    fields: AdminCrudFieldConfig[],
    formData: Record<string, string>
): AdminCrudRecord {
    return fields.reduce<AdminCrudRecord>((result, field) => {
        const rawValue = formData[field.key] ?? ''
        const trimmedValue = rawValue.trim()

        if (field.type === 'number' || field.valueType === 'number') {
            result[field.key] = trimmedValue ? Number(trimmedValue) : null
            return result
        }

        result[field.key] = trimmedValue

        return result
    }, {})
}

function formatValue(value: unknown, column?: AdminCrudColumnConfig): string {
    if (value === null || value === undefined || value === '') {
        return '—'
    }

    if (column?.type === 'date') {
        return formatIsoDateToDisplay(String(value))
    }

    return String(value)
}

function formatIsoDateToDisplay(value: string): string {
    if (!value) {
        return '—'
    }

    const [year, month, day] = value.split('-')

    if (!year || !month || !day) {
        return value
    }

    return `${day}.${month}.${year}`
}

function getRecordName(record: AdminCrudRecord): string {
    if (record.name) {
        return String(record.name)
    }

    if (record.short_name) {
        return String(record.short_name)
    }

    return `#${String(record.id)}`
}