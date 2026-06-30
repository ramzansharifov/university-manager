import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AdminCrudSelectOption } from '../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../features/admin-crud'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui'
import {
  academicYearColumns,
  academicYearFields,
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

  const loadOptions = useCallback(async () => {
    const departments = await window.api.adminCrud.list({
      entity: 'departments',
      page: 1,
      pageSize: 100,
      orderBy: 'name',
      orderDirection: 'asc'
    })

    setDepartmentOptions(createOptions(departments.items, getRecordName))
  }, [])

  useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  const departmentNameById = useMemo(() => createOptionsMap(departmentOptions), [departmentOptions])

  const subjectFields = useMemo(() => createSubjectFields(departmentOptions), [departmentOptions])

  const subjectColumns = useMemo(
    () =>
      createSubjectColumns({
        departmentNameById
      }),
    [departmentNameById]
  )

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Учебный процесс</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Предметы, учебные планы, пункты учебного плана и дисциплины групп.
        </p>
      </div>

      <Tabs defaultValue="subjects">
        <TabsList>
          <TabsTrigger value="subjects">Предметы</TabsTrigger>
          <TabsTrigger value="years">Учебные годы</TabsTrigger>
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
            description="Создай учебный год, чтобы затем использовать его в учебных планах."
            createButtonLabel="Добавить учебный год"
            fields={academicYearFields}
            columns={academicYearColumns}
            emptyMessage="Учебные годы пока не созданы."
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
