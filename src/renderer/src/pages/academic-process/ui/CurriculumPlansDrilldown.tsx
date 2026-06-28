import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
import { Badge, Button, Card, CardContent } from '../../../shared/ui'
import {
    createCurriculumItemColumns,
    createCurriculumItemFields,
    createCurriculumPlanColumns,
    createCurriculumPlanFields,
    createOptions,
    createOptionsMap,
    getRecordName,
    specialtySelectorColumns
} from '../config/academicProcessCrudConfig'

export function CurriculumPlansDrilldown() {
    const [selectedSpecialty, setSelectedSpecialty] = useState<AdminCrudRecord | null>(null)
    const [selectedPlan, setSelectedPlan] = useState<AdminCrudRecord | null>(null)

    const [academicYearOptions, setAcademicYearOptions] = useState<AdminCrudSelectOption[]>([])
    const [educationFormOptions, setEducationFormOptions] = useState<AdminCrudSelectOption[]>([])
    const [subjectOptions, setSubjectOptions] = useState<AdminCrudSelectOption[]>([])
    const [semesterOptions, setSemesterOptions] = useState<AdminCrudSelectOption[]>([])

    const loadOptions = useCallback(async () => {
        const [academicYears, educationForms, subjects, semesters] = await Promise.all([
            window.api.adminCrud.list({
                entity: 'academic_years',
                page: 1,
                pageSize: 100,
                orderBy: 'name',
                orderDirection: 'asc'
            }),
            window.api.adminCrud.list({
                entity: 'dictionary_items',
                page: 1,
                pageSize: 100,
                filters: { dictionary_key: 'education_forms' },
                orderBy: 'sort_order',
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
                entity: 'semesters',
                page: 1,
                pageSize: 100,
                orderBy: 'number',
                orderDirection: 'asc'
            })
        ])

        setAcademicYearOptions(createOptions(academicYears.items, getRecordName))
        setEducationFormOptions(createOptions(educationForms.items, getRecordName))
        setSubjectOptions(createOptions(subjects.items, getRecordName))
        setSemesterOptions(createOptions(semesters.items, getRecordName))
    }, [])

    useEffect(() => {
        void loadOptions()
    }, [loadOptions])

    const academicYearNameById = useMemo(
        () => createOptionsMap(academicYearOptions),
        [academicYearOptions]
    )

    const educationFormNameById = useMemo(
        () => createOptionsMap(educationFormOptions),
        [educationFormOptions]
    )

    const subjectNameById = useMemo(
        () => createOptionsMap(subjectOptions),
        [subjectOptions]
    )

    const semesterNameById = useMemo(
        () => createOptionsMap(semesterOptions),
        [semesterOptions]
    )

    const curriculumPlanFields = useMemo(
        () =>
            createCurriculumPlanFields({
                academicYearOptions,
                educationFormOptions
            }),
        [academicYearOptions, educationFormOptions]
    )

    const curriculumPlanColumns = useMemo(
        () =>
            createCurriculumPlanColumns({
                academicYearNameById,
                educationFormNameById
            }),
        [academicYearNameById, educationFormNameById]
    )

    const curriculumItemFields = useMemo(
        () =>
            createCurriculumItemFields({
                subjectOptions,
                semesterOptions
            }),
        [semesterOptions, subjectOptions]
    )

    const curriculumItemColumns = useMemo(
        () =>
            createCurriculumItemColumns({
                subjectNameById,
                semesterNameById
            }),
        [semesterNameById, subjectNameById]
    )

    const planFilters = useMemo(
        () => (selectedSpecialty ? { specialty_id: Number(selectedSpecialty.id) } : undefined),
        [selectedSpecialty]
    )

    const planFixedData = useMemo(
        () => (selectedSpecialty ? { specialty_id: Number(selectedSpecialty.id) } : undefined),
        [selectedSpecialty]
    )

    const itemFilters = useMemo(
        () => (selectedPlan ? { curriculum_plan_id: Number(selectedPlan.id) } : undefined),
        [selectedPlan]
    )

    const itemFixedData = useMemo(
        () => (selectedPlan ? { curriculum_plan_id: Number(selectedPlan.id) } : undefined),
        [selectedPlan]
    )

    function openSpecialty(record: AdminCrudRecord) {
        setSelectedSpecialty(record)
        setSelectedPlan(null)
    }

    function openPlan(record: AdminCrudRecord) {
        setSelectedPlan(record)
    }

    function backToSpecialties() {
        setSelectedSpecialty(null)
        setSelectedPlan(null)
    }

    function backToPlans() {
        setSelectedPlan(null)
    }

    return (
        <div className="grid gap-4">
            <CurriculumBreadcrumb
                specialty={selectedSpecialty}
                plan={selectedPlan}
                onSpecialtiesClick={backToSpecialties}
                onPlansClick={selectedSpecialty ? backToPlans : undefined}
            />

            {!selectedSpecialty ? (
                <AdminCrudEntityPanel
                    entity="specialties"
                    title="Специальности"
                    description="Выбери специальность, чтобы открыть её учебные планы."
                    createButtonLabel="Добавить специальность"
                    fields={[]}
                    columns={specialtySelectorColumns}
                    canCreate={false}
                    canEdit={false}
                    canArchive={false}
                    emptyMessage="Специальности пока не созданы. Создай их в разделе «Университет → Учебная структура»."
                    onRowClick={openSpecialty}
                    extraRowActions={(record) => (
                        <Button
                            size="sm"
                            variant="primary"
                            title="Открыть учебные планы"
                            aria-label="Открыть учебные планы специальности"
                            onClick={() => openSpecialty(record)}
                        >
                            <FiArrowRight />
                        </Button>
                    )}
                />
            ) : null}

            {selectedSpecialty && !selectedPlan ? (
                <AdminCrudEntityPanel
                    entity="curriculum_plans"
                    title={`Учебные планы: ${getRecordName(selectedSpecialty)}`}
                    description="Учебные планы выбранной специальности. Клик по плану откроет пункты учебного плана."
                    createButtonLabel="Добавить учебный план"
                    fields={curriculumPlanFields}
                    columns={curriculumPlanColumns}
                    filters={planFilters}
                    fixedData={planFixedData}
                    emptyMessage="Для этой специальности пока нет учебных планов."
                    onAfterMutation={loadOptions}
                    onRowClick={openPlan}
                    extraRowActions={(record) => (
                        <Button
                            size="sm"
                            variant="primary"
                            title="Открыть пункты плана"
                            aria-label="Открыть пункты учебного плана"
                            onClick={() => openPlan(record)}
                        >
                            <FiArrowRight />
                        </Button>
                    )}
                />
            ) : null}

            {selectedSpecialty && selectedPlan ? (
                <AdminCrudEntityPanel
                    entity="curriculum_items"
                    title={`Пункты плана: ${getRecordName(selectedPlan)}`}
                    description={`Предметы, часы и формы контроля для плана специальности «${getRecordName(selectedSpecialty)}».`}
                    createButtonLabel="Добавить пункт плана"
                    fields={curriculumItemFields}
                    columns={curriculumItemColumns}
                    filters={itemFilters}
                    fixedData={itemFixedData}
                    emptyMessage="В этом учебном плане пока нет пунктов."
                    onAfterMutation={loadOptions}
                />
            ) : null}
        </div>
    )
}

function CurriculumBreadcrumb({
    specialty,
    plan,
    onSpecialtiesClick,
    onPlansClick
}: {
    specialty: AdminCrudRecord | null
    plan: AdminCrudRecord | null
    onSpecialtiesClick: () => void
    onPlansClick?: () => void
}) {
    return (
        <Card>
            <CardContent className="flex flex-wrap items-center gap-2">
                <Button
                    size="sm"
                    variant={specialty ? 'secondary' : 'primary'}
                    onClick={onSpecialtiesClick}
                >
                    Специальности
                </Button>

                {specialty ? (
                    <>
                        <span className="text-sm text-[var(--color-text-muted)]">/</span>
                        <Button size="sm" variant={plan ? 'secondary' : 'primary'} onClick={onPlansClick}>
                            Учебные планы
                        </Button>
                        <Badge>{getRecordName(specialty)}</Badge>
                    </>
                ) : null}

                {plan ? (
                    <>
                        <span className="text-sm text-[var(--color-text-muted)]">/</span>
                        <Badge>{getRecordName(plan)}</Badge>
                    </>
                ) : null}
            </CardContent>
        </Card>
    )
}