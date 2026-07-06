import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  AdminCrudColumnConfig,
  AdminCrudFieldConfig,
  AdminCrudRecord,
  AdminCrudSelectOption
} from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea
} from '../../../shared/ui'

export function DepartmentsPanel() {
  const [teacherOptions, setTeacherOptions] = useState<AdminCrudSelectOption[]>([])
  const [facultyOptions, setFacultyOptions] = useState<AdminCrudSelectOption[]>([])
  const [departmentFacultiesMap, setDepartmentFacultiesMap] = useState<Map<number, number[]>>(
    new Map()
  )
  const [dfRecords, setDfRecords] = useState<AdminCrudRecord[]>([])
  const [editRecord, setEditRecord] = useState<AdminCrudRecord | null>(null)
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create')
  const [refreshVersion, setRefreshVersion] = useState(0)

  const loadOptions = useCallback(async () => {
    const [teachers, faculties, dfResult] = await Promise.all([
      window.api.adminCrud.list({
        entity: 'teachers',
        page: 1,
        pageSize: 500,
        orderBy: 'last_name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'faculties',
        page: 1,
        pageSize: 500,
        orderBy: 'name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'department_faculties',
        page: 1,
        pageSize: 5000,
        orderBy: 'id',
        orderDirection: 'asc'
      })
    ])

    setTeacherOptions(createPersonOptions(teachers.items))
    setFacultyOptions(createNamedOptions(faculties.items))
    setDfRecords(dfResult.items.filter((r) => Number(r.is_archived) !== 1))

    const dfMap = new Map<number, number[]>()

    for (const df of dfResult.items) {
      const deptId = Number(df.department_id)
      const facId = Number(df.faculty_id)

      if (!Number.isFinite(deptId) || !Number.isFinite(facId)) {
        continue
      }

      if (Number(df.is_archived) === 1) {
        continue
      }

      if (!dfMap.has(deptId)) {
        dfMap.set(deptId, [])
      }

      dfMap.get(deptId)!.push(facId)
    }

    setDepartmentFacultiesMap(dfMap)
  }, [])

  useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  const teacherNameById = useMemo(() => createOptionsMap(teacherOptions), [teacherOptions])
  const facultyNameById = useMemo(() => createOptionsMap(facultyOptions), [facultyOptions])

  const departmentFields = useMemo(() => createDepartmentFields(), [])
  const departmentColumns = useMemo(
    () => createDepartmentColumns(teacherNameById, departmentFacultiesMap, facultyNameById),
    [teacherNameById, departmentFacultiesMap, facultyNameById]
  )

  function handleCreate() {
    setEditMode('create')
    setEditRecord({})
  }

  function handleEdit(record: AdminCrudRecord) {
    setEditMode('edit')
    const deptId = Number(record.id)
    const existingFacultyIds = departmentFacultiesMap.get(deptId) ?? []

    setEditRecord({
      ...record,
      _selectedFacultyIds: existingFacultyIds.map(String)
    })
  }

  function handleClose() {
    setEditRecord(null)
  }

  async function handleSave(formData: Record<string, unknown>) {
    const name = String(formData.name ?? '').trim()

    if (!name) {
      throw new Error('Укажи название кафедры')
    }

    const appliesToAll = formData.applies_to_all_faculties === true ? 1 : 0
    const selectedFacultyIds: string[] = Array.isArray(formData._selectedFacultyIds)
      ? (formData._selectedFacultyIds as string[])
      : []

    if (appliesToAll === 0 && selectedFacultyIds.length === 0) {
      throw new Error('Выбери хотя бы один факультет или отметь «Для всех факультетов»')
    }

    const departmentData: AdminCrudRecord = {
      name,
      short_name: formData.short_name ? String(formData.short_name).trim() : null,
      description: formData.description ? String(formData.description).trim() : null,
      applies_to_all_faculties: appliesToAll
    }

    let departmentId: number

    if (editMode === 'edit' && editRecord?.id) {
      departmentId = Number(editRecord.id)
      await window.api.adminCrud.update({
        entity: 'departments',
        id: departmentId,
        data: departmentData
      })
    } else {
      const result = await window.api.adminCrud.create({
        entity: 'departments',
        data: departmentData
      })

      departmentId = Number(result.item?.id)

      if (!Number.isFinite(departmentId)) {
        throw new Error('Не удалось получить ID созданной кафедры')
      }
    }

    const existingDfIds = departmentFacultiesMap.get(departmentId) ?? []
    const selectedSet = new Set(selectedFacultyIds.map(Number))

    if (appliesToAll === 1) {
      for (const facultyId of existingDfIds) {
        const dfId = findDfRecordId(dfRecords, departmentId, facultyId)

        if (dfId !== null) {
          await window.api.adminCrud.archive({
            entity: 'department_faculties',
            id: dfId
          })
        }
      }
    } else {
      for (const facultyId of existingDfIds) {
        if (!selectedSet.has(facultyId)) {
          const dfId = findDfRecordId(dfRecords, departmentId, facultyId)

          if (dfId !== null) {
            await window.api.adminCrud.archive({
              entity: 'department_faculties',
              id: dfId
            })
          }
        }
      }

      for (const facultyIdStr of selectedFacultyIds) {
        const facultyId = Number(facultyIdStr)

        if (!existingDfIds.includes(facultyId)) {
          await window.api.adminCrud.create({
            entity: 'department_faculties',
            data: {
              department_id: departmentId,
              faculty_id: facultyId
            }
          })
        }
      }
    }

    setEditRecord(null)
    await loadOptions()
    setRefreshVersion((v) => v + 1)
  }

  return (
    <div className="grid gap-4">
      <AdminCrudEntityPanel
        key={`departments-${refreshVersion}`}
        entity="departments"
        title="Кафедры"
        description="Все кафедры университета. Кафедра может быть связана с одним, несколькими или всеми факультетами."
        createButtonLabel="Добавить кафедру"
        fields={departmentFields}
        columns={departmentColumns}
        canCreate={true}
        canEdit={true}
        canArchive={true}
        canDelete={true}
        orderBy="name"
        orderDirection="asc"
        emptyMessage="Кафедры пока не созданы."
        onAfterMutation={loadOptions}
        onCreateClick={handleCreate}
        onEditClick={handleEdit}
      />

      <DepartmentFormDialog
        mode={editMode}
        record={editRecord}
        facultyOptions={facultyOptions}
        onClose={handleClose}
        onSave={handleSave}
      />
    </div>
  )
}

function DepartmentFormDialog({
  mode,
  record,
  facultyOptions,
  onClose,
  onSave
}: {
  mode: 'create' | 'edit'
  record: AdminCrudRecord | null
  facultyOptions: AdminCrudSelectOption[]
  onClose: () => void
  onSave: (data: Record<string, unknown>) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [description, setDescription] = useState('')
  const [appliesToAll, setAppliesToAll] = useState(false)
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (record) {
      setName(String(record.name ?? ''))
      setShortName(String(record.short_name ?? ''))
      setDescription(String(record.description ?? ''))
      setAppliesToAll(Number(record.applies_to_all_faculties) === 1)
      setSelectedFacultyIds(
        Array.isArray(record._selectedFacultyIds) ? (record._selectedFacultyIds as string[]) : []
      )
      setError(null)
    }
  }, [record])

  function toggleFaculty(facultyId: string) {
    setSelectedFacultyIds((current) => {
      if (current.includes(facultyId)) {
        return current.filter((id) => id !== facultyId)
      }

      return [...current, facultyId]
    })
  }

  async function handleSubmit() {
    setIsSaving(true)
    setError(null)

    try {
      await onSave({
        name,
        short_name: shortName,
        description,
        applies_to_all_faculties: appliesToAll,
        _selectedFacultyIds: selectedFacultyIds
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setIsSaving(false)
    }
  }

  const isOpen = record !== null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Добавить кафедру' : 'Редактировать кафедру'}
          </DialogTitle>
          <DialogDescription>Укажи название и привязку кафедры к факультетам.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text)]">Название кафедры *</span>
            <Input
              value={name}
              placeholder="Например: Кафедра программной инженерии"
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text)]">Краткое название</span>
            <Input
              value={shortName}
              placeholder="Например: КПИ"
              onChange={(e) => setShortName(e.target.value)}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text)]">Описание</span>
            <Textarea
              value={description}
              placeholder="Дополнительная информация"
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className="grid gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={appliesToAll}
                onChange={(e) => setAppliesToAll(e.target.checked)}
              />
              <span className="text-sm font-medium text-[var(--color-text)]">
                Для всех факультетов
              </span>
            </label>
            <p className="text-xs text-[var(--color-text-muted)]">
              Кафедра будет считаться относящейся ко всем активным факультетам.
            </p>
          </div>

          {!appliesToAll ? (
            <div className="grid gap-2">
              <span className="text-sm font-medium text-[var(--color-text)]">Факультеты *</span>
              <p className="text-xs text-[var(--color-text-muted)]">
                Выбери один или несколько факультетов, к которым относится кафедра.
              </p>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--color-border)] p-3">
                {facultyOptions.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Факультеты пока не созданы.
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {facultyOptions.map((faculty) => (
                      <label key={faculty.value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedFacultyIds.includes(faculty.value)}
                          onChange={() => toggleFaculty(faculty.value)}
                        />
                        <span className="text-sm text-[var(--color-text)]">{faculty.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isSaving}>
              Отмена
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="primary"
            disabled={isSaving}
            onClick={() => void handleSubmit()}
          >
            {isSaving ? 'Сохраняем...' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function createDepartmentFields(): AdminCrudFieldConfig[] {
  return [
    {
      key: 'name',
      label: 'Название кафедры',
      placeholder: 'Например: Кафедра программной инженерии',
      required: true
    },
    {
      key: 'short_name',
      label: 'Краткое название',
      placeholder: 'Например: КПИ'
    },
    {
      key: 'description',
      label: 'Описание',
      placeholder: 'Дополнительная информация',
      type: 'textarea'
    }
  ]
}

function createDepartmentColumns(
  teacherNameById: Map<number, string>,
  departmentFacultiesMap: Map<number, number[]>,
  facultyNameById: Map<number, string>
): AdminCrudColumnConfig[] {
  return [
    {
      key: 'id',
      label: 'ID'
    },
    {
      key: 'name',
      label: 'Кафедра'
    },
    {
      key: 'short_name',
      label: 'Краткое'
    },
    {
      key: '_faculties',
      label: 'Факультеты',
      render: (record) => {
        if (Number(record.applies_to_all_faculties) === 1) {
          return 'Все факультеты'
        }

        const facultyIds = departmentFacultiesMap.get(Number(record.id)) ?? []

        if (facultyIds.length === 0) {
          return 'Не привязана'
        }

        return facultyIds.map((id) => facultyNameById.get(id) ?? `#${id}`).join(', ')
      }
    },
    {
      key: 'head_teacher_id',
      label: 'Заведующий',
      render: (record) => renderRelation(record.head_teacher_id, teacherNameById)
    },
    {
      key: 'deputy_head_teacher_id',
      label: 'Заместитель',
      render: (record) => renderRelation(record.deputy_head_teacher_id, teacherNameById)
    }
  ]
}

function createPersonOptions(items: AdminCrudRecord[]): AdminCrudSelectOption[] {
  return items.map((item) => ({
    value: String(item.id),
    label: getPersonName(item)
  }))
}

function createNamedOptions(items: AdminCrudRecord[]): AdminCrudSelectOption[] {
  return items.map((item) => ({
    value: String(item.id),
    label: String(item.name ?? item.short_name ?? `#${item.id}`)
  }))
}

function createOptionsMap(options: AdminCrudSelectOption[]): Map<number, string> {
  return new Map(options.map((option) => [Number(option.value), option.label]))
}

function findDfRecordId(
  dfRecords: AdminCrudRecord[],
  departmentId: number,
  facultyId: number
): number | null {
  for (const df of dfRecords) {
    if (Number(df.department_id) === departmentId && Number(df.faculty_id) === facultyId) {
      return Number(df.id)
    }
  }

  return null
}

function getPersonName(record: AdminCrudRecord): string {
  return [record.last_name, record.first_name, record.middle_name]
    .filter(Boolean)
    .map(String)
    .join(' ')
}

function renderRelation(value: unknown, labelsById: Map<number, string>): string {
  if (value === null || value === undefined || value === '') {
    return 'Не назначен'
  }

  const id = Number(value)

  if (!Number.isFinite(id)) {
    return String(value)
  }

  return labelsById.get(id) ?? `#${id}`
}
