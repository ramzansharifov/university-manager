import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui'
import { UniversityAdministrativeStructureDrilldown } from './ui/UniversityAdministrativeStructureDrilldown'
import { UniversityStructureDrilldown } from './ui/UniversityStructureDrilldown'

export function UniversityPage() {
    return (
        <div className="grid gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Университет</h1>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Учебная и административная структура университета.
                </p>
            </div>

            <Tabs defaultValue="structure">
                <TabsList>
                    <TabsTrigger value="structure">Учебная структура</TabsTrigger>
                    <TabsTrigger value="administration">Административная структура</TabsTrigger>
                </TabsList>

                <TabsContent value="structure">
                    <UniversityStructureDrilldown />
                </TabsContent>

                <TabsContent value="administration">
                    <UniversityAdministrativeStructureDrilldown />
                </TabsContent>
            </Tabs>
        </div>
    )
}