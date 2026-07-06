import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../features/admin-crud'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui'
import {
  academicYearFields,
  createAcademicYearColumns,
  createSemesterByAcademicYearAndNumber,
  createAcademicVacationColumns,
  createAcademicVacationFields,
  createOptions,
  createOptionsMap,
  createSubjectColumns,
  createSubjectFields,
  getRecordName
} from './config/academicProcessCrudConfig'
import { CurriculumPlansDrilldown } from './ui/CurriculumPlansDrilldown'
import { GroupDisciplinesDrilldown } from './ui/GroupDisciplinesDrilldown'

export function AcademicProcessPage() {
  const [departmentOptions, setDepartmentOptions] = useState<AdminCrudSelectOption[]>([])
  const [academicYearOptions, setAcademicYearOptions] = useState<AdminCrudSelectOption[]>([])
  const [semesters, setSemesters] = useState<AdminCrudRecord[]>([])

  const loadOptions = useCallback(async () => {
    const [departments, academicYears, semestersResult] = await Promise.all([
      window.api.adminCrud.list({
        entity: 'departments',
        page: 1,
        pageSize: 100,
        orderBy: 'name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'academic_years',
        page: 1,
        pageSize: 100,
        orderBy: 'starts_at',
        orderDirection: 'desc'
      }),
      window.api.adminCrud.list({
        entity: 'semesters',
        page: 1,
        pageSize: 300,
        orderBy: 'academic_year_id',
        orderDirection: 'asc'
      })
    ])

    setDepartmentOptions(createOptions(departments.items, getRecordName))
    setAcademicYearOptions(createOptions(academicYears.items, getRecordName))
    setSemesters(semestersResult.items)
  }, [])

  useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  const departmentNameById = useMemo(() => createOptionsMap(departmentOptions), [departmentOptions])
  const academicYearNameById = useMemo(
    () => createOptionsMap(academicYearOptions),
    [academicYearOptions]
  )

  const semesterByAcademicYearAndNumber = useMemo(
    () => createSemesterByAcademicYearAndNumber(semesters),
    [semesters]
  )

  const academicYearColumns = useMemo(
    () =>
      createAcademicYearColumns({
        semesterByAcademicYearAndNumber
      }),
    [semesterByAcademicYearAndNumber]
  )
  const subjectFields = useMemo(() => createSubjectFields(departmentOptions), [departmentOptions])

  const subjectColumns = useMemo(
    () =>
      createSubjectColumns({
        departmentNameById
      }),
    [departmentNameById]
  )

  const vacationFields = useMemo(
    () => createAcademicVacationFields(academicYearOptions),
    [academicYearOptions]
  )

  const vacationColumns = useMemo(
    () =>
      createAcademicVacationColumns({
        academicYearNameById
      }),
    [academicYearNameById]
  )

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Учебный процесс</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Предметы, учебные годы, каникулы, учебные планы и дисциплины групп.
        </p>
      </div>

      <Tabs defaultValue="subjects">
        <TabsList>
          <TabsTrigger value="subjects">Предметы</TabsTrigger>
          <TabsTrigger value="years">Учебные годы</TabsTrigger>
          <TabsTrigger value="vacations">Каникулы</TabsTrigger>
          <TabsTrigger value="plans">Учебные планы</TabsTrigger>
          <TabsTrigger value="disciplines">Дисциплины групп</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects">
          <AdminCrudEntityPanel
            entity="subjects"
            title="Предметы"
            description="Справочник предметов университета. Предмет можно привязать к кафедре."
            createButtonLabel="Добавить предмет"
            fields={subjectFields}
            columns={subjectColumns}
            emptyMessage="Предметы пока не созданы."
            onAfterMutation={loadOptions}
          />
        </TabsContent>

        <TabsContent value="years">
          <AdminCrudEntityPanel
            entity="academic_years"
            title="Учебные годы"
            description="Укажи дату начала учебного года. Дата окончания и название будут рассчитаны автоматически."
            createButtonLabel="Добавить учебный год"
            fields={academicYearFields}
            columns={academicYearColumns}
            emptyMessage="Учебные годы пока не созданы."
            orderBy="starts_at"
            orderDirection="desc"
            onAfterMutation={loadOptions}
          />
        </TabsContent>

        <TabsContent value="vacations">
          <AdminCrudEntityPanel
            entity="academic_vacations"
            title="Каникулы"
            description="Укажи промежуточные и послекурсовые каникулы учебного года. По ним система пересчитает даты семестров и недели расписания."
            createButtonLabel="Добавить каникулы"
            fields={vacationFields}
            columns={vacationColumns}
            emptyMessage="Каникулы пока не созданы."
            orderBy="starts_at"
            orderDirection="asc"
            onAfterMutation={loadOptions}
          />
        </TabsContent>

        <TabsContent value="plans">
          <CurriculumPlansDrilldown />
        </TabsContent>

        <TabsContent value="disciplines">
          <GroupDisciplinesDrilldown />
        </TabsContent>
      </Tabs>
    </div>
  )
}
