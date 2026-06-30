import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../features/admin-crud'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui'
import {
  completionStatusOptions,
  createAttendanceColumns,
  createAttendanceFields,
  createCompletionColumns,
  createCompletionFields,
  createDisciplineOptions,
  createGradeColumns,
  createGradeFields,
  createGradeItemColumns,
  createGradeItemFields,
  createGradeItemOptions,
  createLessonPeriodOptions,
  createLessonSessionColumns,
  createLessonSessionFields,
  createLessonSessionOptions,
  createOptions,
  createOptionsMap,
  createScheduleItemOptions,
  createStringOptionsMap,
  createStudentOptions,
  createWeekOptions,
  getPersonName,
  getRecordName,
  lessonSessionStatusOptions,
  scoreScaleColumns,
  scoreScaleFields,
  topicCompletedOptions
} from './config/learningJournalCrudConfig'

export function LearningJournalPage() {
  const [scheduleItemOptions, setScheduleItemOptions] = useState<AdminCrudSelectOption[]>([])
  const [lessonSessionOptions, setLessonSessionOptions] = useState<AdminCrudSelectOption[]>([])
  const [studentOptions, setStudentOptions] = useState<AdminCrudSelectOption[]>([])
  const [attendanceStatusOptions, setAttendanceStatusOptions] = useState<AdminCrudSelectOption[]>(
    []
  )
  const [disciplineOptions, setDisciplineOptions] = useState<AdminCrudSelectOption[]>([])
  const [gradeCategoryOptions, setGradeCategoryOptions] = useState<AdminCrudSelectOption[]>([])
  const [gradeItemOptions, setGradeItemOptions] = useState<AdminCrudSelectOption[]>([])
  const [teacherOptions, setTeacherOptions] = useState<AdminCrudSelectOption[]>([])
  const [weekOptions, setWeekOptions] = useState<AdminCrudSelectOption[]>([])

  const [maps, setMaps] = useState(() => createEmptyMaps())

  const loadOptions = useCallback(async () => {
    const [
      scheduleItems,
      lessonSessions,
      students,
      attendanceStatuses,
      gradeCategories,
      disciplines,
      subjects,
      groups,
      teachers,
      weeks,
      lessonPeriods,
      gradeItems
    ] = await Promise.all([
      window.api.adminCrud.list({
        entity: 'schedule_items',
        page: 1,
        pageSize: 1000,
        orderBy: 'day_of_week',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'lesson_sessions',
        page: 1,
        pageSize: 1000,
        orderBy: 'lesson_date',
        orderDirection: 'desc'
      }),
      window.api.adminCrud.list({
        entity: 'students',
        page: 1,
        pageSize: 1000,
        orderBy: 'last_name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'dictionary_items',
        page: 1,
        pageSize: 100,
        filters: { dictionary_key: 'attendance_statuses' },
        orderBy: 'sort_order',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'dictionary_items',
        page: 1,
        pageSize: 100,
        filters: { dictionary_key: 'grade_categories' },
        orderBy: 'sort_order',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'disciplines',
        page: 1,
        pageSize: 1000,
        orderBy: 'id',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'subjects',
        page: 1,
        pageSize: 1000,
        orderBy: 'name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'student_groups',
        page: 1,
        pageSize: 1000,
        orderBy: 'name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'teachers',
        page: 1,
        pageSize: 1000,
        orderBy: 'last_name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'weeks',
        page: 1,
        pageSize: 1000,
        orderBy: 'number',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'lesson_periods',
        page: 1,
        pageSize: 100,
        orderBy: 'number',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'grade_items',
        page: 1,
        pageSize: 1000,
        orderBy: 'grade_date',
        orderDirection: 'desc'
      })
    ])

    const subjectOptions = createOptions(subjects.items, getRecordName)
    const groupOptions = createOptions(groups.items, getRecordName)
    const nextTeacherOptions = createOptions(teachers.items, getPersonName)
    const nextWeekOptions = createWeekOptions(weeks.items)
    const nextLessonPeriodOptions = createLessonPeriodOptions(lessonPeriods.items)

    const subjectNameById = createOptionsMap(subjectOptions)
    const groupNameById = createOptionsMap(groupOptions)
    const teacherNameById = createOptionsMap(nextTeacherOptions)
    const weekNameById = createOptionsMap(nextWeekOptions)
    const lessonPeriodNameById = createOptionsMap(nextLessonPeriodOptions)

    const nextDisciplineOptions = createDisciplineOptions(disciplines.items, {
      subjectNameById,
      groupNameById
    })

    const disciplineNameById = createOptionsMap(nextDisciplineOptions)
    const disciplineGroupIdById = createRecordNumberMap(disciplines.items, 'group_id')
    const scheduleItemGroupIdById = createRecordNumberMap(scheduleItems.items, 'group_id')
    const weekById = createRecordMap(weeks.items)

    const nextScheduleItemOptions = createScheduleItemOptions(scheduleItems.items, {
      groupNameById,
      disciplineNameById,
      teacherNameById,
      lessonPeriodNameById,
      weekById
    })

    const scheduleItemNameById = createOptionsMap(nextScheduleItemOptions)

    const nextLessonSessionOptions = createLessonSessionOptions(lessonSessions.items, {
      scheduleItemNameById,
      scheduleItemGroupIdById
    })

    const lessonSessionNameById = createOptionsMap(nextLessonSessionOptions)

    const nextGradeItemOptions = createGradeItemOptions(gradeItems.items, {
      disciplineNameById,
      disciplineGroupIdById
    })

    const gradeItemNameById = createOptionsMap(nextGradeItemOptions)

    setScheduleItemOptions(nextScheduleItemOptions)
    setLessonSessionOptions(nextLessonSessionOptions)
    setStudentOptions(createStudentOptions(students.items))
    setAttendanceStatusOptions(createOptions(attendanceStatuses.items, getRecordName))
    setGradeCategoryOptions(createOptions(gradeCategories.items, getRecordName))
    setDisciplineOptions(nextDisciplineOptions)
    setGradeItemOptions(nextGradeItemOptions)
    setTeacherOptions(nextTeacherOptions)
    setWeekOptions(nextWeekOptions)

    setMaps({
      scheduleItemNameById,
      lessonSessionNameById,
      studentNameById: createOptionsMap(createStudentOptions(students.items)),
      attendanceStatusNameById: createOptionsMap(
        createOptions(attendanceStatuses.items, getRecordName)
      ),
      disciplineNameById,
      gradeCategoryNameById: createOptionsMap(createOptions(gradeCategories.items, getRecordName)),
      gradeItemNameById,
      teacherNameById,
      weekNameById,
      completionStatusNameByValue: createStringOptionsMap(completionStatusOptions),
      lessonSessionStatusNameByValue: createStringOptionsMap(lessonSessionStatusOptions),
      topicCompletedNameByValue: createStringOptionsMap(topicCompletedOptions)
    })
  }, [])

  useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  const lessonSessionFields = useMemo(
    () =>
      createLessonSessionFields({
        scheduleItemOptions,
        weekOptions,
        teacherOptions
      }),
    [scheduleItemOptions, teacherOptions, weekOptions]
  )

  const attendanceFields = useMemo(
    () =>
      createAttendanceFields({
        lessonSessionOptions,
        studentOptions,
        attendanceStatusOptions
      }),
    [attendanceStatusOptions, lessonSessionOptions, studentOptions]
  )

  const gradeItemFields = useMemo(
    () =>
      createGradeItemFields({
        disciplineOptions,
        gradeCategoryOptions
      }),
    [disciplineOptions, gradeCategoryOptions]
  )

  const gradeFields = useMemo(
    () =>
      createGradeFields({
        gradeItemOptions,
        studentOptions
      }),
    [gradeItemOptions, studentOptions]
  )

  const completionFields = useMemo(
    () =>
      createCompletionFields({
        lessonSessionOptions
      }),
    [lessonSessionOptions]
  )

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Журнал обучения</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Проведённые занятия, посещаемость, оценочные работы, оценки и выполнение тем.
        </p>
      </div>

      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">Занятия</TabsTrigger>
          <TabsTrigger value="attendance">Посещаемость</TabsTrigger>
          <TabsTrigger value="grade-items">Оценочные работы</TabsTrigger>
          <TabsTrigger value="grades">Оценки</TabsTrigger>
          <TabsTrigger value="scales">Шкалы оценивания</TabsTrigger>
          <TabsTrigger value="completion">Выполнение занятий</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <AdminCrudEntityPanel
            entity="lesson_sessions"
            title="Занятия"
            description="Фактически проведённые или запланированные занятия на основе расписания."
            createButtonLabel="Добавить занятие"
            fields={lessonSessionFields}
            columns={createLessonSessionColumns(maps)}
            emptyMessage="Занятия пока не созданы."
            orderBy="lesson_date"
            orderDirection="desc"
            onAfterMutation={loadOptions}
          />
        </TabsContent>

        <TabsContent value="attendance">
          <AdminCrudEntityPanel
            entity="attendance_records"
            title="Посещаемость"
            description="Отметки посещаемости студентов по конкретным занятиям."
            createButtonLabel="Добавить отметку"
            fields={attendanceFields}
            columns={createAttendanceColumns(maps)}
            emptyMessage="Отметки посещаемости пока не созданы."
            canArchive={false}
            orderBy="id"
            orderDirection="asc"
            onAfterMutation={loadOptions}
          />
        </TabsContent>

        <TabsContent value="grade-items">
          <AdminCrudEntityPanel
            entity="grade_items"
            title="Оценочные работы"
            description="Контрольные, лабораторные, зачёты, экзамены и другие оцениваемые работы."
            createButtonLabel="Добавить работу"
            fields={gradeItemFields}
            columns={createGradeItemColumns(maps)}
            emptyMessage="Оценочные работы пока не созданы."
            orderBy="id"
            orderDirection="asc"
            onAfterMutation={loadOptions}
          />
        </TabsContent>

        <TabsContent value="grades">
          <AdminCrudEntityPanel
            entity="grades"
            title="Оценки"
            description="Оценки студентов по оценочным работам."
            createButtonLabel="Добавить оценку"
            fields={gradeFields}
            columns={createGradeColumns(maps)}
            emptyMessage="Оценки пока не созданы."
            canArchive={false}
            orderBy="id"
            orderDirection="asc"
            onAfterMutation={loadOptions}
          />
        </TabsContent>

        <TabsContent value="scales">
          <AdminCrudEntityPanel
            entity="score_scales"
            title="Шкалы оценивания"
            description="Справочник шкал: диапазон баллов и итоговый результат."
            createButtonLabel="Добавить шкалу"
            fields={scoreScaleFields}
            columns={scoreScaleColumns}
            emptyMessage="Шкалы оценивания пока не созданы."
            orderBy="min_score"
            orderDirection="asc"
          />
        </TabsContent>

        <TabsContent value="completion">
          <AdminCrudEntityPanel
            entity="lesson_completion_records"
            title="Выполнение занятий"
            description="Фиксация выполнения темы занятия."
            createButtonLabel="Добавить запись"
            fields={completionFields}
            columns={createCompletionColumns(maps)}
            emptyMessage="Записи выполнения пока не созданы."
            canArchive={false}
            orderBy="id"
            orderDirection="asc"
            onAfterMutation={loadOptions}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function createEmptyMaps() {
  return {
    scheduleItemNameById: new Map<number, string>(),
    lessonSessionNameById: new Map<number, string>(),
    studentNameById: new Map<number, string>(),
    attendanceStatusNameById: new Map<number, string>(),
    disciplineNameById: new Map<number, string>(),
    gradeCategoryNameById: new Map<number, string>(),
    gradeItemNameById: new Map<number, string>(),
    teacherNameById: new Map<number, string>(),
    weekNameById: new Map<number, string>(),
    completionStatusNameByValue: new Map<string, string>(),
    lessonSessionStatusNameByValue: new Map<string, string>(),
    topicCompletedNameByValue: new Map<string, string>()
  }
}

function createRecordMap(items: AdminCrudRecord[]): Map<number, AdminCrudRecord> {
  return new Map(items.map((item) => [Number(item.id), item]))
}

function createRecordNumberMap(items: AdminCrudRecord[], key: string): Map<number, number> {
  return new Map(
    items
      .map((item) => [Number(item.id), Number(item[key])])
      .filter(
        (entry): entry is [number, number] => Number.isFinite(entry[0]) && Number.isFinite(entry[1])
      )
  )
}
