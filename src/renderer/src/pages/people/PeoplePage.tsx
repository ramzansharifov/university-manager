import { AdminCrudEntityPanel } from '../../features/admin-crud'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui'
import {
    employeeColumns,
    employeeFields,
    positionColumns,
    positionFields,
    teacherColumns,
    teacherFields
} from './config/peopleCrudConfig'
import { StudentsByGroupPanel } from './ui/StudentsByGroupPanel'

export function PeoplePage() {
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
                    <StudentsByGroupPanel />
                </TabsContent>

                <TabsContent value="teachers">
                    <AdminCrudEntityPanel
                        entity="teachers"
                        title="Преподаватели"
                        description="Создание, редактирование, поиск и архивирование преподавателей."
                        createButtonLabel="Добавить преподавателя"
                        fields={teacherFields}
                        columns={teacherColumns}
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
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}