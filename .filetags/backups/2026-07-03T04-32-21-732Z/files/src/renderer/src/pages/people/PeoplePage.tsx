import { useCallback, useEffect, useState } from 'react'
import type { AdminCrudSelectOption } from '../../features/admin-crud'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui'
import { createOptions, createPositionOptions, getRecordName } from './config/peopleCrudConfig'
import { EmployeesByDivisionPanel } from './ui/EmployeesByDivisionPanel'
import { StudentsByGroupPanel } from './ui/StudentsByGroupPanel'
import { TeachersByDepartmentPanel } from './ui/TeachersByDepartmentPanel'

export function PeoplePage() {
  const [studentStatusOptions, setStudentStatusOptions] = useState<AdminCrudSelectOption[]>([])
  const [teacherStatusOptions, setTeacherStatusOptions] = useState<AdminCrudSelectOption[]>([])
  const [employeeStatusOptions, setEmployeeStatusOptions] = useState<AdminCrudSelectOption[]>([])
  const [positionOptions, setPositionOptions] = useState<AdminCrudSelectOption[]>([])

  const loadOptions = useCallback(async () => {
    const [studentStatuses, teacherStatuses, employeeStatuses, positions] = await Promise.all([
      window.api.adminCrud.list({
        entity: 'dictionary_items',
        page: 1,
        pageSize: 100,
        filters: { dictionary_key: 'student_statuses' },
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
        entity: 'positions',
        page: 1,
        pageSize: 100,
        orderBy: 'name',
        orderDirection: 'asc'
      })
    ])

    setStudentStatusOptions(createOptions(studentStatuses.items, getRecordName))
    setTeacherStatusOptions(createOptions(teacherStatuses.items, getRecordName))
    setEmployeeStatusOptions(createOptions(employeeStatuses.items, getRecordName))
    setPositionOptions(createPositionOptions(positions.items))
  }, [])

  useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Люди</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Студенты, преподаватели и сотрудники университета.
        </p>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Студенты</TabsTrigger>
          <TabsTrigger value="teachers">Преподаватели</TabsTrigger>
          <TabsTrigger value="employees">Сотрудники</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <StudentsByGroupPanel studentStatusOptions={studentStatusOptions} />
        </TabsContent>

        <TabsContent value="teachers">
          <TeachersByDepartmentPanel teacherStatusOptions={teacherStatusOptions} />
        </TabsContent>

        <TabsContent value="employees">
          <EmployeesByDivisionPanel
            employeeStatusOptions={employeeStatusOptions}
            positionOptions={positionOptions}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
