import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import {
  FiArrowLeft,
  FiBookOpen,
  FiCalendar,
  FiClipboard,
  FiRefreshCcw,
  FiUser
} from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import type { AdminCrudRecord } from '../../features/admin-crud'
import {
  Badge,
  Button,
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
import { formatDateForDisplay } from '../../shared/lib/date'

interface TeacherRelatedData {
  status: AdminCrudRecord | null
  department: AdminCrudRecord | null
  subjects: AdminCrudRecord[]
  disciplines: AdminCrudRecord[]
  groups: AdminCrudRecord[]
  semesters: AdminCrudRecord[]
  scheduleItems: AdminCrudRecord[]
  lessonPeriods: AdminCrudRecord[]
  lessonTypes: AdminCrudRecord[]
  audiences: AdminCrudRecord[]
  lessonSessions: AdminCrudRecord[]
  finalAssessmentRounds: AdminCrudRecord[]
  finalAssessments: AdminCrudRecord[]
}

interface TeacherDisciplineRow {
  id: string
  discipline: string
  subject: string
  group: string
  semester: string
  status: string
}

interface TeacherScheduleRow {
  id: string
  day: string
  pair: string
  discipline: string
  group: string
  type: string
  audience: string
  status: string
}

interface TeacherActivityRow {
  id: string
  date: string
  type: string
  title: string
  group: string
  status: string
}

const emptyRelatedData: TeacherRelatedData = {
  status: null,
  department: null,
  subjects: [],
  disciplines: [],
  groups: [],
  semesters: [],
  scheduleItems: [],
  lessonPeriods: [],
  lessonTypes: [],
  audiences: [],
  lessonSessions: [],
  finalAssessmentRounds: [],
  finalAssessments: []
}

export function TeacherDetailsPage(): ReactElement {
  const { teacherId } = useParams()
  const navigate = useNavigate()

  const [teacher, setTeacher] = useState<AdminCrudRecord | null>(null)
  const [relatedData, setRelatedData] = useState<TeacherRelatedData>(emptyRelatedData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const numericTeacherId = useMemo(() => Number(teacherId), [teacherId])

  const loadTeacher = useCallback(async () => {
    if (!Number.isFinite(numericTeacherId)) {
      setError('Некорректный идентификатор преподавателя')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const teacherRecord = await window.api.adminCrud.getById({
        entity: 'teachers',
        id: numericTeacherId
      })

      if (!teacherRecord) {
        setTeacher(null)
        setRelatedData(emptyRelatedData)
        setError('Преподаватель не найден')
        return
      }

      const statusId = toNumberOrNull(teacherRecord.status_id)
      const departmentId = toNumberOrNull(teacherRecord.department_id)

      const [
        statusRecord,
        departmentRecord,
        subjectsResult,
        disciplinesResult,
        scheduleItemsResult,
        lessonPeriodsResult,
        lessonTypesResult,
        audiencesResult,
        lessonSessionsResult,
        finalAssessmentRoundsResult
      ] = await Promise.all([
        statusId === null
          ? Promise.resolve(null)
          : window.api.adminCrud.getById({
              entity: 'dictionary_items',
              id: statusId
            }),
        departmentId === null
          ? Promise.resolve(null)
          : window.api.adminCrud.getById({
              entity: 'departments',
              id: departmentId
            }),
        window.api.adminCrud.list({
          entity: 'subjects',
          page: 1,
          pageSize: 2000,
          orderBy: 'name',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'disciplines',
          page: 1,
          pageSize: 5000,
          filters: { teacher_id: numericTeacherId },
          orderBy: 'semester_id',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'schedule_items',
          page: 1,
          pageSize: 5000,
          filters: { teacher_id: numericTeacherId },
          orderBy: 'day_of_week',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'lesson_periods',
          page: 1,
          pageSize: 200,
          orderBy: 'number',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'dictionary_items',
          page: 1,
          pageSize: 200,
          filters: { dictionary_key: 'lesson_types' },
          orderBy: 'sort_order',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'audiences',
          page: 1,
          pageSize: 1000,
          orderBy: 'name',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'lesson_sessions',
          page: 1,
          pageSize: 5000,
          filters: { teacher_id: numericTeacherId },
          orderBy: 'lesson_date',
          orderDirection: 'desc'
        }),
        window.api.adminCrud.list({
          entity: 'final_assessment_rounds',
          page: 1,
          pageSize: 3000,
          filters: { teacher_id: numericTeacherId },
          orderBy: 'assessment_date',
          orderDirection: 'desc'
        })
      ])

      const groupIds = getUniqueIds([
        ...disciplinesResult.items.map((item) => item.group_id),
        ...scheduleItemsResult.items.map((item) => item.group_id)
      ])
      const semesterIds = getUniqueIds([
        ...disciplinesResult.items.map((item) => item.semester_id),
        ...scheduleItemsResult.items.map((item) => item.semester_id)
      ])
      const finalAssessmentIds = getUniqueIds(
        finalAssessmentRoundsResult.items.map((item) => item.final_assessment_id)
      )

      const [groupsResult, semestersResult, finalAssessmentsResult] = await Promise.all([
        groupIds.length > 0
          ? window.api.adminCrud.list({
              entity: 'student_groups',
              page: 1,
              pageSize: 5000,
              filters: { id: groupIds },
              orderBy: 'name',
              orderDirection: 'asc'
            })
          : Promise.resolve(emptyListResult()),
        semesterIds.length > 0
          ? window.api.adminCrud.list({
              entity: 'semesters',
              page: 1,
              pageSize: 1000,
              filters: { id: semesterIds },
              orderBy: 'number',
              orderDirection: 'asc'
            })
          : Promise.resolve(emptyListResult()),
        finalAssessmentIds.length > 0
          ? window.api.adminCrud.list({
              entity: 'final_assessments',
              page: 1,
              pageSize: 3000,
              filters: { id: finalAssessmentIds },
              orderBy: 'name',
              orderDirection: 'asc'
            })
          : Promise.resolve(emptyListResult())
      ])

      setTeacher(teacherRecord)
      setRelatedData({
        status: statusRecord,
        department: departmentRecord,
        subjects: subjectsResult.items,
        disciplines: disciplinesResult.items,
        groups: groupsResult.items,
        semesters: semestersResult.items,
        scheduleItems: scheduleItemsResult.items,
        lessonPeriods: lessonPeriodsResult.items,
        lessonTypes: lessonTypesResult.items,
        audiences: audiencesResult.items,
        lessonSessions: lessonSessionsResult.items,
        finalAssessmentRounds: finalAssessmentRoundsResult.items,
        finalAssessments: finalAssessmentsResult.items
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить преподавателя')
    } finally {
      setIsLoading(false)
    }
  }, [numericTeacherId])

  useEffect(() => {
    void loadTeacher()
  }, [loadTeacher])

  const teacherName = teacher ? getPersonName(teacher) : 'Преподаватель'
  const subjectLabels = useMemo(() => createTeacherSubjectLabels(teacher, relatedData), [teacher, relatedData])
  const disciplineRows = useMemo(() => createTeacherDisciplineRows(relatedData), [relatedData])
  const scheduleRows = useMemo(() => createTeacherScheduleRows(relatedData), [relatedData])
  const activityRows = useMemo(() => createTeacherActivityRows(relatedData), [relatedData])

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Button variant="ghost" onClick={() => navigate('/people')}>
          <FiArrowLeft />К людям
        </Button>

        <Button variant="secondary" onClick={() => void loadTeacher()} disabled={isLoading}>
          <FiRefreshCcw />
          Обновить
        </Button>
      </div>

      {error ? (
        <Card className="border-[var(--color-danger)]/40">
          <CardContent>
            <p className="text-sm font-medium text-[var(--color-danger)]">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent>
            <p className="text-sm text-[var(--color-text-muted)]">
              Загрузка карточки преподавателя...
            </p>
          </CardContent>
        </Card>
      ) : null}

      {teacher ? (
        <>
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-lg font-bold text-white shadow-sm">
                    {getInitials(teacherName)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl font-bold tracking-tight">{teacherName}</h1>
                      <Badge>{relatedData.status ? getRecordName(relatedData.status) : 'Статус не указан'}</Badge>
                    </div>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {relatedData.department
                        ? `Кафедра: ${getRecordName(relatedData.department)}`
                        : 'Кафедра не указана'}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {teacher.email ? <Badge variant="muted">{String(teacher.email)}</Badge> : null}
                      {teacher.phone ? <Badge variant="muted">{String(teacher.phone)}</Badge> : null}
                      {teacher.hire_date ? (
                        <Badge variant="muted">Принят: {formatDateForDisplay(teacher.hire_date)}</Badge>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[520px] xl:grid-cols-4">
                  <MetricCard label="Кафедра" value={getRecordNameOrDash(relatedData.department)} />
                  <MetricCard label="Предметов" value={String(subjectLabels.length)} />
                  <MetricCard label="Дисциплин" value={String(disciplineRows.length)} />
                  <MetricCard label="Занятий" value={String(scheduleRows.length)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="teaching">Учебная работа</TabsTrigger>
              <TabsTrigger value="schedule">Расписание</TabsTrigger>
              <TabsTrigger value="activity">Активность</TabsTrigger>
              <TabsTrigger value="notes">Дополнительно</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Личные данные</CardTitle>
                    <CardDescription>Основная информация из карточки преподавателя.</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <InfoItem label="Фамилия" value={teacher.last_name} />
                      <InfoItem label="Имя" value={teacher.first_name} />
                      <InfoItem label="Отчество" value={teacher.middle_name} />
                      <InfoItem label="Дата рождения" value={formatDateForDisplay(teacher.birth_date)} />
                      <InfoItem label="Дата приёма" value={formatDateForDisplay(teacher.hire_date)} />
                      <InfoItem label="Дата увольнения" value={formatDateForDisplay(teacher.dismissal_date)} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Контакты</CardTitle>
                    <CardDescription>Email, телефон и адрес проживания.</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="grid gap-3">
                      <InfoItem label="Email" value={teacher.email} />
                      <InfoItem label="Телефон" value={teacher.phone} />
                      <DetailsBlock title="Адрес" value={teacher.address} compact />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="teaching">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Преподаваемые предметы</CardTitle>
                    <CardDescription>Предметы, закреплённые за преподавателем.</CardDescription>
                  </CardHeader>

                  <CardContent>
                    {subjectLabels.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {subjectLabels.map((label) => (
                          <Badge key={label} variant="muted">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <EmptyState>Предметы пока не указаны.</EmptyState>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <FiBookOpen className="h-5 w-5 text-[var(--color-primary)]" />
                      <div>
                        <CardTitle>Дисциплины преподавателя</CardTitle>
                        <CardDescription>Группы, семестры и дисциплины, которые ведёт преподаватель.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {disciplineRows.length > 0 ? (
                      <SimpleTable
                        headers={['Дисциплина', 'Предмет', 'Группа', 'Семестр', 'Статус']}
                        rows={disciplineRows.map((row) => [
                          row.discipline,
                          row.subject,
                          row.group,
                          row.semester,
                          row.status
                        ])}
                      />
                    ) : (
                      <EmptyState>За преподавателем пока нет дисциплин.</EmptyState>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="schedule">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <FiCalendar className="h-5 w-5 text-[var(--color-primary)]" />
                    <div>
                      <CardTitle>Расписание занятий</CardTitle>
                      <CardDescription>Занятия из расписания, где указан этот преподаватель.</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {scheduleRows.length > 0 ? (
                    <SimpleTable
                      headers={['День', 'Пара', 'Дисциплина', 'Группа', 'Тип', 'Аудитория', 'Статус']}
                      rows={scheduleRows.map((row) => [
                        row.day,
                        row.pair,
                        row.discipline,
                        row.group,
                        row.type,
                        row.audience,
                        row.status
                      ])}
                    />
                  ) : (
                    <EmptyState>В расписании пока нет занятий преподавателя.</EmptyState>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <SummaryCard icon={<FiClipboard />} label="Проведённые занятия" value={String(relatedData.lessonSessions.length)} />
                  <SummaryCard label="Туры аттестации" value={String(relatedData.finalAssessmentRounds.length)} />
                  <SummaryCard label="Всего активностей" value={String(activityRows.length)} />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Журнал активности</CardTitle>
                    <CardDescription>Проведённые занятия и туры итоговой аттестации преподавателя.</CardDescription>
                  </CardHeader>

                  <CardContent>
                    {activityRows.length > 0 ? (
                      <SimpleTable
                        headers={['Дата', 'Тип', 'Описание', 'Группа', 'Статус']}
                        rows={activityRows.map((row) => [
                          row.date,
                          row.type,
                          row.title,
                          row.group,
                          row.status
                        ])}
                      />
                    ) : (
                      <EmptyState>Активность преподавателя пока не зафиксирована.</EmptyState>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <DetailsBlock title="Примечание" value={teacher.note} />
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2">
      <p className="text-xs font-medium text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value
}: {
  icon?: ReactNode
  label: string
  value: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
          {icon ?? <FiUser />}
        </div>
        <div>
          <p className="text-xs font-medium text-[var(--color-text-muted)]">{label}</p>
          <p className="text-lg font-bold text-[var(--color-text)]">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function InfoItem({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2.5">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--color-text)]">{formatValue(value)}</p>
    </div>
  )
}

function DetailsBlock({
  title,
  value,
  compact = false
}: {
  title: string
  value: unknown
  compact?: boolean
}) {
  return (
    <Card>
      <CardHeader className={compact ? 'pb-2' : undefined}>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
          {formatValue(value)}
        </p>
      </CardContent>
    </Card>
  )
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-[var(--color-surface-muted)]">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="border-b border-[var(--color-border)] px-4 py-3 text-left font-semibold text-[var(--color-text-muted)]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-[var(--color-border)]">
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="px-4 py-3 align-top text-[var(--color-text)]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
      {children}
    </div>
  )
}

function createTeacherSubjectLabels(
  teacher: AdminCrudRecord | null,
  data: TeacherRelatedData
): string[] {
  if (!teacher?.teaching_subjects) {
    return []
  }

  const subjectById = createRecordMap(data.subjects)

  return String(teacher.teaching_subjects)
    .split(/\n|,|\/|\+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const subject = getRecordById(item, subjectById)

      return subject ? getRecordName(subject) : item
    })
}

function createTeacherDisciplineRows(data: TeacherRelatedData): TeacherDisciplineRow[] {
  const subjectById = createRecordMap(data.subjects)
  const groupById = createRecordMap(data.groups)
  const semesterById = createRecordMap(data.semesters)

  return data.disciplines.map((discipline, index) => {
    const subject = getRecordById(discipline.subject_id, subjectById)
    const group = getRecordById(discipline.group_id, groupById)
    const semester = getRecordById(discipline.semester_id, semesterById)

    return {
      id: String(discipline.id ?? index),
      discipline: getDisciplineName(discipline, subjectById),
      subject: subject ? getRecordName(subject) : '—',
      group: group ? getRecordName(group) : '—',
      semester: semester ? getRecordName(semester) : '—',
      status: formatValue(discipline.status)
    }
  })
}

function createTeacherScheduleRows(data: TeacherRelatedData): TeacherScheduleRow[] {
  const disciplineById = createRecordMap(data.disciplines)
  const subjectById = createRecordMap(data.subjects)
  const groupById = createRecordMap(data.groups)
  const lessonPeriodById = createRecordMap(data.lessonPeriods)
  const lessonTypeById = createRecordMap(data.lessonTypes)
  const audienceById = createRecordMap(data.audiences)

  return data.scheduleItems.map((item, index) => {
    const discipline = getRecordById(item.discipline_id, disciplineById)
    const period = getRecordById(item.lesson_period_id, lessonPeriodById)
    const group = getRecordById(item.group_id, groupById)
    const lessonType = getRecordById(item.lesson_type_id, lessonTypeById)
    const audience = getRecordById(item.audience_id, audienceById)

    return {
      id: String(item.id ?? index),
      day: getDayLabel(item.day_of_week),
      pair: period
        ? `${formatValue(period.number)} пара (${formatValue(period.starts_at)}–${formatValue(period.ends_at)})`
        : '—',
      discipline: discipline ? getDisciplineName(discipline, subjectById) : '—',
      group: group ? getRecordName(group) : '—',
      type: lessonType ? getRecordName(lessonType) : '—',
      audience: audience ? getRecordName(audience) : '—',
      status: formatValue(item.status)
    }
  })
}

function createTeacherActivityRows(data: TeacherRelatedData): TeacherActivityRow[] {
  const scheduleItemById = createRecordMap(data.scheduleItems)
  const disciplineById = createRecordMap(data.disciplines)
  const subjectById = createRecordMap(data.subjects)
  const groupById = createRecordMap(data.groups)
  const finalAssessmentById = createRecordMap(data.finalAssessments)

  const lessonRows = data.lessonSessions.map((session, index) => {
    const scheduleItem = getRecordById(session.schedule_item_id, scheduleItemById)
    const discipline = scheduleItem ? getRecordById(scheduleItem.discipline_id, disciplineById) : null
    const group = scheduleItem ? getRecordById(scheduleItem.group_id, groupById) : null

    return {
      id: `lesson-${String(session.id ?? index)}`,
      date: formatDateForDisplay(session.lesson_date),
      type: 'Занятие',
      title: discipline ? getDisciplineName(discipline, subjectById) : formatValue(session.topic),
      group: group ? getRecordName(group) : '—',
      status: formatValue(session.status)
    }
  })

  const finalRows = data.finalAssessmentRounds.map((round, index) => {
    const assessment = getRecordById(round.final_assessment_id, finalAssessmentById)

    return {
      id: `final-${String(round.id ?? index)}`,
      date: formatDateForDisplay(round.assessment_date),
      type: 'Итоговая аттестация',
      title: assessment ? getRecordName(assessment) : `Тур #${String(round.round_number ?? '')}`,
      group: '—',
      status: formatValue(round.status)
    }
  })

  return [...lessonRows, ...finalRows].sort((first, second) =>
    second.date.localeCompare(first.date, 'ru')
  )
}

function getDisciplineName(
  discipline: AdminCrudRecord,
  subjectById: Map<number, AdminCrudRecord>
): string {
  if (discipline.name) {
    return String(discipline.name)
  }

  const subject = getRecordById(discipline.subject_id, subjectById)

  return subject ? getRecordName(subject) : `Дисциплина #${String(discipline.id ?? '')}`
}

function getRecordNameOrDash(record: AdminCrudRecord | null): string {
  return record ? getRecordName(record) : '—'
}

function createRecordMap(records: AdminCrudRecord[]): Map<number, AdminCrudRecord> {
  return new Map(
    records
      .map((record) => [toNumberOrNull(record.id), record] as const)
      .filter((entry): entry is readonly [number, AdminCrudRecord] => entry[0] !== null)
  )
}

function getRecordById(
  value: unknown,
  recordsById: Map<number, AdminCrudRecord>
): AdminCrudRecord | null {
  const id = toNumberOrNull(value)

  if (id === null) {
    return null
  }

  return recordsById.get(id) ?? null
}

function getUniqueIds(values: unknown[]): number[] {
  return Array.from(
    new Set(values.map((value) => toNumberOrNull(value)).filter((id): id is number => id !== null))
  )
}

function emptyListResult(): { items: AdminCrudRecord[] } {
  return {
    items: []
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return String(value)
}

function getPersonName(record: AdminCrudRecord): string {
  return [record.last_name, record.first_name, record.middle_name]
    .filter(Boolean)
    .map(String)
    .join(' ')
}

function getRecordName(record: AdminCrudRecord): string {
  if (record.name) {
    return String(record.name)
  }

  return getPersonName(record) || `#${String(record.id)}`
}

function getInitials(value: string): string {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }

  return value.slice(0, 2).toUpperCase()
}

function getDayLabel(value: unknown): string {
  const day = Number(value)

  if (day === 1) return 'Пн'
  if (day === 2) return 'Вт'
  if (day === 3) return 'Ср'
  if (day === 4) return 'Чт'
  if (day === 5) return 'Пт'
  if (day === 6) return 'Сб'
  if (day === 7) return 'Вс'

  return 'День не указан'
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}