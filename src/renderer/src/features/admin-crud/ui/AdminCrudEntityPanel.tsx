import type { FormEvent, ReactNode } from 'react'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
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
  Textarea
} from '../../../shared/ui'
import { cn } from '../../../shared/lib/cn'

type AdminCrudListResult = Awaited<ReturnType<Window['api']['adminCrud']['list']>>

export type AdminCrudRecord = AdminCrudListResult['items'][number]
export type AdminEntityKey = Parameters<Window['api']['adminCrud']['list']>[0]['entity']
type AdminCrudFilterValue = string | number | boolean | null
type AdminCrudFilterRecord = Record<string, AdminCrudFilterValue>
type AdminCrudOrderDirection = 'asc' | 'desc'

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
  type?:
    | 'text'
    | 'number'
    | 'email'
    | 'phone'
    | 'date'
    | 'time'
    | 'textarea'
    | 'select'
    | 'multiText'
    | 'checkbox'
    | 'toggle'
  valueType?: 'string' | 'number'
  options?: AdminCrudSelectOption[]
  disabled?: boolean
  fullWidth?: boolean
  dependsOn?: string
  dependencyPlaceholder?: string
  virtual?: boolean
  hidden?: boolean
  visibleWhen?: {
    fieldKey: string
    value: string
  }
  defaultValue?: string
  exclusiveGroup?: string
  persistKey?: string
  persistWhenCheckedKey?: string
  autoFillTargets?: Array<{
    targetKey: string
    metaKey: string
  }>
  autoFillTimeEnd?: {
    startKey: string
    durationKey: string
    enabledKey?: string
  }
}

export interface AdminCrudColumnConfig {
  key: string
  label: string
  type?: 'text' | 'date'
  render?: (record: AdminCrudRecord) => ReactNode
}

interface AdminCrudRenderItemsParams {
  items: AdminCrudRecord[]
  columns: AdminCrudColumnConfig[]
  isLoading: boolean
  emptyMessage: string
  canEdit: boolean
  canArchive: boolean
  extraRowActions?: (record: AdminCrudRecord) => ReactNode
  openEditDialog: (record: AdminCrudRecord) => void
  requestArchive: (record: AdminCrudRecord) => void
  formatValue: (value: unknown, column?: AdminCrudColumnConfig) => string
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
  orderBy?: string
  orderDirection?: AdminCrudOrderDirection
  hideSearch?: boolean
  renderItems?: (params: AdminCrudRenderItemsParams) => ReactNode
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
  orderBy = 'id',
  orderDirection = 'asc',
  hideSearch = false,
  renderItems,
  rowGroupBy,
  renderRowGroupHeader,
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
  const emptyFormData = useMemo(() => createEmptyFormData(fields), [fields])

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
      if (field.type !== 'select' || !field.autoFillTargets?.length) {
        return
      }

      const currentValue = watchedFormValues[field.key]

      if (!currentValue) {
        return
      }

      const selectedOption = (field.options ?? []).find((option) => option.value === currentValue)

      if (!selectedOption) {
        return
      }

      field.autoFillTargets.forEach((target) => {
        const nextValue = selectedOption.meta?.[target.metaKey]

        if (nextValue === null || nextValue === undefined) {
          return
        }

        const nextStringValue = String(nextValue)

        if (watchedFormValues[target.targetKey] !== nextStringValue) {
          form.setValue(target.targetKey, nextStringValue, {
            shouldDirty: true,
            shouldValidate: true
          })
        }
      })
    })
  }, [fields, form, watchedFormValues])

  useEffect(() => {
    fields.forEach((field) => {
      if (!field.autoFillTimeEnd) {
        return
      }

      const enabledKey = field.autoFillTimeEnd.enabledKey

      if (enabledKey && watchedFormValues[enabledKey] !== 'true') {
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
        orderBy,
        orderDirection
      })

      setItems(result.items)
      setTotal(result.total)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить данные')
    } finally {
      setIsLoading(false)
    }
  }, [entity, page, search, filtersKey, orderBy, orderDirection])

  useEffect(() => {
    setPage(1)
  }, [entity, filtersKey])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  function openCreateDialog() {
    setDialogMode('create')
    setSelectedRecord(null)
    form.reset(createEmptyFormData(fields))
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
      persistFormValues(fields, formValues)
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
                {createTableRows(items, rowGroupBy).map((tableRow) => {
                  if (tableRow.type === 'group') {
                    return (
                      <tr key={`group-${tableRow.groupKey}`}>
                        <td
                          colSpan={columns.length + 1}
                          className="border-y border-[var(--color-primary)]/25 bg-[var(--color-primary)]/10 px-4 py-2 text-sm font-semibold text-[var(--color-primary)]"
                        >
                          {renderRowGroupHeader
                            ? renderRowGroupHeader(tableRow.groupKey, tableRow.records)
                            : tableRow.groupKey}
                        </td>
                      </tr>
                    )
                  }

                  const record = tableRow.record

                  return (
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
                          {column.render
                            ? column.render(record)
                            : formatValue(record[column.key], column)}
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
                  )
                })}

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
              {fields
                .filter((field) => isFieldVisible(field, watchedFormValues))
                .map((field) => {
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
                            allFields={fields}
                            value={controllerField.value ?? ''}
                            formValues={watchedFormValues}
                            onChange={controllerField.onChange}
                            onBlur={controllerField.onBlur}
                            onSetValue={(fieldKey, nextValue) => {
                              form.setValue(fieldKey, nextValue, {
                                shouldDirty: true,
                                shouldValidate: true
                              })
                            }}
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

type AdminCrudTableRow =
  | {
      type: 'group'
      groupKey: string
      records: AdminCrudRecord[]
    }
  | {
      type: 'record'
      record: AdminCrudRecord
    }

function createTableRows(
  items: AdminCrudRecord[],
  rowGroupBy?: (record: AdminCrudRecord) => string | number | null | undefined
): AdminCrudTableRow[] {
  if (!rowGroupBy) {
    return items.map((record) => ({
      type: 'record',
      record
    }))
  }

  const groups = new Map<string, AdminCrudRecord[]>()

  items.forEach((record) => {
    const groupKey = normalizeGroupKey(rowGroupBy(record))
    const groupRecords = groups.get(groupKey) ?? []

    groupRecords.push(record)
    groups.set(groupKey, groupRecords)
  })

  return Array.from(groups.entries()).flatMap(([groupKey, records]) => [
    {
      type: 'group' as const,
      groupKey,
      records
    },
    ...records.map((record) => ({
      type: 'record' as const,
      record
    }))
  ])
}

function normalizeGroupKey(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'Без группы'
  }

  return String(value)
}

function isFieldVisible(field: AdminCrudFieldConfig, formValues: Record<string, string>): boolean {
  if (field.hidden) {
    return false
  }

  if (!field.visibleWhen) {
    return true
  }

  return String(formValues[field.visibleWhen.fieldKey] ?? '') === String(field.visibleWhen.value)
}

function getFieldWrapperClassName(field: AdminCrudFieldConfig): string {
  return cn(
    'grid gap-2',
    (field.fullWidth || field.type === 'textarea') && 'md:col-span-2 xl:col-span-3'
  )
}

function CrudFieldInput({
  field,
  allFields,
  value,
  formValues,
  onChange,
  onBlur,
  onSetValue
}: {
  field: AdminCrudFieldConfig
  allFields: AdminCrudFieldConfig[]
  value: string
  formValues: Record<string, string>
  onChange: (value: string) => void
  onBlur: () => void
  onSetValue: (fieldKey: string, value: string) => void
}) {
  if (field.type === 'toggle') {
    const isChecked = value === '1' || value === 'true'

    function handleToggle() {
      const nextValue = isChecked ? '0' : '1'

      onChange(nextValue)

      if (nextValue !== '1' || !field.exclusiveGroup) {
        return
      }

      allFields
        .filter((otherField) => {
          return otherField.key !== field.key && otherField.exclusiveGroup === field.exclusiveGroup
        })
        .forEach((otherField) => {
          onSetValue(otherField.key, '0')
        })
    }

    return (
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        disabled={field.disabled}
        onBlur={onBlur}
        onClick={handleToggle}
        className={cn(
          'flex min-h-10 w-full items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-left text-sm text-[var(--color-text)] transition-colors',
          'hover:border-[var(--color-primary)]',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
      >
        <span>{field.placeholder ?? field.label}</span>

        <span
          className={cn(
            'relative h-6 w-11 shrink-0 rounded-full transition-colors',
            isChecked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-muted)]'
          )}
        >
          <span
            className={cn(
              'absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
              isChecked ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </span>
      </button>
    )
  }

  if (field.type === 'checkbox') {
    return (
      <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]">
        <input
          type="checkbox"
          checked={value === '1' || value === 'true'}
          disabled={field.disabled}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.checked ? '1' : '0')}
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
                ? (field.dependencyPlaceholder ?? 'Сначала выбери связанное поле')
                : (field.placeholder ?? 'Выбери значение')
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
  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .join('\n')
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
      schema = schema.refine((value) => !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
        message: 'Некорректный email'
      })
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

function createEmptyFormData(fields: AdminCrudFieldConfig[]): Record<string, string> {
  return fields.reduce<Record<string, string>>((result, field) => {
    result[field.key] = getFieldDefaultValue(field)
    return result
  }, {})
}

function getFieldDefaultValue(field: AdminCrudFieldConfig): string {
  if (field.persistKey) {
    return localStorage.getItem(field.persistKey) ?? field.defaultValue ?? ''
  }

  return field.defaultValue ?? ''
}

function persistFormValues(fields: AdminCrudFieldConfig[], formData: Record<string, string>): void {
  fields.forEach((field) => {
    if (!field.persistKey) {
      return
    }

    if (field.persistWhenCheckedKey && formData[field.persistWhenCheckedKey] !== 'true') {
      return
    }

    const value = formData[field.key]?.trim()

    if (!value) {
      return
    }

    localStorage.setItem(field.persistKey, value)
  })
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
