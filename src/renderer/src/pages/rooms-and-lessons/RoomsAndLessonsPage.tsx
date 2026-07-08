import type { ReactElement } from 'react'
import { AdminCrudEntityPanel } from '../../features/admin-crud'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui'
import {
  audienceTypeColumns,
  audienceTypeFields,
  lessonPeriodColumns,
  lessonPeriodFields,
  lessonTypeColumns,
  lessonTypeFields
} from '../schedule/config/scheduleCrudConfig'
import { AudiencesByBuildingDrilldown } from './ui/AudiencesByBuildingDrilldown'

export function RoomsAndLessonsPage(): ReactElement {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Аудитории и занятия</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Корпуса, аудитории, пары и справочники типов занятий.
        </p>
      </div>

      <Tabs defaultValue="audience-types">
        <TabsList>
          <TabsTrigger value="audience-types">Типы аудиторий</TabsTrigger>
          <TabsTrigger value="audiences">Аудитории</TabsTrigger>
          <TabsTrigger value="periods">Пары</TabsTrigger>
          <TabsTrigger value="lesson-types">Типы занятий</TabsTrigger>
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
          />
        </TabsContent>

        <TabsContent value="audiences">
          <AudiencesByBuildingDrilldown />
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

        <TabsContent value="lesson-types">
          <AdminCrudEntityPanel
            entity="dictionary_items"
            title="Типы занятий"
            description="Справочник типов занятий: лекция, практика, лабораторная, консультация, экзамен и другие."
            createButtonLabel="Добавить тип занятия"
            fields={lessonTypeFields}
            columns={lessonTypeColumns}
            filters={{ dictionary_key: 'lesson_types' }}
            fixedData={{ dictionary_key: 'lesson_types' }}
            emptyMessage="Типы занятий пока не созданы."
            orderBy="sort_order"
            orderDirection="asc"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
