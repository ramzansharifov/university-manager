import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AdminCrudSelectOption } from '../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../features/admin-crud'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui'
import {
    createEmployeeColumns,
    createEmployeeFields,
    createOptions,
    createOptionsMap,
    createTeacherColumns,
    createTeacherFields,
    getRecordName,
    positionColumns,
    positionFields
} from './config/peopleCrudConfig'
import { StudentsByGroupPanel } from './ui/StudentsByGroupPanel'

export function PeoplePage() {
    const [studentStatusOptions, setStudentStatusOptions] = useState<AdminCrudSelectOption[]>([])
    const [teacherStatusOptions, setTeacherStatusOptions] = useState<AdminCrudSelectOption[]>([])
    const [employeeStatusOptionsState, setEmployeeStatusOptionsState] = useState<AdminCrudSelectOption[]>([])
    const [departmentOptions, setDepartmentOptions] = useState<AdminCrudSelectOption[]>([])
    const [divisionOptions, setDivisionOptions] = useState<AdminCrudSelectOption[]>([])
    const [positionOptions, setPositionOptions] = useState<AdminCrudSelectOption[]>([])

    const loadOptions = useCallback(async () => {
        const [
            studentStatuses,
            teacherStatuses,
            employeeStatuses,
            departments,
            divisions,
            positions
        ] = await Promise.all([
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
                entity: 'departments',
                page: 1,
                pageSize: 100,
                orderBy: 'name',
                orderDirection: 'asc'
            }),
            window.api.adminCrud.list({
                entity: 'divisions',
                page: 1,
                pageSize: 100,
                orderBy: 'name',
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
        setEmployeeStatusOptionsState(createOptions(employeeStatuses.items, getRecordName))
        setDepartmentOptions(createOptions(departments.items, getRecordName))
        setDivisionOptions(createOptions(divisions.items, getRecordName))
        setPositionOptions(createOptions(positions.items, getRecordName))
    }, [])

    useEffect(() => {
        void loadOptions()
    }, [loadOptions])

    const fieldOptions = useMemo(
        () => ({
            studentStatusOptions,
            teacherStatusOptions,
            employeeStatusOptions: employeeStatusOptionsState,
            departmentOptions,
            divisionOptions,
            positionOptions
        }),
        [
            departmentOptions,
            divisionOptions,
            employeeStatusOptionsState,
            positionOptions,
            studentStatusOptions,
            teacherStatusOptions
        ]
    )

    const columnMaps = useMemo(
        () => ({
            studentStatusNameById: createOptionsMap(studentStatusOptions),
            teacherStatusNameById: createOptionsMap(teacherStatusOptions),
            employeeStatusNameById: createOptionsMap(employeeStatusOptionsState),
            departmentNameById: createOptionsMap(departmentOptions),
            divisionNameById: createOptionsMap(divisionOptions),
            positionNameById: createOptionsMap(positionOptions)
        }),
        [
            departmentOptions,
            divisionOptions,
            employeeStatusOptionsState,
            positionOptions,
            studentStatusOptions,
            teacherStatusOptions
        ]
    )

    const teacherFields = useMemo(() => createTeacherFields(fieldOptions), [fieldOptions])
    const teacherColumns = useMemo(() => createTeacherColumns(columnMaps), [columnMaps])

    const employeeFields = useMemo(() => createEmployeeFields(fieldOptions), [fieldOptions])
    const employeeColumns = useMemo(() => createEmployeeColumns(columnMaps), [columnMaps])

    return (
        <div className="grid gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Люди</h1>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Студенты, преподаватели, сотрудники и должности.
                </p>
            </div>

            <Tabs defaultValue="students">
                <TabsList>
                    <TabsTrigger value="students">Студенты</TabsTrigger>
                    <TabsTrigger value="teachers">Преподаватели</TabsTrigger>
                    <TabsTrigger value="employees">Сотрудники</TabsTrigger>
                    <TabsTrigger value="positions">Должности</TabsTrigger>
                </TabsList>

                <TabsContent value="students">
                    <StudentsByGroupPanel studentStatusOptions={studentStatusOptions} />
                </TabsContent>

                <TabsContent value="teachers">
                    <AdminCrudEntityPanel
                        entity="teachers"
                        title="Преподаватели"
                        description="Создание, редактирование, поиск и архивирование преподавателей."
                        createButtonLabel="Добавить преподавателя"
                        fields={teacherFields}
                        columns={teacherColumns}
                        onAfterMutation={loadOptions}
                    />
                </TabsContent>

                <TabsContent value="employees">
                    <AdminCrudEntityPanel
                        entity="employees"
                        title="Сотрудники"
                        description="Создание, редактирование, поиск и архивирование сотрудников университета."
                        createButtonLabel="Добавить сотрудника"
                        fields={employeeFields}
                        columns={employeeColumns}
                        onAfterMutation={loadOptions}
                    />
                </TabsContent>

                <TabsContent value="positions">
                    <AdminCrudEntityPanel
                        entity="positions"
                        title="Должности"
                        description="Справочник должностей для преподавателей и сотрудников."
                        createButtonLabel="Добавить должность"
                        fields={positionFields}
                        columns={positionColumns}
                        onAfterMutation={loadOptions}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}