import { useMemo, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
import { Badge, Button, Card, CardContent } from '../../../shared/ui'
import {
    createOptionsMap,
    createStudentColumns,
    createStudentFields,
    groupColumns
} from '../config/peopleCrudConfig'
import { getRecordName } from '../lib/getRecordName'

interface StudentsByGroupPanelProps {
    studentStatusOptions: AdminCrudSelectOption[]
}

export function StudentsByGroupPanel({ studentStatusOptions }: StudentsByGroupPanelProps) {
    const [selectedGroup, setSelectedGroup] = useState<AdminCrudRecord | null>(null)

    const studentFilters = useMemo(
        () => (selectedGroup ? { group_id: Number(selectedGroup.id) } : undefined),
        [selectedGroup]
    )

    const studentFixedData = useMemo(
        () => (selectedGroup ? { group_id: Number(selectedGroup.id) } : undefined),
        [selectedGroup]
    )

    const studentStatusNameById = useMemo(
        () => createOptionsMap(studentStatusOptions),
        [studentStatusOptions]
    )

    const studentFields = useMemo(
        () =>
            createStudentFields({
                studentStatusOptions,
                teacherStatusOptions: [],
                employeeStatusOptions: [],
                departmentOptions: [],
                divisionOptions: [],
                positionOptions: []
            }),
        [studentStatusOptions]
    )

    const studentColumns = useMemo(
        () =>
            createStudentColumns({
                studentStatusNameById,
                teacherStatusNameById: new Map(),
                employeeStatusNameById: new Map(),
                departmentNameById: new Map(),
                divisionNameById: new Map(),
                positionNameById: new Map()
            }),
        [studentStatusNameById]
    )

    function openGroup(record: AdminCrudRecord) {
        setSelectedGroup(record)
    }

    function backToGroups() {
        setSelectedGroup(null)
    }

    return (
        <div className="grid gap-4">
            <StudentsBreadcrumb selectedGroup={selectedGroup} onGroupsClick={backToGroups} />

            {!selectedGroup ? (
                <AdminCrudEntityPanel
                    entity="student_groups"
                    title="Группы"
                    description="Выбери учебную группу, чтобы открыть список её студентов."
                    createButtonLabel="Добавить группу"
                    fields={[]}
                    columns={groupColumns}
                    canCreate={false}
                    canEdit={false}
                    canArchive={false}
                    emptyMessage="Учебные группы пока не созданы. Создай их в разделе «Университет → Учебная структура»."
                    onRowClick={openGroup}
                    extraRowActions={(record) => (
                        <Button size="sm" variant="primary" onClick={() => openGroup(record)}>
                            Открыть
                            <FiArrowRight />
                        </Button>
                    )}
                />
            ) : null}

            {selectedGroup ? (
                <AdminCrudEntityPanel
                    entity="students"
                    title={`Студенты: ${getRecordName(selectedGroup)}`}
                    description="Список студентов выбранной учебной группы."
                    createButtonLabel="Добавить студента"
                    fields={studentFields}
                    columns={studentColumns}
                    filters={studentFilters}
                    fixedData={studentFixedData}
                    emptyMessage="В этой группе пока нет студентов."
                />
            ) : null}
        </div>
    )
}

function StudentsBreadcrumb({
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