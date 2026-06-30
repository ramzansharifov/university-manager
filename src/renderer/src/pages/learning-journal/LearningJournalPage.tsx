import { AdminCrudEntityPanel } from '../../features/admin-crud'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui'
import { gradeElementTypeColumns, gradeElementTypeFields } from './config/learningJournalCrudConfig'

export function LearningJournalPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Журнал обучения</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Настройка оценочных элементов для будущего журнала группы.
        </p>
      </div>

      <Tabs defaultValue="grade-elements">
        <TabsList>
          <TabsTrigger value="grade-elements">Оценочные элементы</TabsTrigger>
        </TabsList>

        <TabsContent value="grade-elements">
          <AdminCrudEntityPanel
            entity="grade_element_types"
            title="Оценочные элементы"
            description="Создай элементы оценивания: контрольные, зачёты, экзамены, лабораторные и другие виды работ."
            createButtonLabel="Добавить элемент"
            fields={gradeElementTypeFields}
            columns={gradeElementTypeColumns}
            emptyMessage="Оценочные элементы пока не созданы."
            orderBy="name"
            orderDirection="asc"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
