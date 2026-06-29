import type { FormEvent, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { FiArchive, FiEdit2, FiPlus, FiRefreshCcw, FiSearch, FiTrash2 } from 'react-icons/fi'
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
    meta?: Record<string, string | number | boolean | null>
}

export interface AdminCrudFieldConfig {
    key: string
    label: string
    placeholder?: string
    required?: boolean
    type?: 'text' | 'number' | 'email' | 'phone' | 'date' | 'time' | 'textarea' | 'select' | 'multiText' | 'checkbox'
    valueType?: 'string' | 'number'
    options?: AdminCrudSelectOption[]
    disabled?: boolean
    fullWidth?: boolean
    dependsOn?: string
    dependencyPlaceholder?: string
    virtual?: boolean
    autoFillTimeEnd?: {
        startKey: string
        durationKey: string
        enabledKey: string
    }
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

    const watchedFormValues = form.watch()

    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const filtersKey = JSON.stringify(filters ?? {})

    useEffect(() => {
        form.reset(emptyFormData)
    }, [emptyFormData, form])

    useEffect(() => {
        fields.forEach((field) => {
            if (!field.autoFillTimeEnd) {
                return
            }

            const enabledValue = watchedFormValues[field.autoFillTimeEnd.enabledKey]

            if (enabledValue !== 'true') {
                return
            }

            const startValue = watchedFormValues[field.autoFillTimeEnd.startKey]
            const durationValue = watchedFormValues[field.autoFillTimeEnd.durationKey]

            const nextEndTime = addMinutesToTime(startValue, durationValue)

            if (!nextEndTime) {
                return
            }

            if (watchedFormValues[field.key] !== nextEndTime) {
                form.setValue(field.key, nextEndTime, {
                    shouldDirty: true,
                    shouldValidate: true
                })
            }
        })
    }, [fields, form, watchedFormValues])

    useEffect(() => {
        fields.forEach((field) => {
            if (field.type !== 'select' || !field.dependsOn) {
                return
            }

            const currentValue = watchedFormValues[field.key]

            if (!currentValue) {
                return
            }

            const availableOptions = getAvailableSelectOptions(field, watchedFormValues)
            const hasCurrentValue = availableOptions.some((option) => option.value === currentValue)

            if (!hasCurrentValue) {
                form.setValue(field.key, '')
            }
        })
    }, [fields, form, watchedFormValues])

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
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        title="Редактировать"
                                                        aria-label="Редактировать запись"
                                                        onClick={() => openEditDialog(record)}
                                                    >
                                                        <FiEdit2 />
                                                    </Button>
                                                ) : null}

                                                {canArchive ? (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        title="Архивировать"
                                                        aria-label="Архивировать запись"
                                                        onClick={() => requestArchive(record)}
                                                    >
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
                                                    formValues={watchedFormValues}
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
    formValues,
    onChange,
    onBlur
}: {
    field: AdminCrudFieldConfig
    value: string
    formValues: Record<string, string>
    onChange: (value: string) => void
    onBlur: () => void
}) {
    if (field.type === 'checkbox') {
        return (
            <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]">
                <input
                    type="checkbox"
                    checked={value === 'true'}
                    disabled={field.disabled}
                    onBlur={onBlur}
                    onChange={(event) => onChange(event.target.checked ? 'true' : 'false')}
                />
                <span>{field.placeholder ?? field.label}</span>
            </label>
        )
    }

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

    if (field.type === 'multiText') {
        return (
            <MultiTextInput
                value={value}
                placeholder={field.placeholder}
                disabled={field.disabled}
                onChange={onChange}
                onBlur={onBlur}
            />
        )
    }

    if (field.type === 'select') {
        const availableOptions = getAvailableSelectOptions(field, formValues)
        const dependencyValue = field.dependsOn ? formValues[field.dependsOn] : null
        const isDisabledByDependency = Boolean(field.dependsOn && !dependencyValue)

        return (
            <Select
                value={value || undefined}
                disabled={field.disabled || isDisabledByDependency || availableOptions.length === 0}
                onValueChange={onChange}
            >
                <SelectTrigger>
                    <SelectValue
                        placeholder={
                            isDisabledByDependency
                                ? field.dependencyPlaceholder ?? 'Сначала выбери связанное поле'
                                : field.placeholder ?? 'Выбери значение'
                        }
                    />
                </SelectTrigger>

                <SelectContent>
                    {availableOptions.map((option) => (
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
            type={
                field.type === 'email'
                    ? 'email'
                    : field.type === 'number'
                        ? 'number'
                        : field.type === 'time'
                            ? 'time'
                            : 'text'
            }
            value={value}
            placeholder={field.placeholder}
            disabled={field.disabled}
            onBlur={onBlur}
            onChange={(event) => onChange(event.target.value)}
        />
    )
}

function MultiTextInput({
    value,
    placeholder,
    disabled,
    onChange,
    onBlur
}: {
    value: string
    placeholder?: string
    disabled?: boolean
    onChange: (value: string) => void
    onBlur: () => void
}) {
    const items = value ? value.split('\n') : ['']

    function updateItem(index: number, nextValue: string) {
        const nextItems = [...items]
        nextItems[index] = nextValue
        onChange(normalizeMultiTextValue(nextItems))
    }

    function addItem() {
        onChange([...items, ''].join('\n'))
    }

    function removeItem(index: number) {
        const nextItems = items.filter((_, itemIndex) => itemIndex !== index)
        onChange(normalizeMultiTextValue(nextItems.length > 0 ? nextItems : ['']))
    }

    return (
        <div className="grid gap-2">
            {items.map((item, index) => (
                <div key={index} className="flex gap-2">
                    <Input
                        value={item}
                        placeholder={index === 0 ? placeholder : 'Дополнительная форма контроля'}
                        disabled={disabled}
                        onBlur={onBlur}
                        onChange={(event) => updateItem(index, event.target.value)}
                    />

                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        title="Удалить форму контроля"
                        aria-label="Удалить форму контроля"
                        disabled={disabled || items.length === 1}
                        onClick={() => removeItem(index)}
                    >
                        <FiTrash2 />
                    </Button>
                </div>
            ))}

            <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={addItem}>
                <FiPlus />
                Добавить форму контроля
            </Button>
        </div>
    )
}

function normalizeMultiTextValue(items: string[]): string {
    return items.map((item) => item.trim()).filter(Boolean).join('\n')
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

function getAvailableSelectOptions(
    field: AdminCrudFieldConfig,
    formValues: Record<string, string>
): AdminCrudSelectOption[] {
    const options = field.options ?? []

    if (!field.dependsOn) {
        return options
    }

    const dependencyValue = formValues[field.dependsOn]

    if (!dependencyValue) {
        return []
    }

    return options.filter((option) => {
        const optionDependencyValue = option.meta?.[field.dependsOn as string]

        return String(optionDependencyValue ?? '') === String(dependencyValue)
    })
}

function addMinutesToTime(startValue: string, durationValue: string): string | null {
    const startMinutes = parseTimeToMinutes(startValue)
    const durationMinutes = Number(durationValue)

    if (startMinutes === null || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        return null
    }

    const totalMinutes = startMinutes + durationMinutes
    const hours = Math.floor(totalMinutes / 60) % 24
    const minutes = totalMinutes % 60

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function parseTimeToMinutes(value: string): number | null {
    const match = value.trim().match(/^(\d{1,2}):(\d{2})$/)

    if (!match) {
        return null
    }

    const hours = Number(match[1])
    const minutes = Number(match[2])

    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 23 || minutes > 59) {
        return null
    }

    return hours * 60 + minutes
}

function buildPayload(
    fields: AdminCrudFieldConfig[],
    formData: Record<string, string>
): AdminCrudRecord {
    return fields.reduce<AdminCrudRecord>((result, field) => {
        if (field.virtual) {
            return result
        }

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