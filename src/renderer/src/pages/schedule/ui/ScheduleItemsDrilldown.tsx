import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiSearch } from 'react-icons/fi'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
import { Badge, Button, Card, CardContent, Input } from '../../../shared/ui'
import {
    createLessonPeriodOptions,
    createNestedScheduleItemColumns,
    createNestedScheduleItemFields,
    createOptions,
    createOptionsMap,
    createWeekTypeMap,
    dayOfWeekOptions,
    facultySelectorColumns,
    getPersonName,
    getRecordName,
    getSemesterName,
    scheduleGroupColumns
} from '../config/scheduleCrudConfig'

export function ScheduleItemsDrilldown() {
    const [selectedFaculty, setSelectedFaculty] = useState<AdminCrudRecord | null>(null)
    const [selectedSubject, setSelectedSubject] = useState<AdminCrudRecord | null>(null)
    const [selectedGroup, setSelectedGroup] = useState<AdminCrudRecord | null>(null)

    const [specialties, setSpecialties] = useState<AdminCrudRecord[]>([])
    const [groups, setGroups] = useState<AdminCrudRecord[]>([])
    const [subjects, setSubjects] = useState<AdminCrudRecord[]>([])
    const [disciplines, setDisciplines] = useState<AdminCrudRecord[]>([])

    const [semesterOptions, setSemesterOptions] = useState<AdminCrudSelectOption[]>([])
    const [lessonPeriodOptions, setLessonPeriodOptions] = useState<AdminCrudSelectOption[]>([])
    const [teacherOptions, setTeacherOptions] = useState<AdminCrudSelectOption[]>([])
    const [audienceOptions, setAudienceOptions] = useState<AdminCrudSelectOption[]>([])
    const [lessonTypeOptions, setLessonTypeOptions] = useState<AdminCrudSelectOption[]>([])

    const loadOptions = useCallback(async () => {
        const [
            specialtiesResult,
            groupsResult,
            subjectsResult,
            disciplinesResult,
            semestersResult,
            lessonPeriodsResult,
            teachersResult,
            audiencesResult,
            lessonTypesResult
        ] = await Promise.all([
            window.api.adminCrud.list({
                entity: 'specialties',
                page: 1,
                pageSize: 500,
                orderBy: 'name',
                orderDirection: 'asc'
            }),
            window.api.adminCrud.list({
                entity: 'student_groups',
                page: 1,
                pageSize: 500,
                orderBy: 'name',
                orderDirection: 'asc'
            }),
            window.api.adminCrud.list({
                entity: 'subjects',
                page: 1,
                pageSize: 500,
                orderBy: 'name',
                orderDirection: 'asc'
            }),
            window.api.adminCrud.list({
                entity: 'disciplines',
                page: 1,
                pageSize: 1000,
                orderBy: 'id',
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
                entity: 'teachers',
                page: 1,
                pageSize: 300,
                orderBy: 'last_name',
                orderDirection: 'asc'
            }),
            window.api.adminCrud.list({
                entity: 'audiences',
                page: 1,
                pageSize: 300,
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

        setSpecialties(specialtiesResult.items)
        setGroups(groupsResult.items)
        setSubjects(subjectsResult.items)
        setDisciplines(disciplinesResult.items)

        setSemesterOptions(createOptions(semestersResult.items, getSemesterName))
        setLessonPeriodOptions(createLessonPeriodOptions(lessonPeriodsResult.items))
        setTeacherOptions(createOptions(teachersResult.items, getPersonName))
        setAudienceOptions(createOptions(audiencesResult.items, getRecordName))
        setLessonTypeOptions(createOptions(lessonTypesResult.items, getRecordName))
    }, [])

    useEffect(() => {
        void loadOptions()
    }, [loadOptions])

    const facultySpecialtyIds = useMemo(() => {
        if (!selectedFaculty?.id) {
            return new Set<number>()
        }

        return new Set(
            specialties
                .filter((specialty) => Number(specialty.faculty_id) === Number(selectedFaculty.id))
                .map((specialty) => Number(specialty.id))
        )
    }, [selectedFaculty, specialties])

    const facultyGroups = useMemo(() => {
        if (!selectedFaculty) {
            return []
        }

        return groups.filter((group) => facultySpecialtyIds.has(Number(group.specialty_id)))
    }, [facultySpecialtyIds, groups, selectedFaculty])

    const facultyGroupIds = useMemo(
        () => new Set(facultyGroups.map((group) => Number(group.id))),
        [facultyGroups]
    )

    const facultyDisciplines = useMemo(() => {
        if (!selectedFaculty) {
            return []
        }

        return disciplines.filter((discipline) => facultyGroupIds.has(Number(discipline.group_id)))
    }, [disciplines, facultyGroupIds, selectedFaculty])

    const facultySubjects = useMemo(() => {
        const subjectIds = new Set(facultyDisciplines.map((discipline) => Number(discipline.subject_id)))

        return subjects.filter((subject) => subjectIds.has(Number(subject.id)))
    }, [facultyDisciplines, subjects])

    const groupsBySelectedSubject = useMemo(() => {
        if (!selectedSubject) {
            return []
        }

        const groupIds = new Set(
            facultyDisciplines
                .filter((discipline) => Number(discipline.subject_id) === Number(selectedSubject.id))
                .map((discipline) => Number(discipline.group_id))
        )

        return facultyGroups.filter((group) => groupIds.has(Number(group.id)))
    }, [facultyDisciplines, facultyGroups, selectedSubject])

    const selectedDiscipline = useMemo(() => {
        if (!selectedSubject || !selectedGroup) {
            return null
        }

        return (
            facultyDisciplines.find(
                (discipline) =>
                    Number(discipline.subject_id) === Number(selectedSubject.id) &&
                    Number(discipline.group_id) === Number(selectedGroup.id)
            ) ?? null
        )
    }, [facultyDisciplines, selectedGroup, selectedSubject])

    const semesterNameById = useMemo(() => createOptionsMap(semesterOptions), [semesterOptions])
    const lessonPeriodNameById = useMemo(
        () => createOptionsMap(lessonPeriodOptions),
        [lessonPeriodOptions]
    )
    const teacherNameById = useMemo(() => createOptionsMap(teacherOptions), [teacherOptions])
    const audienceNameById = useMemo(() => createOptionsMap(audienceOptions), [audienceOptions])
    const lessonTypeNameById = useMemo(
        () => createOptionsMap(lessonTypeOptions),
        [lessonTypeOptions]
    )
    const dayOfWeekNameById = useMemo(() => createOptionsMap(dayOfWeekOptions), [])
    const weekTypeNameByValue = useMemo(() => createWeekTypeMap(), [])

    const scheduleItemFields = useMemo(
        () =>
            createNestedScheduleItemFields({
                semesterOptions,
                lessonPeriodOptions,
                groupOptions: [],
                disciplineOptions: [],
                teacherOptions,
                audienceOptions,
                lessonTypeOptions
            }),
        [audienceOptions, lessonPeriodOptions, lessonTypeOptions, semesterOptions, teacherOptions]
    )

    const scheduleItemColumns = useMemo(
        () =>
            createNestedScheduleItemColumns({
                semesterNameById,
                lessonPeriodNameById,
                groupNameById: new Map(),
                disciplineNameById: new Map(),
                teacherNameById,
                audienceNameById,
                lessonTypeNameById,
                dayOfWeekNameById,
                weekTypeNameByValue
            }),
        [
            audienceNameById,
            dayOfWeekNameById,
            lessonPeriodNameById,
            lessonTypeNameById,
            semesterNameById,
            teacherNameById,
            weekTypeNameByValue
        ]
    )

    const scheduleFilters = useMemo(
        () =>
            selectedDiscipline && selectedGroup
                ? {
                    group_id: Number(selectedGroup.id),
                    discipline_id: Number(selectedDiscipline.id)
                }
                : undefined,
        [selectedDiscipline, selectedGroup]
    )

    const scheduleFixedData = useMemo(
        () =>
            selectedDiscipline && selectedGroup
                ? {
                    group_id: Number(selectedGroup.id),
                    discipline_id: Number(selectedDiscipline.id),
                    teacher_id: Number(selectedDiscipline.teacher_id),
                    semester_id: Number(selectedDiscipline.semester_id)
                }
                : undefined,
        [selectedDiscipline, selectedGroup]
    )

    function openFaculty(record: AdminCrudRecord) {
        setSelectedFaculty(record)
        setSelectedSubject(null)
        setSelectedGroup(null)
    }

    function openSubject(record: AdminCrudRecord) {
        setSelectedSubject(record)
        setSelectedGroup(null)
    }

    function openGroup(record: AdminCrudRecord) {
        setSelectedGroup(record)
    }

    function backToFaculties() {
        setSelectedFaculty(null)
        setSelectedSubject(null)
        setSelectedGroup(null)
    }

    function backToSubjects() {
        setSelectedSubject(null)
        setSelectedGroup(null)
    }

    function backToGroups() {
        setSelectedGroup(null)
    }

    return (
        <div className="grid gap-4">
            <ScheduleBreadcrumb
                faculty={selectedFaculty}
                subject={selectedSubject}
                group={selectedGroup}
                onFacultiesClick={backToFaculties}
                onSubjectsClick={selectedFaculty ? backToSubjects : undefined}
                onGroupsClick={selectedSubject ? backToGroups : undefined}
            />

            {!selectedFaculty ? (
                <AdminCrudEntityPanel
                    entity="faculties"
                    title="Факультеты"
                    description="Выбери факультет, чтобы открыть дисциплины и группы для расписания."
                    createButtonLabel="Добавить факультет"
                    fields={[]}
                    columns={facultySelectorColumns}
                    canCreate={false}
                    canEdit={false}
                    canArchive={false}
                    emptyMessage="Факультеты пока не созданы."
                    onRowClick={openFaculty}
                    extraRowActions={(record) => (
                        <Button
                            size="sm"
                            variant="primary"
                            title="Открыть дисциплины"
                            aria-label="Открыть дисциплины факультета"
                            onClick={() => openFaculty(record)}
                        >
                            <FiArrowRight />
                        </Button>
                    )}
                />
            ) : null}

            {selectedFaculty && !selectedSubject ? (
                <LocalSelectionTable
                    title={`Дисциплины: ${getRecordName(selectedFaculty)}`}
                    description="Выбери дисциплину, по которой нужно составить расписание."
                    items={facultySubjects}
                    columns={[
                        { key: 'name', label: 'Дисциплина' },
                        { key: 'description', label: 'Описание' }
                    ]}
                    emptyMessage="У групп этого факультета пока нет дисциплин."
                    onOpen={openSubject}
                />
            ) : null}

            {selectedFaculty && selectedSubject && !selectedGroup ? (
                <LocalSelectionTable
                    title={`Группы: ${getRecordName(selectedSubject)}`}
                    description="Выбери группу, внутри которой нужно создать расписание по выбранной дисциплине."
                    items={groupsBySelectedSubject}
                    columns={scheduleGroupColumns}
                    emptyMessage="Для выбранной дисциплины пока нет групп."
                    onOpen={openGroup}
                />
            ) : null}

            {selectedFaculty && selectedSubject && selectedGroup && selectedDiscipline ? (
                <AdminCrudEntityPanel
                    entity="schedule_items"
                    title={`Расписание: ${getRecordName(selectedGroup)} / ${getRecordName(selectedSubject)}`}
                    description="Создание занятий для выбранной группы и дисциплины. Семестр и преподаватель берутся из дисциплины автоматически."
                    createButtonLabel="Добавить занятие"
                    fields={scheduleItemFields}
                    columns={scheduleItemColumns}
                    filters={scheduleFilters}
                    fixedData={scheduleFixedData}
                    emptyMessage="Для этой группы и дисциплины расписание пока не создано."
                    orderBy="day_of_week"
                    orderDirection="asc"
                    onAfterMutation={loadOptions}
                />
            ) : null}

            {selectedFaculty && selectedSubject && selectedGroup && !selectedDiscipline ? (
                <Card>
                    <CardContent>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Для выбранной группы не найдена дисциплина. Вернись назад и выбери другую группу.
                        </p>
                    </CardContent>
                </Card>
            ) : null}
        </div>
    )
}

function ScheduleBreadcrumb({
    faculty,
    subject,
    group,
    onFacultiesClick,
    onSubjectsClick,
    onGroupsClick
}: {
    faculty: AdminCrudRecord | null
    subject: AdminCrudRecord | null
    group: AdminCrudRecord | null
    onFacultiesClick: () => void
    onSubjectsClick?: () => void
    onGroupsClick?: () => void
}) {
    return (
        <Card>
            <CardContent className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant={faculty ? 'secondary' : 'primary'} onClick={onFacultiesClick}>
                    Факультеты
                </Button>

                {faculty ? (
                    <>
                        <span className="text-sm text-[var(--color-text-muted)]">/</span>
                        <Button size="sm" variant={subject ? 'secondary' : 'primary'} onClick={onSubjectsClick}>
                            Дисциплины
                        </Button>
                        <Badge>{getRecordName(faculty)}</Badge>
                    </>
                ) : null}

                {subject ? (
                    <>
                        <span className="text-sm text-[var(--color-text-muted)]">/</span>
                        <Button size="sm" variant={group ? 'secondary' : 'primary'} onClick={onGroupsClick}>
                            Группы
                        </Button>
                        <Badge>{getRecordName(subject)}</Badge>
                    </>
                ) : null}

                {group ? (
                    <>
                        <span className="text-sm text-[var(--color-text-muted)]">/</span>
                        <Badge>{getRecordName(group)}</Badge>
                    </>
                ) : null}
            </CardContent>
        </Card>
    )
}

function LocalSelectionTable({
    title,
    description,
    items,
    columns,
    emptyMessage,
    onOpen
}: {
    title: string
    description: string
    items: AdminCrudRecord[]
    columns: { key: string; label: string }[]
    emptyMessage: string
    onOpen: (record: AdminCrudRecord) => void
}) {
    const [search, setSearch] = useState('')

    const filteredItems = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase()

        if (!normalizedSearch) {
            return items
        }

        return items.filter((item) =>
            columns.some((column) =>
                String(item[column.key] ?? '')
                    .toLowerCase()
                    .includes(normalizedSearch)
            )
        )
    }, [columns, items, search])

    return (
        <Card>
            <CardContent>
                <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--color-text)]">{title}</h3>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
                    </div>

                    <div className="relative w-full xl:max-w-sm">
                        <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <Input
                            className="pl-9"
                            value={search}
                            placeholder="Поиск..."
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                </div>

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
                                <th className="w-32 border-b border-[var(--color-border)] px-4 py-3 text-right font-semibold text-[var(--color-text-muted)]">
                                    Действия
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredItems.map((item) => (
                                <tr
                                    key={String(item.id)}
                                    className="cursor-pointer border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-muted)]"
                                    onClick={() => onOpen(item)}
                                >
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-4 py-3 text-[var(--color-text)]">
                                            {formatCellValue(item[column.key])}
                                        </td>
                                    ))}

                                    <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                                        <div className="flex justify-end">
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                title="Открыть"
                                                aria-label="Открыть"
                                                onClick={() => onOpen(item)}
                                            >
                                                <FiArrowRight />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length + 1}
                                        className="px-4 py-8 text-center text-[var(--color-text-muted)]"
                                    >
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>

                <div className="mt-3 flex justify-start">
                    <Badge variant="muted">Всего: {filteredItems.length}</Badge>
                </div>
            </CardContent>
        </Card>
    )
}

function formatCellValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
        return '—'
    }

    return String(value)
}