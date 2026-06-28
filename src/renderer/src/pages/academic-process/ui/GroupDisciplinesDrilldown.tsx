import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
import { Badge, Button, Card, CardContent } from '../../../shared/ui'
import {
    createCurriculumItemOptions,
    createDisciplineColumns,
    createDisciplineFields,
    createOptions,
    createOptionsMap,
    getPersonName,
    getRecordName,
    getSemesterName,
    groupSelectorColumns
} from '../config/academicProcessCrudConfig'

export function GroupDisciplinesDrilldown() {
    const [selectedGroup, setSelectedGroup] = useState<AdminCrudRecord | null>(null)

    const [subjectOptions, setSubjectOptions] = useState<AdminCrudSelectOption[]>([])
    const [teacherOptions, setTeacherOptions] = useState<AdminCrudSelectOption[]>([])
    const [semesterOptions, setSemesterOptions] = useState<AdminCrudSelectOption[]>([])
    const [curriculumItemOptions, setCurriculumItemOptions] = useState<AdminCrudSelectOption[]>([])

    const loadOptions = useCallback(async () => {
        const [subjects, teachers, semesters, curriculumItems] = await Promise.all([
            window.api.adminCrud.list({
                entity: 'subjects',
                page: 1,
                pageSize: 100,
                orderBy: 'name',
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
                entity: 'semesters',
                page: 1,
                pageSize: 100,
                orderBy: 'number',
                orderDirection: 'asc'
            }),
            window.api.adminCrud.list({
                entity: 'curriculum_items',
                page: 1,
                pageSize: 100,
                orderBy: 'id',
                orderDirection: 'desc'
            })
        ])

        const nextSubjectOptions = createOptions(subjects.items, getRecordName)
        const nextSemesterOptions = createOptions(semesters.items, getSemesterName)

        const subjectNameById = createOptionsMap(nextSubjectOptions)
        const semesterNameById = createOptionsMap(nextSemesterOptions)

        setSubjectOptions(nextSubjectOptions)
        setTeacherOptions(createOptions(teachers.items, getPersonName))
        setSemesterOptions(nextSemesterOptions)
        setCurriculumItemOptions(
            createCurriculumItemOptions(curriculumItems.items, {
                subjectNameById,
                semesterNameById
            })
        )
    }, [])

    useEffect(() => {
        void loadOptions()
    }, [loadOptions])

    const subjectNameById = useMemo(() => createOptionsMap(subjectOptions), [subjectOptions])
    const teacherNameById = useMemo(() => createOptionsMap(teacherOptions), [teacherOptions])
    const semesterNameById = useMemo(() => createOptionsMap(semesterOptions), [semesterOptions])
    const curriculumItemNameById = useMemo(
        () => createOptionsMap(curriculumItemOptions),
        [curriculumItemOptions]
    )

    const disciplineFields = useMemo(
        () =>
            createDisciplineFields({
                curriculumItemOptions,
                subjectOptions,
                teacherOptions,
                semesterOptions
            }),
        [curriculumItemOptions, semesterOptions, subjectOptions, teacherOptions]
    )

    const disciplineColumns = useMemo(
        () =>
            createDisciplineColumns({
                curriculumItemNameById,
                subjectNameById,
                teacherNameById,
                semesterNameById
            }),
        [curriculumItemNameById, semesterNameById, subjectNameById, teacherNameById]
    )

    const disciplineFilters = useMemo(
        () => (selectedGroup ? { group_id: Number(selectedGroup.id) } : undefined),
        [selectedGroup]
    )

    const disciplineFixedData = useMemo(
        () => (selectedGroup ? { group_id: Number(selectedGroup.id) } : undefined),
        [selectedGroup]
    )

    function openGroup(record: AdminCrudRecord) {
        setSelectedGroup(record)
    }

    function backToGroups() {
        setSelectedGroup(null)
    }

    return (
        <div className="grid gap-4">
            <GroupDisciplinesBreadcrumb selectedGroup={selectedGroup} onGroupsClick={backToGroups} />

            {!selectedGroup ? (
                <AdminCrudEntityPanel
                    entity="student_groups"
                    title="Группы"
                    description="Выбери группу, чтобы открыть список её дисциплин."
                    createButtonLabel="Добавить группу"
                    fields={[]}
                    columns={groupSelectorColumns}
                    canCreate={false}
                    canEdit={false}
                    canArchive={false}
                    emptyMessage="Группы пока не созданы. Создай их в разделе «Университет → Учебная структура»."
                    onRowClick={openGroup}
                    extraRowActions={(record) => (
                        <Button
                            size="sm"
                            variant="primary"
                            title="Открыть дисциплины"
                            aria-label="Открыть дисциплины группы"
                            onClick={() => openGroup(record)}
                        >
                            <FiArrowRight />
                        </Button>
                    )}
                />
            ) : null}

            {selectedGroup ? (
                <AdminCrudEntityPanel
                    entity="disciplines"
                    title={`Дисциплины: ${getRecordName(selectedGroup)}`}
                    description="Дисциплины выбранной группы. Они будут использоваться дальше в расписании."
                    createButtonLabel="Добавить дисциплину"
                    fields={disciplineFields}
                    columns={disciplineColumns}
                    filters={disciplineFilters}
                    fixedData={disciplineFixedData}
                    emptyMessage="У этой группы пока нет дисциплин."
                    onAfterMutation={loadOptions}
                />
            ) : null}
        </div>
    )
}

function GroupDisciplinesBreadcrumb({
    selectedGroup,
    onGroupsClick
}: {
    selectedGroup: AdminCrudRecord | null
    onGroupsClick: () => void
}) {
    return (
        <Card>
            <CardContent className="flex flex-wrap items-center gap-2">
                <Button
                    size="sm"
                    variant={selectedGroup ? 'secondary' : 'primary'}
                    onClick={onGroupsClick}
                >
                    Группы
                </Button>

                {selectedGroup ? (
                    <>
                        <span className="text-sm text-[var(--color-text-muted)]">/</span>
                        <Badge>{getRecordName(selectedGroup)}</Badge>
                    </>
                ) : null}
            </CardContent>
        </Card>
    )
}