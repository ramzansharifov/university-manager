import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArchive, FiEdit2, FiPlus, FiRefreshCcw, FiSearch } from 'react-icons/fi'
import {
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Input
} from '../../../shared/ui'

type AdminCrudListResult = Awaited<ReturnType<Window['api']['adminCrud']['list']>>
type AdminCrudRecord = AdminCrudListResult['items'][number]
type AdminEntityKey = Parameters<Window['api']['adminCrud']['list']>[0]['entity']

export interface AdminCrudFieldConfig {
    key: string
    label: string
    placeholder?: string
    required?: boolean
    type?: 'text' | 'number'
}

export interface AdminCrudColumnConfig {
    key: string
    label: string
}

interface AdminCrudEntityPanelProps {
    entity: AdminEntityKey
    title: string
    description: string
    createButtonLabel: string
    fields: AdminCrudFieldConfig[]
    columns: AdminCrudColumnConfig[]
}

type DialogMode = 'create' | 'edit'

const pageSize = 20

export function AdminCrudEntityPanel({
    entity,
    title,
    description,
    createButtonLabel,
    fields,
    columns
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
    const [formData, setFormData] = useState<Record<string, string>>({})

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    const emptyFormData = useMemo(() => {
        return fields.reduce<Record<string, string>>((result, field) => {
            result[field.key] = ''
            return result
        }, {})
    }, [fields])

    const loadItems = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await window.api.adminCrud.list({
                entity,
                page,
                pageSize,
                search: search || undefined,
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
    }, [entity, page, search])

    useEffect(() => {
        void loadItems()
    }, [loadItems])

    function openCreateDialog() {
        setDialogMode('create')
        setSelectedRecord(null)
        setFormData(emptyFormData)
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

        setFormData(nextFormData)
        setDialogOpen(true)
    }

    function handleDialogOpenChange(open: boolean) {
        setDialogOpen(open)

        if (!open) {
            setDialogMode('create')
            setSelectedRecord(null)
            setFormData(emptyFormData)
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

    function updateFieldValue(fieldKey: string, value: string) {
        setFormData((current) => ({
            ...current,
            [fieldKey]: value
        }))
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        setIsSubmitting(true)
        setError(null)

        try {
            const payload = buildPayload(fields, formData)

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
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Не удалось сохранить запись')
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleArchive(record: AdminCrudRecord) {
        const recordName = getRecordName(record)

        const confirmed = window.confirm(
            `Архивировать запись "${recordName}"? Она исчезнет из основного списка.`
        )

        if (!confirmed) {
            return
        }

        setError(null)

        try {
            await window.api.adminCrud.archive({
                entity,
                id: Number(record.id)
            })

            await loadItems()
        } catch (archiveError) {
            setError(archiveError instanceof Error ? archiveError.message : 'Не удалось архивировать')
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

                    <Button onClick={openCreateDialog}>
                        <FiPlus />
                        {createButtonLabel}
                    </Button>
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

                                    <th className="w-48 border-b border-[var(--color-border)] px-4 py-3 text-right font-semibold text-[var(--color-text-muted)]">
                                        Действия
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {items.map((record) => (
                                    <tr
                                        key={String(record.id)}
                                        className="border-b border-[var(--color-border)] last:border-b-0"
                                    >
                                        {columns.map((column) => (
                                            <td key={column.key} className="px-4 py-3 text-[var(--color-text)]">
                                                {formatValue(record[column.key])}
                                            </td>
                                        ))}

                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="secondary" onClick={() => openEditDialog(record)}>
                                                    <FiEdit2 />
                                                    Изм.
                                                </Button>

                                                <Button size="sm" variant="ghost" onClick={() => void handleArchive(record)}>
                                                    <FiArchive />
                                                </Button>
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
                                            Записей пока нет.
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {dialogMode === 'create' ? createButtonLabel : 'Редактировать запись'}
                        </DialogTitle>
                        <DialogDescription>
                            Заполни поля формы. После сохранения данные будут записаны в SQLite через backend
                            admin CRUD.
                        </DialogDescription>
                    </DialogHeader>

                    <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
                        {fields.map((field) => (
                            <label key={field.key} className="grid gap-2">
                                <span className="text-sm font-medium text-[var(--color-text)]">
                                    {field.label}
                                    {field.required ? <span className="text-[var(--color-danger)]"> *</span> : null}
                                </span>

                                <Input
                                    type={field.type ?? 'text'}
                                    value={formData[field.key] ?? ''}
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    onChange={(event) => updateFieldValue(field.key, event.target.value)}
                                />
                            </label>
                        ))}

                        <DialogFooter>
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
        </Card>
    )
}

function buildPayload(
    fields: AdminCrudFieldConfig[],
    formData: Record<string, string>
): AdminCrudRecord {
    return fields.reduce<AdminCrudRecord>((result, field) => {
        const rawValue = formData[field.key] ?? ''
        const trimmedValue = rawValue.trim()

        if (field.type === 'number') {
            result[field.key] = trimmedValue ? Number(trimmedValue) : null
            return result
        }

        result[field.key] = trimmedValue

        return result
    }, {})
}

function formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
        return '—'
    }

    return String(value)
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