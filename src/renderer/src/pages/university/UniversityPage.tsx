import { AdminCrudEntityPanel } from '../../features/admin-crud'
import {
    Badge,
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

const simpleOrganizationFields = [
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

const simpleOrganizationColumns = [
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
    },
    {
        key: 'created_at',
        label: 'Создано'
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

            <Tabs defaultValue="faculties">
                <TabsList>
                    <TabsTrigger value="faculties">Факультеты</TabsTrigger>
                    <TabsTrigger value="divisions">Подразделения</TabsTrigger>
                    <TabsTrigger value="departments">Кафедры</TabsTrigger>
                    <TabsTrigger value="specialties">Специальности</TabsTrigger>
                    <TabsTrigger value="groups">Группы</TabsTrigger>
                </TabsList>

                <TabsContent value="faculties">
                    <AdminCrudEntityPanel
                        entity="faculties"
                        title="Факультеты"
                        description="Создание, редактирование, поиск и архивирование факультетов."
                        createButtonLabel="Добавить факультет"
                        fields={simpleOrganizationFields}
                        columns={simpleOrganizationColumns}
                    />
                </TabsContent>

                <TabsContent value="divisions">
                    <AdminCrudEntityPanel
                        entity="divisions"
                        title="Подразделения"
                        description="Административные подразделения университета: отделы, службы, управления."
                        createButtonLabel="Добавить подразделение"
                        fields={simpleOrganizationFields}
                        columns={simpleOrganizationColumns}
                    />
                </TabsContent>

                <TabsContent value="departments">
                    <DraftTab
                        title="Кафедры"
                        description="Кафедры будут подключены после базовых справочников факультетов."
                        items={['faculty_id', 'name', 'short_name', 'description']}
                    />
                </TabsContent>

                <TabsContent value="specialties">
                    <DraftTab
                        title="Специальности"
                        description="Специальности требуют выбора факультета и кафедры."
                        items={['faculty_id', 'department_id', 'code', 'name', 'degree']}
                    />
                </TabsContent>

                <TabsContent value="groups">
                    <DraftTab
                        title="Группы"
                        description="Группы требуют выбора специальности, учебного года, формы обучения и куратора."
                        items={['specialty_id', 'academic_year_id', 'education_form_id', 'curator_teacher_id']}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function DraftTab({
    title,
    description,
    items
}: {
    title: string
    description: string
    items: string[]
}) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>

                    <Badge variant="warning">следующий этап</Badge>
                </div>
            </CardHeader>

            <CardContent>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {items.map((item) => (
                        <div
                            key={item}
                            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                        >
                            <p className="text-sm font-medium text-[var(--color-text)]">{item}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}