import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AdminCrudSelectOption } from '../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../features/admin-crud'
import {
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
import {
    audienceTypeColumns,
    audienceTypeFields,
    buildingColumns,
    buildingFields,
    createAudienceColumns,
    createAudienceFields,
    createOptions,
    createOptionsMap,
    getRecordName,
    lessonPeriodColumns,
    lessonPeriodFields
} from './config/scheduleCrudConfig'

export function SchedulePage() {
    const [audienceTypeOptions, setAudienceTypeOptions] = useState<AdminCrudSelectOption[]>([])
    const [buildingOptions, setBuildingOptions] = useState<AdminCrudSelectOption[]>([])

    const loadOptions = useCallback(async () => {
        const [audienceTypes, buildings] = await Promise.all([
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
            })
        ])

        setAudienceTypeOptions(createOptions(audienceTypes.items, getRecordName))
        setBuildingOptions(createOptions(buildings.items, getRecordName))
    }, [])

    useEffect(() => {
        void loadOptions()
    }, [loadOptions])

    const audienceTypeNameById = useMemo(
        () => createOptionsMap(audienceTypeOptions),
        [audienceTypeOptions]
    )

    const buildingNameById = useMemo(() => createOptionsMap(buildingOptions), [buildingOptions])

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
                    <ComingSoonCard
                        title="Расписание занятий"
                        description="Следующим шагом здесь будет форма создания занятий по семестру, группе, дисциплине, преподавателю, аудитории и паре."
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function ComingSoonCard({
    title,
    description
}: {
    title: string
    description: string
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>

            <CardContent>
                <p className="text-sm text-[var(--color-text-muted)]">
                    Сначала заполни типы аудиторий, корпуса, аудитории и пары. Потом подключим полноценное расписание занятий.
                </p>
            </CardContent>
        </Card>
    )
}