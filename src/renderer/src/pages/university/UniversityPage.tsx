import { useMemo, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import type {
    AdminCrudColumnConfig,
    AdminCrudFieldConfig,
    AdminCrudRecord
} from '../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../features/admin-crud'
import {
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '../../shared/ui'

const organizationFields: AdminCrudFieldConfig[] = [
    {
        key: 'name',
        label: 'Название',
        placeholder: 'Например: Факультет информационных технологий',
        required: true
    },
    {
        key: 'short_name',
        label: 'Краткое название',
        placeholder: 'Например: ФИТ'
    },
    {
        key: 'description',
        label: 'Описание',
        placeholder: 'Дополнительная информация'
    }
]

const organizationColumns: AdminCrudColumnConfig[] = [
    {
        key: 'id',
        label: 'ID'
    },
    {
        key: 'name',
        label: 'Название'
    },
    {
        key: 'short_name',
        label: 'Краткое название'
    },
    {
        key: 'description',
        label: 'Описание'
    }
]

const departmentFields: AdminCrudFieldConfig[] = [
    {
        key: 'name',
        label: 'Название кафедры',
        placeholder: 'Например: Кафедра программной инженерии',
        required: true
    },
    {
        key: 'short_name',
        label: 'Краткое название',
        placeholder: 'Например: КПИ'
    },
    {
        key: 'description',
        label: 'Описание',
        placeholder: 'Дополнительная информация'
    }
]

const departmentColumns: AdminCrudColumnConfig[] = [
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
        label: 'Краткое название'
    },
    {
        key: 'description',
        label: 'Описание'
    }
]

const specialtyFields: AdminCrudFieldConfig[] = [
    {
        key: 'code',
        label: 'Код специальности',
        placeholder: 'Например: 09.03.04'
    },
    {
        key: 'name',
        label: 'Название специальности',
        placeholder: 'Например: Программная инженерия',
        required: true
    },
    {
        key: 'degree',
        label: 'Степень / уровень',
        placeholder: 'Например: Бакалавриат'
    },
    {
        key: 'description',
        label: 'Описание',
        placeholder: 'Дополнительная информация'
    }
]

const specialtyColumns: AdminCrudColumnConfig[] = [
    {
        key: 'id',
        label: 'ID'
    },
    {
        key: 'code',
        label: 'Код'
    },
    {
        key: 'name',
        label: 'Специальность'
    },
    {
        key: 'degree',
        label: 'Уровень'
    },
    {
        key: 'description',
        label: 'Описание'
    }
]

const groupFields: AdminCrudFieldConfig[] = [
    {
        key: 'name',
        label: 'Название группы',
        placeholder: 'Например: ПИ-21-1',
        required: true
    },
    {
        key: 'course',
        label: 'Курс',
        placeholder: 'Например: 2',
        type: 'number'
    },
    {
        key: 'description',
        label: 'Описание',
        placeholder: 'Дополнительная информация'
    }
]

const groupColumns: AdminCrudColumnConfig[] = [
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
        key: 'description',
        label: 'Описание'
    }
]

export function UniversityPage() {
    return (
        <div className="grid gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Университет</h1>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Структура университета: факультеты, кафедры, специальности, группы и подразделения.
                </p>
            </div>

            <Tabs defaultValue="structure">
                <TabsList>
                    <TabsTrigger value="structure">Учебная структура</TabsTrigger>
                    <TabsTrigger value="divisions">Подразделения</TabsTrigger>
                </TabsList>

                <TabsContent value="structure">
                    <UniversityStructureDrilldown />
                </TabsContent>

                <TabsContent value="divisions">
                    <AdminCrudEntityPanel
                        entity="divisions"
                        title="Подразделения"
                        description="Административные подразделения университета: отделы, службы, управления."
                        createButtonLabel="Добавить подразделение"
                        fields={organizationFields}
                        columns={organizationColumns}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function UniversityStructureDrilldown() {
    const [selectedFaculty, setSelectedFaculty] = useState<AdminCrudRecord | null>(null)
    const [selectedDepartment, setSelectedDepartment] = useState<AdminCrudRecord | null>(null)
    const [selectedSpecialty, setSelectedSpecialty] = useState<AdminCrudRecord | null>(null)

    const departmentFilters = useMemo(
        () => (selectedFaculty ? { faculty_id: Number(selectedFaculty.id) } : undefined),
        [selectedFaculty]
    )

    const departmentFixedData = useMemo(
        () => (selectedFaculty ? { faculty_id: Number(selectedFaculty.id) } : undefined),
        [selectedFaculty]
    )

    const specialtyFilters = useMemo(
        () =>
            selectedFaculty && selectedDepartment
                ? {
                    faculty_id: Number(selectedFaculty.id),
                    department_id: Number(selectedDepartment.id)
                }
                : undefined,
        [selectedDepartment, selectedFaculty]
    )

    const specialtyFixedData = useMemo(
        () =>
            selectedFaculty && selectedDepartment
                ? {
                    faculty_id: Number(selectedFaculty.id),
                    department_id: Number(selectedDepartment.id)
                }
                : undefined,
        [selectedDepartment, selectedFaculty]
    )

    const groupFilters = useMemo(
        () => (selectedSpecialty ? { specialty_id: Number(selectedSpecialty.id) } : undefined),
        [selectedSpecialty]
    )

    const groupFixedData = useMemo(
        () => (selectedSpecialty ? { specialty_id: Number(selectedSpecialty.id) } : undefined),
        [selectedSpecialty]
    )

    function openFaculty(record: AdminCrudRecord) {
        setSelectedFaculty(record)
        setSelectedDepartment(null)
        setSelectedSpecialty(null)
    }

    function openDepartment(record: AdminCrudRecord) {
        setSelectedDepartment(record)
        setSelectedSpecialty(null)
    }

    function openSpecialty(record: AdminCrudRecord) {
        setSelectedSpecialty(record)
    }

    function backToFaculties() {
        setSelectedFaculty(null)
        setSelectedDepartment(null)
        setSelectedSpecialty(null)
    }

    function backToDepartments() {
        setSelectedDepartment(null)
        setSelectedSpecialty(null)
    }

    function backToSpecialties() {
        setSelectedSpecialty(null)
    }

    return (
        <div className="grid gap-4">
            <StructureBreadcrumb
                faculty={selectedFaculty}
                department={selectedDepartment}
                specialty={selectedSpecialty}
                onFacultiesClick={backToFaculties}
                onDepartmentsClick={selectedFaculty ? backToDepartments : undefined}
                onSpecialtiesClick={selectedDepartment ? backToSpecialties : undefined}
            />

            {!selectedFaculty ? (
                <AdminCrudEntityPanel
                    entity="faculties"
                    title="Факультеты"
                    description="Выбери факультет, чтобы перейти к его кафедрам. Можно кликнуть по строке или нажать «Открыть»."
                    createButtonLabel="Добавить факультет"
                    fields={organizationFields}
                    columns={organizationColumns}
                    onRowClick={openFaculty}
                    extraRowActions={(record) => (
                        <Button size="sm" variant="primary" onClick={() => openFaculty(record)}>
                            Открыть
                            <FiArrowRight />
                        </Button>
                    )}
                />
            ) : null}

            {selectedFaculty && !selectedDepartment ? (
                <AdminCrudEntityPanel
                    entity="departments"
                    title={`Кафедры: ${getRecordName(selectedFaculty)}`}
                    description="Кафедры выбранного факультета. Клик по кафедре откроет список специальностей."
                    createButtonLabel="Добавить кафедру"
                    fields={departmentFields}
                    columns={departmentColumns}
                    filters={departmentFilters}
                    fixedData={departmentFixedData}
                    emptyMessage="У этого факультета пока нет кафедр."
                    onRowClick={openDepartment}
                    extraRowActions={(record) => (
                        <Button size="sm" variant="primary" onClick={() => openDepartment(record)}>
                            Открыть
                            <FiArrowRight />
                        </Button>
                    )}
                />
            ) : null}

            {selectedFaculty && selectedDepartment && !selectedSpecialty ? (
                <AdminCrudEntityPanel
                    entity="specialties"
                    title={`Специальности: ${getRecordName(selectedDepartment)}`}
                    description="Специальности выбранной кафедры. Клик по специальности откроет список групп."
                    createButtonLabel="Добавить специальность"
                    fields={specialtyFields}
                    columns={specialtyColumns}
                    filters={specialtyFilters}
                    fixedData={specialtyFixedData}
                    emptyMessage="У этой кафедры пока нет специальностей."
                    onRowClick={openSpecialty}
                    extraRowActions={(record) => (
                        <Button size="sm" variant="primary" onClick={() => openSpecialty(record)}>
                            Открыть
                            <FiArrowRight />
                        </Button>
                    )}
                />
            ) : null}

            {selectedFaculty && selectedDepartment && selectedSpecialty ? (
                <AdminCrudEntityPanel
                    entity="student_groups"
                    title={`Группы: ${getRecordName(selectedSpecialty)}`}
                    description="Учебные группы выбранной специальности."
                    createButtonLabel="Добавить группу"
                    fields={groupFields}
                    columns={groupColumns}
                    filters={groupFilters}
                    fixedData={groupFixedData}
                    emptyMessage="У этой специальности пока нет учебных групп."
                />
            ) : null}
        </div>
    )
}

function StructureBreadcrumb({
    faculty,
    department,
    specialty,
    onFacultiesClick,
    onDepartmentsClick,
    onSpecialtiesClick
}: {
    faculty: AdminCrudRecord | null
    department: AdminCrudRecord | null
    specialty: AdminCrudRecord | null
    onFacultiesClick: () => void
    onDepartmentsClick?: () => void
    onSpecialtiesClick?: () => void
}) {
    return (
        <Card>
            <CardContent className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant={faculty ? 'secondary' : 'primary'} onClick={onFacultiesClick}>
                    Факультеты
                </Button>

                {faculty ? (
                    <>
                        <BreadcrumbSeparator />
                        <Button
                            size="sm"
                            variant={department ? 'secondary' : 'primary'}
                            onClick={onDepartmentsClick}
                        >
                            {getRecordName(faculty)}
                        </Button>
                    </>
                ) : null}

                {department ? (
                    <>
                        <BreadcrumbSeparator />
                        <Button
                            size="sm"
                            variant={specialty ? 'secondary' : 'primary'}
                            onClick={onSpecialtiesClick}
                        >
                            {getRecordName(department)}
                        </Button>
                    </>
                ) : null}

                {specialty ? (
                    <>
                        <BreadcrumbSeparator />
                        <Badge>{getRecordName(specialty)}</Badge>
                    </>
                ) : null}
            </CardContent>
        </Card>
    )
}

function BreadcrumbSeparator() {
    return <span className="text-sm text-[var(--color-text-muted)]">/</span>
}

function getRecordName(record: AdminCrudRecord): string {
    if (record.name) {
        return String(record.name)
    }

    if (record.short_name) {
        return String(record.short_name)
    }

    return `#${String(record.id)}`
}