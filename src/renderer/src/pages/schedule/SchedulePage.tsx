import type { ReactElement } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui'
import { FinalAssessmentSchedule } from './ui/FinalAssessmentSchedule'
import { ScheduleItemsDrilldown } from './ui/ScheduleItemsDrilldown'

export function SchedulePage(): ReactElement {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Расписание</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Основное расписание занятий и отдельное расписание итоговой аттестации.
        </p>
      </div>

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Расписание занятий</TabsTrigger>
          <TabsTrigger value="final-assessments">Итоговая аттестация</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <ScheduleItemsDrilldown />
        </TabsContent>

        <TabsContent value="final-assessments">
          <FinalAssessmentSchedule />
        </TabsContent>
      </Tabs>
    </div>
  )
}
