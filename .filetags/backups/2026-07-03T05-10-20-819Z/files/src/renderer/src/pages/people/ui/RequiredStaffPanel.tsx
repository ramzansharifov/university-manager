import type { FormEvent } from 'react'
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
  DateInput,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  PhoneInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea
} from '../../../shared/ui'

type RequiredStaffRoleKey =
  | 'faculty_dean'
  | 'faculty_deputy_dean'
  | 'department_head'
  | 'department_deputy_head'
  | 'group_curator'

type PersonEntity = 'employees' | 'teachers'
type TargetEntity = 'faculties' | 'departments' | 'student_groups'

interface RequiredStaffRoleConfig {
  key: RequiredStaffRoleKey
  label: string
  personEntity: PersonEntity
  targetEntity: TargetEntity
  targetField: string
  formDescription: string
}

interface PendingAssignment {
  roles: RequiredStaffRoleConfig[]
  record: AdminCrudRecord
}

interface StaffFormState {
  role_key: string
  status_id: string
  last_name: string
  first_name: string
  middle_name: string
  birth_date: string
  email: string
  phone: string
  address: string
  hire_date: string
  teaching_subjects: string
  note: string
}

const initialStaffFormState: StaffFormState = {
  role_key: '',
  status_id: '',
  last_name: '',
  first_name: '',
  middle_name: '',
  birth_date: '',
  email: '',
  phone: '',
  address: '',
  hire_date: '',
  teaching_subjects: '',
  note: ''
}

const requiredStaffRoles: Record<RequiredStaffRoleKey, RequiredStaffRoleConfig> = {
  faculty_dean: {
    key: 'faculty_dean',
    label: 'Декан',
    personEntity: 'employees',
    targetEntity: 'faculties',
    targetField: 'dean_employee_id',
    formDescription:
      'Создай сотрудника. После сохранения он будет назначен деканом выбранного факультета.'
  },
  faculty_deputy_dean: {
    key: 'faculty_deputy_dean',
    label: 'Заместитель декана',
    personEntity: 'employees',
    targetEntity: 'faculties',
    targetField: 'deputy_dean_employee_id',
    formDescription:
      'Создай сотрудника. После сохранения он будет назначен заместителем декана выбранного факультета.'
  },
  department_head: {
    key: 'department_head',
    label: 'Заведующий кафедрой',
    personEntity: 'teachers',
    targetEntity: 'departments',
    targetField: 'head_teacher_id',
    formDescription:
      'Создай преподавателя. После сохранения он будет назначен заведующим выбранной кафедрой.'
  },
  department_deputy_head: {
    key: 'department_deputy_head',
    label: 'Заместитель заведующего',
    personEntity: 'teachers',
    targetEntity: 'departments',
    targetField: 'deputy_head_teacher_id',
    formDescription:
      'Создай преподавателя. После сохранения он будет назначен заместителем заведующего выбранной кафедрой.'
  },
  group_curator: {
    key: 'group_curator',
    label: 'Куратор группы',
    personEntity: 'teachers',
    targetEntity: 'student_groups',
    targetField: 'curator_teacher_id',
    formDescription:
      'Создай преподавателя. После сохранения он будет назначен куратором выбранной группы.'
  }
}

export function RequiredStaffPanel() {
  const [employeeOptions, setEmployeeOptions] = useState<AdminCrudSelectOption[]>([])
  const [teacherOptions, setTeacherOptions] = useState<AdminCrudSelectOption[]>([])
  const [employeeStatusOptions, setEmployeeStatusOptions] = useState<AdminCrudSelectOption[]>([])
  const [teacherStatusOptions, setTeacherStatusOptions] = useState<AdminCrudSelectOption[]>([])
  const [pendingAssignment, setPendingAssignment] = useState<PendingAssignment | null>(null)
  const [staffForm, setStaffForm] = useState<StaffFormState>(initialStaffFormState)
  const [formError, setFormError] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [refreshVersion, setRefreshVersion] = useState(0)

  const loadRelationOptions = useCallback(async () => {
    const [employees, teachers, employeeStatuses, teacherStatuses] = await Promise.all([
      window.api.adminCrud.list({
        entity: 'employees',
        page: 1,
        pageSize: 100,
        orderBy: 'last_name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'teachers',
        page: 1,
        pageSize: 100,
        orderBy: 'last_name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'dictionary_items',
        page: 1,
        pageSize: 100,
        filters: { dictionary_key: 'employee_statuses' },
        orderBy: 'sort_order',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'dictionary_items',
        page: 1,
        pageSize: 100,
        filters: { dictionary_key: 'teacher_statuses' },
        orderBy: 'sort_order',
        orderDirection: 'asc'
      })
    ])

    setEmployeeOptions(createPersonOptions(employees.items))
    setTeacherOptions(createPersonOptions(teachers.items))
    setEmployeeStatusOptions(createDictionaryOptions(employeeStatuses.items))
    setTeacherStatusOptions(createDictionaryOptions(teacherStatuses.items))
  }, [])

  useEffect(() => {
    void loadRelationOptions()
  }, [loadRelationOptions])

  const employeeNameById = useMemo(() => createOptionsMap(employeeOptions), [employeeOptions])
  const teacherNameById = useMemo(() => createOptionsMap(teacherOptions), [teacherOptions])

  const facultyFields = useMemo(
    () => createFacultyRequiredStaffFields(employeeOptions),
    [employeeOptions]
  )
  const facultyColumns = useMemo(
    () => createFacultyRequiredStaffColumns(employeeNameById),
    [employeeNameById]
  )

  const departmentFields = useMemo(
    () => createDepartmentRequiredStaffFields(teacherOptions),
    [teacherOptions]
  )
  const departmentColumns = useMemo(
    () => createDepartmentRequiredStaffColumns(teacherNameById),
    [teacherNameById]
  )

  const groupFields = useMemo(() => createGroupRequiredStaffFields(teacherOptions), [teacherOptions])
  const groupColumns = useMemo(
    () => createGroupRequiredStaffColumns(teacherNameById),
    [teacherNameById]
  )

  const selectedRole = pendingAssignment
    ? getSelectedRole(pendingAssignment.roles, staffForm.role_key)
    : null

  function openAssignmentDialog(record: AdminCrudRecord, roles: RequiredStaffRoleConfig[]) {
    setPageError(null)
    setFormError(null)
    setPendingAssignment({
      roles,
      record
    })
    setStaffForm({
      ...initialStaffFormState,
      role_key: roles[0]?.key ?? ''
    })
  }

  function closeAssignmentDialog() {
    if (isSubmitting) {
      return
    }

    setPendingAssignment(null)
    setStaffForm(initialStaffFormState)
    setFormError(null)
  }

  function updateStaffFormField(field: keyof StaffFormState, value: string) {
    setStaffForm((current) => ({
      ...current,
      [field]: value
    }))
  }

  async function handleStaffFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!pendingAssignment) {
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      const role = getSelectedRole(pendingAssignment.roles, staffForm.role_key)

      if (!role) {
        throw new Error('Выбери назначение сотрудника')
      }

      validateStaffForm(staffForm)

      const teacherDepartmentId =
        role.personEntity === 'teachers'
          ? await getTeacherDepartmentIdForAssignment(role, pendingAssignment.record)
          : undefined

      const createdPerson = await window.api.adminCrud.create({
        entity: role.personEntity,
        data: buildPersonPayload(role, staffForm, teacherDepartmentId)
      })

      const createdPersonId = normalizeRequiredNumber(
        createdPerson.item?.id,
        'После создания сотрудника backend не вернул ID'
      )

      await window.api.adminCrud.update({
        entity: role.targetEntity,
        id: normalizeRequiredNumber(pendingAssignment.record.id, 'У выбранной записи нет ID'),
        data: {
          [role.targetField]: createdPersonId
        }
      })

      setPendingAssignment(null)
      setStaffForm(initialStaffFormState)
      await loadRelationOptions()
      setRefreshVersion((current) => current + 1)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Не удалось создать и назначить')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
        Здесь назначаются обязательные сотрудники учебной структуры: деканат факультетов,
        руководство кафедр и кураторы групп. Нажми «Добавить» в строке нужного факультета,
        кафедры или группы, а затем выбери назначение внутри формы.
      </div>

      {pageError ? (
        <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          {pageError}
        </div>
      ) : null}

      <Tabs defaultValue="faculties">
        <TabsList>
          <TabsTrigger value="faculties">Факультеты</TabsTrigger>
          <TabsTrigger value="departments">Кафедры</TabsTrigger>
          <TabsTrigger value="groups">Группы</TabsTrigger>
        </TabsList>

        <TabsContent value="faculties">
          <AdminCrudEntityPanel
            key={`faculties-${refreshVersion}`}
            entity="faculties"
            title="Деканат факультетов"
            description="Создание и назначение декана или заместителя декана для каждого факультета."
            createButtonLabel="Добавить факультет"
            fields={facultyFields}
            columns={facultyColumns}
            canCreate={false}
            canEdit={false}
            canArchive={false}
            orderBy="name"
            orderDirection="asc"
            emptyMessage="Факультеты пока не созданы. Создай их в разделе «Университет → Учебная структура»."
            extraRowActions={(record) => (
              <RequiredStaffRowActions
                record={record}
                roles={[
                  requiredStaffRoles.faculty_dean,
                  requiredStaffRoles.faculty_deputy_dean
                ]}
                onOpenAssignment={openAssignmentDialog}
              />
            )}
          />
        </TabsContent>

        <TabsContent value="departments">
          <AdminCrudEntityPanel
            key={`departments-${refreshVersion}`}
            entity="departments"
            title="Руководство кафедр"
            description="Создание и назначение заведующего кафедрой или заместителя заведующего."
            createButtonLabel="Добавить кафедру"
            fields={departmentFields}
            columns={departmentColumns}
            canCreate={false}
            canEdit={false}
            canArchive={false}
            orderBy="name"
            orderDirection="asc"
            emptyMessage="Кафедры пока не созданы. Создай их в разделе «Университет → Учебная структура»."
            extraRowActions={(record) => (
              <RequiredStaffRowActions
                record={record}
                roles={[
                  requiredStaffRoles.department_head,
                  requiredStaffRoles.department_deputy_head
                ]}
                onOpenAssignment={openAssignmentDialog}
              />
            )}
          />
        </TabsContent>

        <TabsContent value="groups">
          <AdminCrudEntityPanel
            key={`groups-${refreshVersion}`}
            entity="student_groups"
            title="Кураторы групп"
            description="Создание и назначение куратора для каждой учебной группы."
            createButtonLabel="Добавить группу"
            fields={groupFields}
            columns={groupColumns}
            canCreate={false}
            canEdit={false}
            canArchive={false}
            orderBy="name"
            orderDirection="asc"
            emptyMessage="Учебные группы пока не созданы. Создай их в разделе «Университет → Учебная структура»."
            extraRowActions={(record) => (
              <RequiredStaffRowActions
                record={record}
                roles={[requiredStaffRoles.group_curator]}
                onOpenAssignment={openAssignmentDialog}
              />
            )}
          />
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(pendingAssignment)}
        onOpenChange={(open) => !open && closeAssignmentDialog()}
      >
        <DialogContent
          className="flex max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] !max-w-4xl flex-col overflow-hidden p-0"
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
            <DialogTitle>Добавить обязательного сотрудника</DialogTitle>
            <DialogDescription>
              {pendingAssignment
                ? `${selectedRole?.formDescription ?? 'Создай сотрудника и выбери назначение.'} Выбранная запись: ${getRecordName(
                    pendingAssignment.record
                  )}.`
                : 'Заполни форму сотрудника.'}
            </DialogDescription>
          </DialogHeader>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleStaffFormSubmit}>
            <div className="grid min-h-0 grid-cols-1 gap-4 overflow-y-auto px-6 py-5 md:grid-cols-2 xl:grid-cols-3">
              <StaffFormFields
                form={staffForm}
                roles={pendingAssignment?.roles ?? []}
                personEntity={selectedRole?.personEntity ?? 'employees'}
                employeeStatusOptions={employeeStatusOptions}
                teacherStatusOptions={teacherStatusOptions}
                onChange={updateStaffFormField}
              />

              {formError ? (
                <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)] md:col-span-2 xl:col-span-3">
                  {formError}
                </div>
              ) : null}
            </div>

            <DialogFooter className="mt-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isSubmitting}>
                  Отмена
                </Button>
              </DialogClose>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Сохранение...' : 'Создать и назначить'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RequiredStaffRowActions({
  record,
  roles,
  onOpenAssignment
}: {
  record: AdminCrudRecord
  roles: RequiredStaffRoleConfig[]
  onOpenAssignment: (record: AdminCrudRecord, roles: RequiredStaffRoleConfig[]) => void
}) {
  return (
    <Button size="sm" variant="primary" onClick={() => onOpenAssignment(record, roles)}>
      Добавить
    </Button>
  )
}

function StaffFormFields({
  form,
  roles,
  personEntity,
  employeeStatusOptions,
  teacherStatusOptions,
  onChange
}: {
  form: StaffFormState
  roles: RequiredStaffRoleConfig[]
  personEntity: PersonEntity
  employeeStatusOptions: AdminCrudSelectOption[]
  teacherStatusOptions: AdminCrudSelectOption[]
  onChange: (field: keyof StaffFormState, value: string) => void
}) {
  const statusOptions = personEntity === 'employees' ? employeeStatusOptions : teacherStatusOptions

  return (
    <>
      <label className="grid gap-2 md:col-span-2 xl:col-span-3">
        <span className="text-sm font-medium text-[var(--color-text)]">
          Назначение <span className="text-[var(--color-danger)]">*</span>
        </span>
        <Select
          value={form.role_key || undefined}
          disabled={roles.length <= 1}
          onValueChange={(value) => onChange('role_key', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выбери назначение" />
          </SelectTrigger>

          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.key} value={role.key}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-[var(--color-text)]">Статус</span>
        <Select
          value={form.status_id || undefined}
          disabled={statusOptions.length === 0}
          onValueChange={(value) => onChange('status_id', value)}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={statusOptions.length > 0 ? 'Выбери статус' : 'Статусы пока не созданы'}
            />
          </SelectTrigger>

          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-[var(--color-text)]">
          Фамилия <span className="text-[var(--color-danger)]">*</span>
        </span>
        <Input
          value={form.last_name}
          placeholder="Например: Иванов"
          onChange={(event) => onChange('last_name', event.target.value)}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-[var(--color-text)]">
          Имя <span className="text-[var(--color-danger)]">*</span>
        </span>
        <Input
          value={form.first_name}
          placeholder="Например: Иван"
          onChange={(event) => onChange('first_name', event.target.value)}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-[var(--color-text)]">Отчество</span>
        <Input
          value={form.middle_name}
          placeholder="Например: Иванович"
          onChange={(event) => onChange('middle_name', event.target.value)}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-[var(--color-text)]">Дата рождения</span>
        <DateInput
          value={form.birth_date}
          placeholder="дд.мм.гггг"
          onChange={(value) => onChange('birth_date', value)}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-[var(--color-text)]">Email</span>
        <Input
          type="email"
          value={form.email}
          placeholder="person@example.com"
          onChange={(event) => onChange('email', event.target.value)}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-[var(--color-text)]">Телефон</span>
        <PhoneInput
          value={form.phone}
          placeholder="Например: 999 123-45-67"
          onChange={(value) => onChange('phone', value)}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-[var(--color-text)]">Дата приёма</span>
        <DateInput
          value={form.hire_date}
          placeholder="дд.мм.гггг"
          onChange={(value) => onChange('hire_date', value)}
        />
      </label>

      {personEntity === 'teachers' ? (
        <label className="grid gap-2 md:col-span-2 xl:col-span-3">
          <span className="text-sm font-medium text-[var(--color-text)]">Преподаёт</span>
          <Input
            value={form.teaching_subjects}
            placeholder="Например: Математика, программирование, базы данных"
            onChange={(event) => onChange('teaching_subjects', event.target.value)}
          />
        </label>
      ) : null}

      <label className="grid gap-2 md:col-span-2 xl:col-span-3">
        <span className="text-sm font-medium text-[var(--color-text)]">Адрес</span>
        <Textarea
          value={form.address}
          placeholder="Адрес проживания"
          onChange={(event) => onChange('address', event.target.value)}
        />
      </label>

      <label className="grid gap-2 md:col-span-2 xl:col-span-3">
        <span className="text-sm font-medium text-[var(--color-text)]">Примечание</span>
        <Textarea
          value={form.note}
          placeholder="Дополнительная информация"
          onChange={(event) => onChange('note', event.target.value)}
        />
      </label>
    </>
  )
}

function createFacultyRequiredStaffFields(
  employeeOptions: AdminCrudSelectOption[]
): AdminCrudFieldConfig[] {
  return [
    {
      key: 'dean_employee_id',
      label: 'Декан',
      placeholder: employeeOptions.length > 0 ? 'Выбери декана' : 'Сначала добавь декана',
      type: 'select',
      valueType: 'number',
      options: employeeOptions
    },
    {
      key: 'deputy_dean_employee_id',
      label: 'Заместитель декана',
      placeholder:
        employeeOptions.length > 0 ? 'Выбери заместителя декана' : 'Сначала добавь заместителя',
      type: 'select',
      valueType: 'number',
      options: employeeOptions
    }
  ]
}

function createDepartmentRequiredStaffFields(
  teacherOptions: AdminCrudSelectOption[]
): AdminCrudFieldConfig[] {
  return [
    {
      key: 'head_teacher_id',
      label: 'Заведующий кафедрой',
      placeholder: teacherOptions.length > 0 ? 'Выбери преподавателя' : 'Сначала добавь заведующего',
      type: 'select',
      valueType: 'number',
      options: teacherOptions
    },
    {
      key: 'deputy_head_teacher_id',
      label: 'Заместитель заведующего',
      placeholder:
        teacherOptions.length > 0 ? 'Выбери преподавателя' : 'Сначала добавь заместителя',
      type: 'select',
      valueType: 'number',
      options: teacherOptions
    }
  ]
}

function createGroupRequiredStaffFields(
  teacherOptions: AdminCrudSelectOption[]
): AdminCrudFieldConfig[] {
  return [
    {
      key: 'curator_teacher_id',
      label: 'Куратор группы',
      placeholder: teacherOptions.length > 0 ? 'Выбери куратора' : 'Сначала добавь куратора',
      type: 'select',
      valueType: 'number',
      options: teacherOptions
    }
  ]
}

function createFacultyRequiredStaffColumns(
  employeeNameById: Map<number, string>
): AdminCrudColumnConfig[] {
  return [
    {
      key: 'id',
      label: 'ID'
    },
    {
      key: 'name',
      label: 'Факультет'
    },
    {
      key: 'short_name',
      label: 'Краткое'
    },
    {
      key: 'dean_employee_id',
      label: 'Декан',
      render: (record) => renderRelation(record.dean_employee_id, employeeNameById)
    },
    {
      key: 'deputy_dean_employee_id',
      label: 'Зам. декана',
      render: (record) => renderRelation(record.deputy_dean_employee_id, employeeNameById)
    }
  ]
}

function createDepartmentRequiredStaffColumns(
  teacherNameById: Map<number, string>
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

function createGroupRequiredStaffColumns(
  teacherNameById: Map<number, string>
): AdminCrudColumnConfig[] {
  return [
    {
      key: 'id',
      label: 'ID'
    },
    {
      key: 'name',
      label: 'Группа'
    },
    {
      key: 'course',
      label: 'Курс'
    },
    {
      key: 'curator_teacher_id',
      label: 'Куратор',
      render: (record) => renderRelation(record.curator_teacher_id, teacherNameById)
    }
  ]
}

function getSelectedRole(
  roles: RequiredStaffRoleConfig[],
  roleKey: string
): RequiredStaffRoleConfig | null {
  return roles.find((role) => role.key === roleKey) ?? roles[0] ?? null
}

function validateStaffForm(form: StaffFormState): void {
  if (!form.role_key.trim()) {
    throw new Error('Выбери назначение сотрудника')
  }

  if (!form.last_name.trim()) {
    throw new Error('Укажи фамилию')
  }

  if (!form.first_name.trim()) {
    throw new Error('Укажи имя')
  }
}

function buildPersonPayload(
  role: RequiredStaffRoleConfig,
  form: StaffFormState,
  teacherDepartmentId?: number
): AdminCrudRecord {
  const basePayload: AdminCrudRecord = {
    status_id: normalizeOptionalNumber(form.status_id),
    last_name: form.last_name.trim(),
    first_name: form.first_name.trim(),
    middle_name: form.middle_name.trim(),
    birth_date: form.birth_date.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    hire_date: form.hire_date.trim(),
    note: form.note.trim()
  }

  if (role.personEntity === 'teachers') {
    return {
      ...basePayload,
      department_id: teacherDepartmentId ?? null,
      teaching_subjects: form.teaching_subjects.trim()
    }
  }

  return basePayload
}

async function getTeacherDepartmentIdForAssignment(
  role: RequiredStaffRoleConfig,
  record: AdminCrudRecord
): Promise<number> {
  if (role.targetEntity === 'departments') {
    return normalizeRequiredNumber(record.id, 'У выбранной кафедры нет ID')
  }

  if (role.targetEntity === 'student_groups') {
    const specialtyId = normalizeRequiredNumber(
      record.specialty_id,
      'У выбранной группы не указана специальность'
    )

    const specialty = await window.api.adminCrud.getById({
      entity: 'specialties',
      id: specialtyId
    })

    if (!specialty) {
      throw new Error('Специальность выбранной группы не найдена')
    }

    return normalizeRequiredNumber(
      specialty.department_id,
      'У специальности выбранной группы не указана кафедра'
    )
  }

  throw new Error('Для выбранного назначения невозможно определить кафедру преподавателя')
}

function normalizeRequiredNumber(value: unknown, errorMessage: string): number {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    throw new Error(errorMessage)
  }

  return numberValue
}

function normalizeOptionalNumber(value: string): number | null {
  if (!value.trim()) {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

function createPersonOptions(items: AdminCrudRecord[]): AdminCrudSelectOption[] {
  return items.map((item) => ({
    value: String(item.id),
    label: getPersonName(item)
  }))
}

function createDictionaryOptions(items: AdminCrudRecord[]): AdminCrudSelectOption[] {
  return items.map((item) => ({
    value: String(item.id),
    label: String(item.name ?? item.item_key ?? `#${item.id}`)
  }))
}

function createOptionsMap(options: AdminCrudSelectOption[]): Map<number, string> {
  return new Map(options.map((option) => [Number(option.value), option.label]))
}

function getPersonName(record: AdminCrudRecord): string {
  const fullName = [record.last_name, record.first_name, record.middle_name]
    .filter(Boolean)
    .map(String)
    .join(' ')

  return fullName || String(record.name ?? `#${record.id}`)
}

function getRecordName(record: AdminCrudRecord): string {
  return String(record.name ?? getPersonName(record) ?? `#${record.id}`)
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