import { AdminCrudEntityPanel } from '../../features/admin-crud'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui'
import { organizationColumns, organizationFields } from './config/universityCrudConfig'
import { UniversityStructureDrilldown } from './ui/UniversityStructureDrilldown'

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