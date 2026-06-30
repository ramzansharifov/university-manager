import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AdminCrudSelectOption } from '../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../features/admin-crud'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui'
import {
    audienceTypeColumns,
    audienceTypeFields,
    buildingColumns,
    buildingFields,
    createAudienceColumns,
    createAudienceFields,
    createDisciplineOptions,
    createLessonPeriodOptions,
    createOptions,
    createOptionsMap,
    createScheduleItemColumns,
    createScheduleItemFields,
    createStringOptionsMap,
    createWeekTypeMap,
    dayOfWeekOptions,
    getPersonName,
    getRecordName,
    getSemesterName,
    lessonPeriodColumns,
    lessonPeriodFields
} from './config/scheduleCrudConfig'

export function SchedulePage() {
    const [audienceTypeOptions, setAudienceTypeOptions] = useState<AdminCrudSelectOption[]>([])
    const [buildingOptions, setBuildingOptions] = useState<AdminCrudSelectOption[]>([])

    const [semesterOptions, setSemesterOptions] = useState<AdminCrudSelectOption[]>([])
    const [lessonPeriodOptions, setLessonPeriodOptions] = useState<AdminCrudSelectOption[]>([])
    const [groupOptions, setGroupOptions] = useState<AdminCrudSelectOption[]>([])
    const [disciplineOptions, setDisciplineOptions] = useState<AdminCrudSelectOption[]>([])
    const [teacherOptions, setTeacherOptions] = useState<AdminCrudSelectOption[]>([])
    const [audienceOptions, setAudienceOptions] = useState<AdminCrudSelectOption[]>([])
    const [lessonTypeOptions, setLessonTypeOptions] = useState<AdminCrudSelectOption[]>([])

    const loadOptions = useCallback(async () => {
        const [
            audienceTypes,
            buildings,
            semesters,
            lessonPeriods,
            groups,
            subjects,
            disciplines,
            teachers,
            audiences,
            lessonTypes
        ] = await Promise.all([
            window.api.adminCrud.list({
                entity: 'audience_types',
                page: 1,
                pageSize: 100,
                orderBy: 'name',
                orderDirection: 'asc'
            }),
            window.api.adminCrud.list({
                entity: 'buildings',
                page: 1,
                pageSize: 100,
                orderBy: 'name',
                orderDirection: 'asc'
            }),
            window.api.adminCrud.list({
                entity: 'semesters',
                page: 1,
                pageSize: 100,
                orderBy: 'number',
                orderDirection: 'asc'
            }),
            window.api.adminCrud.list({
                entity: 'lesson_periods',
                page: 1,
                pageSize: 100,
                orderBy: 'number',
                orderDirection: 'asc'
            }),
            window.api.adminCrud.list({
                entity: 'student_groups',
                page: 1,
                pageSize: 100,
                orderBy: 'name',
                orderDirection: 'asc'
            }),
            window.api.adminCrud.list({
                entity: 'subjects',
                page: 1,
                pageSize: 100,
                orderBy: 'name',
                orderDirection: 'asc'
            }),
            window.api.adminCrud.list({
                entity: 'disciplines',
                page: 1,
                pageSize: 500,
                orderBy: 'id',
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
                entity: 'audiences',
                page: 1,
                pageSize: 100,
                orderBy: 'name',
                orderDirection: 'asc'
            }),
            window.api.adminCrud.list({
                entity: 'dictionary_items',
                page: 1,
                pageSize: 100,
                filters: { dictionary_key: 'lesson_types' },
                orderBy: 'sort_order',
                orderDirection: 'asc'
            })
        ])

        const nextAudienceTypeOptions = createOptions(audienceTypes.items, getRecordName)
        const nextBuildingOptions = createOptions(buildings.items, getRecordName)
        const nextSemesterOptions = createOptions(semesters.items, getSemesterName)
        const nextLessonPeriodOptions = createLessonPeriodOptions(lessonPeriods.items)
        const nextGroupOptions = createOptions(groups.items, getRecordName)
        const nextSubjectOptions = createOptions(subjects.items, getRecordName)
        const nextTeacherOptions = createOptions(teachers.items, getPersonName)
        const nextAudienceOptions = createOptions(audiences.items, getRecordName)
        const nextLessonTypeOptions = createOptions(lessonTypes.items, getRecordName)

        setAudienceTypeOptions(nextAudienceTypeOptions)
        setBuildingOptions(nextBuildingOptions)
        setSemesterOptions(nextSemesterOptions)
        setLessonPeriodOptions(nextLessonPeriodOptions)
        setGroupOptions(nextGroupOptions)
        setTeacherOptions(nextTeacherOptions)
        setAudienceOptions(nextAudienceOptions)
        setLessonTypeOptions(nextLessonTypeOptions)

        setDisciplineOptions(
            createDisciplineOptions(disciplines.items, {
                subjectNameById: createOptionsMap(nextSubjectOptions),
                groupNameById: createOptionsMap(nextGroupOptions)
            })
        )
    }, [])

    useEffect(() => {
        void loadOptions()
    }, [loadOptions])

    const audienceTypeNameById = useMemo(
        () => createOptionsMap(audienceTypeOptions),
        [audienceTypeOptions]
    )

    const buildingNameById = useMemo(() => createOptionsMap(buildingOptions), [buildingOptions])
    const semesterNameById = useMemo(() => createOptionsMap(semesterOptions), [semesterOptions])
    const lessonPeriodNameById = useMemo(
        () => createOptionsMap(lessonPeriodOptions),
        [lessonPeriodOptions]
    )
    const groupNameById = useMemo(() => createOptionsMap(groupOptions), [groupOptions])
    const disciplineNameById = useMemo(
        () => createOptionsMap(disciplineOptions),
        [disciplineOptions]
    )
    const teacherNameById = useMemo(() => createOptionsMap(teacherOptions), [teacherOptions])
    const audienceNameById = useMemo(() => createOptionsMap(audienceOptions), [audienceOptions])
    const lessonTypeNameById = useMemo(
        () => createOptionsMap(lessonTypeOptions),
        [lessonTypeOptions]
    )
    const dayOfWeekNameById = useMemo(() => createOptionsMap(dayOfWeekOptions), [])
    const weekTypeNameByValue = useMemo(() => createWeekTypeMap(), [])

    const audienceFields = useMemo(
        () =>
            createAudienceFields({
                audienceTypeOptions,
                buildingOptions
            }),
        [audienceTypeOptions, buildingOptions]
    )

    const audienceColumns = useMemo(
        () =>
            createAudienceColumns({
                audienceTypeNameById,
                buildingNameById
            }),
        [audienceTypeNameById, buildingNameById]
    )

    const scheduleItemFields = useMemo(
        () =>
            createScheduleItemFields({
                semesterOptions,
                lessonPeriodOptions,
                groupOptions,
                disciplineOptions,
                teacherOptions,
                audienceOptions,
                lessonTypeOptions
            }),
        [
            audienceOptions,
            disciplineOptions,
            groupOptions,
            lessonPeriodOptions,
            lessonTypeOptions,
            semesterOptions,
            teacherOptions
        ]
    )

    const scheduleItemColumns = useMemo(
        () =>
            createScheduleItemColumns({
                semesterNameById,
                lessonPeriodNameById,
                groupNameById,
                disciplineNameById,
                teacherNameById,
                audienceNameById,
                lessonTypeNameById,
                dayOfWeekNameById,
                weekTypeNameByValue
            }),
        [
            audienceNameById,
            dayOfWeekNameById,
            disciplineNameById,
            groupNameById,
            lessonPeriodNameById,
            lessonTypeNameById,
            semesterNameById,
            teacherNameById,
            weekTypeNameByValue
        ]
    )

    return (
        <div className="grid gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Расписание</h1>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Типы аудиторий, корпуса, аудитории, учебные пары и расписание занятий.
                </p>
            </div>

            <Tabs defaultValue="audience-types">
                <TabsList>
                    <TabsTrigger value="audience-types">Типы аудиторий</TabsTrigger>
                    <TabsTrigger value="buildings">Корпуса</TabsTrigger>
                    <TabsTrigger value="audiences">Аудитории</TabsTrigger>
                    <TabsTrigger value="periods">Пары</TabsTrigger>
                    <TabsTrigger value="schedule">Расписание занятий</TabsTrigger>
                </TabsList>

                <TabsContent value="audience-types">
                    <AdminCrudEntityPanel
                        entity="audience_types"
                        title="Типы аудиторий"
                        description="Конструктор типов аудиторий: лекционная, семинарская, лаборатория, стадион и другие."
                        createButtonLabel="Добавить тип"
                        fields={audienceTypeFields}
                        columns={audienceTypeColumns}
                        emptyMessage="Типы аудиторий пока не созданы."
                        onAfterMutation={loadOptions}
                    />
                </TabsContent>

                <TabsContent value="buildings">
                    <AdminCrudEntityPanel
                        entity="buildings"
                        title="Корпуса"
                        description="Справочник корпусов. Указывать корпус у аудитории необязательно."
                        createButtonLabel="Добавить корпус"
                        fields={buildingFields}
                        columns={buildingColumns}
                        emptyMessage="Корпуса пока не созданы."
                        onAfterMutation={loadOptions}
                    />
                </TabsContent>

                <TabsContent value="audiences">
                    <AdminCrudEntityPanel
                        entity="audiences"
                        title="Аудитории"
                        description="Аудитории, помещения и площадки. Этаж определяется автоматически по первой цифре номера."
                        createButtonLabel="Добавить аудиторию"
                        fields={audienceFields}
                        columns={audienceColumns}
                        emptyMessage="Аудитории пока не созданы."
                        onAfterMutation={loadOptions}
                    />
                </TabsContent>

                <TabsContent value="periods">
                    <AdminCrudEntityPanel
                        entity="lesson_periods"
                        title="Пары"
                        description="Правила времени пар. Укажи начало пары и, при необходимости, длительность. Номер пары система рассчитает автоматически по времени."
                        createButtonLabel="Добавить пару"
                        fields={lessonPeriodFields}
                        columns={lessonPeriodColumns}
                        emptyMessage="Учебные пары пока не созданы."
                        orderBy="number"
                        orderDirection="asc"
                    />
                </TabsContent>

                <TabsContent value="schedule">
                    <AdminCrudEntityPanel
                        entity="schedule_items"
                        title="Расписание занятий"
                        description="Создание занятий по семестру, дню недели, паре, группе, дисциплине, преподавателю и аудитории."
                        createButtonLabel="Добавить занятие"
                        fields={scheduleItemFields}
                        columns={scheduleItemColumns}
                        emptyMessage="Занятия в расписании пока не созданы."
                        orderBy="day_of_week"
                        orderDirection="asc"
                        onAfterMutation={loadOptions}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}