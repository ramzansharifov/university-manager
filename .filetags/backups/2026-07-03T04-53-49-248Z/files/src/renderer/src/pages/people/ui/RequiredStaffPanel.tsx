import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  AdminCrudColumnConfig,
  AdminCrudFieldConfig,
  AdminCrudRecord,
  AdminCrudSelectOption
} from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../shared/ui'

export function RequiredStaffPanel() {
  const [employeeOptions, setEmployeeOptions] = useState<AdminCrudSelectOption[]>([])
  const [teacherOptions, setTeacherOptions] = useState<AdminCrudSelectOption[]>([])

  const loadRelationOptions = useCallback(async () => {
    const [employees, teachers] = await Promise.all([
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
      })
    ])

    setEmployeeOptions(createPersonOptions(employees.items))
    setTeacherOptions(createPersonOptions(teachers.items))
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

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
        Здесь назначаются обязательные сотрудники учебной структуры: деканат факультетов,
        руководство кафедр и кураторы групп. Кастомные сотрудники для ручных подразделений остаются
        во вкладке «Сотрудники».
      </div>

      <Tabs defaultValue="faculties">
        <TabsList>
          <TabsTrigger value="faculties">Факультеты</TabsTrigger>
          <TabsTrigger value="departments">Кафедры</TabsTrigger>
          <TabsTrigger value="groups">Группы</TabsTrigger>
        </TabsList>

        <TabsContent value="faculties">
          <AdminCrudEntityPanel
            entity="faculties"
            title="Деканат факультетов"
            description="Назначение декана и заместителя декана для каждого факультета."
            createButtonLabel="Добавить факультет"
            fields={facultyFields}
            columns={facultyColumns}
            canCreate={false}
            canArchive={false}
            orderBy="name"
            orderDirection="asc"
            emptyMessage="Факультеты пока не созданы. Создай их в разделе «Университет → Учебная структура»."
            onAfterMutation={loadRelationOptions}
          />
        </TabsContent>

        <TabsContent value="departments">
          <AdminCrudEntityPanel
            entity="departments"
            title="Руководство кафедр"
            description="Назначение заведующего кафедрой и заместителя заведующего."
            createButtonLabel="Добавить кафедру"
            fields={departmentFields}
            columns={departmentColumns}
            canCreate={false}
            canArchive={false}
            orderBy="name"
            orderDirection="asc"
            emptyMessage="Кафедры пока не созданы. Создай их в разделе «Университет → Учебная структура»."
            onAfterMutation={loadRelationOptions}
          />
        </TabsContent>

        <TabsContent value="groups">
          <AdminCrudEntityPanel
            entity="student_groups"
            title="Кураторы групп"
            description="Назначение куратора для каждой учебной группы."
            createButtonLabel="Добавить группу"
            fields={groupFields}
            columns={groupColumns}
            canCreate={false}
            canArchive={false}
            orderBy="name"
            orderDirection="asc"
            emptyMessage="Учебные группы пока не созданы. Создай их в разделе «Университет → Учебная структура»."
            onAfterMutation={loadRelationOptions}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function createFacultyRequiredStaffFields(
  employeeOptions: AdminCrudSelectOption[]
): AdminCrudFieldConfig[] {
  return [
    {
      key: 'dean_employee_id',
      label: 'Декан',
      placeholder:
        employeeOptions.length > 0 ? 'Выбери декана' : 'Сначала добавь сотрудников',
      type: 'select',
      valueType: 'number',
      options: employeeOptions
    },
    {
      key: 'deputy_dean_employee_id',
      label: 'Заместитель декана',
      placeholder:
        employeeOptions.length > 0 ? 'Выбери заместителя декана' : 'Сначала добавь сотрудников',
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
      placeholder:
        teacherOptions.length > 0 ? 'Выбери преподавателя' : 'Сначала добавь преподавателей',
      type: 'select',
      valueType: 'number',
      options: teacherOptions
    },
    {
      key: 'deputy_head_teacher_id',
      label: 'Заместитель заведующего',
      placeholder:
        teacherOptions.length > 0 ? 'Выбери преподавателя' : 'Сначала добавь преподавателей',
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
      placeholder:
        teacherOptions.length > 0 ? 'Выбери куратора' : 'Сначала добавь преподавателей',
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

function createPersonOptions(items: AdminCrudRecord[]): AdminCrudSelectOption[] {
  return items.map((item) => ({
    value: String(item.id),
    label: getPersonName(item)
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