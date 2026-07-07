import { FilterEmployeesPage } from './FilterEmployeesPage'
import { FilterStudentsPage } from './FilterStudentsPage'
import { FilterTeachersPage } from './FilterTeachersPage'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui'

export function FiltersPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Фильтры</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Быстрый поиск больших сущностей и переход к их полной карточке.
        </p>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Студенты</TabsTrigger>
          <TabsTrigger value="teachers">Преподаватели</TabsTrigger>
          <TabsTrigger value="employees">Сотрудники</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <FilterStudentsPage />
        </TabsContent>

        <TabsContent value="teachers">
          <FilterTeachersPage />
        </TabsContent>

        <TabsContent value="employees">
          <FilterEmployeesPage />
        </TabsContent>
      </Tabs>
    </div>
  )
}
