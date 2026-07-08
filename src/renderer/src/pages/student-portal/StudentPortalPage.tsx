import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import {
  FiAward,
  FiBookOpen,
  FiCalendar,
  FiClipboard,
  FiRefreshCcw,
  FiTrendingUp,
  FiUserCheck,
  FiUsers
} from 'react-icons/fi'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../features/admin-crud'
import { useAuth } from '../../app/providers/AuthProvider'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../shared/ui'
import { formatDateForDisplay } from '../../shared/lib/date'

export type StudentPortalSection =
  | 'schedule'
  | 'curriculum'
  | 'teachers'
  | 'group'
  | 'journal'
  | 'performance'

interface StudentPortalPageProps {
  section: StudentPortalSection
}

interface StudentPortalData {
  student: AdminCrudRecord | null
  group: AdminCrudRecord | null
  status: AdminCrudRecord | null
  specialty: AdminCrudRecord | null
  faculty: AdminCrudRecord | null
  academicYear: AdminCrudRecord | null
  educationForm: AdminCrudRecord | null
  faculties: AdminCrudRecord[]
  specialties: AdminCrudRecord[]
  groups: AdminCrudRecord[]
  classmates: AdminCrudRecord[]
  teachers: AdminCrudRecord[]
  subjects: AdminCrudRecord[]
  curriculumPlans: AdminCrudRecord[]
  curriculumItems: AdminCrudRecord[]
  disciplines: AdminCrudRecord[]
  semesters: AdminCrudRecord[]
  weeks: AdminCrudRecord[]
  scheduleItems: AdminCrudRecord[]
  lessonPeriods: AdminCrudRecord[]
  lessonTypes: AdminCrudRecord[]
  audiences: AdminCrudRecord[]
  buildings: AdminCrudRecord[]
  lessonSessions: AdminCrudRecord[]
  attendanceRecords: AdminCrudRecord[]
  attendanceStatuses: AdminCrudRecord[]
  gradeElementTypes: AdminCrudRecord[]
  gradeItems: AdminCrudRecord[]
  grades: AdminCrudRecord[]
}

interface ScheduleRow {
  id: string
  dayOrder: number
  periodOrder: number
  day: string
  pair: string
  week: string
  group: string
  discipline: string
  teacher: string
  type: string
  audience: string
  status: string
}

interface CurriculumCourseGroup {
  key: string
  course: string
  plan: AdminCrudRecord
  items: AdminCrudRecord[]
}

interface TeacherCardRow {
  id: string
  teacherId: number
  name: string
  department: string
  subjects: string[]
  disciplineCount: number
}

interface JournalRow {
  id: string
  date: string
  discipline: string
  teacher: string
  topic: string
  attendance: string
  comment: string
}

interface GradeRow {
  id: string
  discipline: string
  work: string
  type: string
  date: string
  score: string
  numericScore: number | null
  isFinal: boolean
  resultStatus: 'graded' | 'passed' | 'failed' | 'absent'
  comment: string
}

const allSelectValue = '__all__'

const emptyData: StudentPortalData = {
  student: null,
  group: null,
  status: null,
  specialty: null,
  faculty: null,
  academicYear: null,
  educationForm: null,
  faculties: [],
  specialties: [],
  groups: [],
  classmates: [],
  teachers: [],
  subjects: [],
  curriculumPlans: [],
  curriculumItems: [],
  disciplines: [],
  semesters: [],
  weeks: [],
  scheduleItems: [],
  lessonPeriods: [],
  lessonTypes: [],
  audiences: [],
  buildings: [],
  lessonSessions: [],
  attendanceRecords: [],
  attendanceStatuses: [],
  gradeElementTypes: [],
  gradeItems: [],
  grades: []
}

export function StudentPortalPage({ section }: StudentPortalPageProps): ReactElement {
  const auth = useAuth()
  const [data, setData] = useState<StudentPortalData>(emptyData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [scheduleGroupId, setScheduleGroupId] = useState('')
  const [scheduleSemesterId, setScheduleSemesterId] = useState('')
  const [scheduleWeekId, setScheduleWeekId] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')

  const loadStudentPortal = useCallback(async () => {
    if (auth.user?.profileType !== 'student') {
      setData(emptyData)
      setError('Студенческий кабинет доступен только пользователю со студенческим профилем.')
      setIsLoading(false)
      return
    }

    const profileId = Number(auth.user.profileId)

    if (!Number.isFinite(profileId)) {
      setData(emptyData)
      setError('У пользователя не указан профиль студента.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const studentRecord = await window.api.adminCrud.getById({
        entity: 'students',
        id: profileId
      })

      if (!studentRecord) {
        setData(emptyData)
        setError('Карточка студента не найдена.')
        return
      }

      const groupId = toNumberOrNull(studentRecord.group_id)
      const statusId = toNumberOrNull(studentRecord.status_id)

      const [
        groupRecord,
        statusRecord,
        facultiesResult,
        specialtiesResult,
        groupsResult,
        teachersResult,
        subjectsResult,
        semestersResult,
        weeksResult,
        lessonPeriodsResult,
        lessonTypesResult,
        audiencesResult,
        buildingsResult,
        disciplinesResult,
        scheduleItemsResult,
        lessonSessionsResult,
        attendanceRecordsResult,
        attendanceStatusesResult,
        gradeElementTypesResult,
        gradeItemsResult,
        gradesResult
      ] = await Promise.all([
        groupId === null
          ? Promise.resolve(null)
          : window.api.adminCrud.getById({
              entity: 'student_groups',
              id: groupId
            }),
        statusId === null
          ? Promise.resolve(null)
          : window.api.adminCrud.getById({
              entity: 'dictionary_items',
              id: statusId
            }),
        window.api.adminCrud.list({
          entity: 'faculties',
          page: 1,
          pageSize: 500,
          orderBy: 'name',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'specialties',
          page: 1,
          pageSize: 1000,
          orderBy: 'name',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'student_groups',
          page: 1,
          pageSize: 3000,
          orderBy: 'name',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'teachers',
          page: 1,
          pageSize: 3000,
          orderBy: 'last_name',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'subjects',
          page: 1,
          pageSize: 3000,
          orderBy: 'name',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'semesters',
          page: 1,
          pageSize: 1000,
          orderBy: 'number',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'weeks',
          page: 1,
          pageSize: 3000,
          orderBy: 'number',
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
          entity: 'buildings',
          page: 1,
          pageSize: 500,
          orderBy: 'name',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'disciplines',
          page: 1,
          pageSize: 10000,
          orderBy: 'semester_id',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'schedule_items',
          page: 1,
          pageSize: 20000,
          orderBy: 'day_of_week',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'lesson_sessions',
          page: 1,
          pageSize: 20000,
          orderBy: 'lesson_date',
          orderDirection: 'desc'
        }),
        window.api.adminCrud.list({
          entity: 'attendance_records',
          page: 1,
          pageSize: 20000,
          filters: { student_id: profileId },
          orderBy: 'id',
          orderDirection: 'desc'
        }),
        window.api.adminCrud.list({
          entity: 'dictionary_items',
          page: 1,
          pageSize: 200,
          filters: { dictionary_key: 'attendance_statuses' },
          orderBy: 'sort_order',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'grade_element_types',
          page: 1,
          pageSize: 500,
          orderBy: 'name',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'grade_items',
          page: 1,
          pageSize: 20000,
          orderBy: 'grade_date',
          orderDirection: 'desc'
        }),
        window.api.adminCrud.list({
          entity: 'grades',
          page: 1,
          pageSize: 20000,
          filters: { student_id: profileId },
          orderBy: 'id',
          orderDirection: 'desc'
        })
      ])

      const specialtyId = toNumberOrNull(groupRecord?.specialty_id)
      const academicYearId = toNumberOrNull(groupRecord?.academic_year_id)
      const educationFormId = toNumberOrNull(groupRecord?.education_form_id)

      const specialtyRecord =
        specialtyId === null
          ? null
          : specialtiesResult.items.find((item) => Number(item.id) === specialtyId) ?? null
      const facultyId = toNumberOrNull(specialtyRecord?.faculty_id)
      const facultyRecord =
        facultyId === null
          ? null
          : facultiesResult.items.find((item) => Number(item.id) === facultyId) ?? null

      const [academicYearRecord, educationFormRecord, curriculumPlansResult, classmatesResult] =
        await Promise.all([
          academicYearId === null
            ? Promise.resolve(null)
            : window.api.adminCrud.getById({
                entity: 'academic_years',
                id: academicYearId
              }),
          educationFormId === null
            ? Promise.resolve(null)
            : window.api.adminCrud.getById({
                entity: 'dictionary_items',
                id: educationFormId
              }),
          specialtyId === null
            ? Promise.resolve(emptyListResult())
            : window.api.adminCrud.list({
                entity: 'curriculum_plans',
                page: 1,
                pageSize: 2000,
                filters: { specialty_id: specialtyId },
                orderBy: 'course',
                orderDirection: 'asc'
              }),
          groupId === null
            ? Promise.resolve(emptyListResult())
            : window.api.adminCrud.list({
                entity: 'students',
                page: 1,
                pageSize: 1000,
                filters: { group_id: groupId },
                orderBy: 'last_name',
                orderDirection: 'asc'
              })
        ])

      const curriculumPlanIds = curriculumPlansResult.items
        .map((plan) => toNumberOrNull(plan.id))
        .filter((id): id is number => id !== null)

      const curriculumItemsResult =
        curriculumPlanIds.length > 0
          ? await window.api.adminCrud.list({
              entity: 'curriculum_items',
              page: 1,
              pageSize: 10000,
              filters: { curriculum_plan_id: curriculumPlanIds },
              orderBy: 'semester_id',
              orderDirection: 'asc'
            })
          : emptyListResult()

      setData({
        student: studentRecord,
        group: groupRecord,
        status: statusRecord,
        specialty: specialtyRecord,
        faculty: facultyRecord,
        academicYear: academicYearRecord,
        educationForm: educationFormRecord,
        faculties: facultiesResult.items,
        specialties: specialtiesResult.items,
        groups: groupsResult.items,
        classmates: classmatesResult.items,
        teachers: teachersResult.items,
        subjects: subjectsResult.items,
        curriculumPlans: curriculumPlansResult.items,
        curriculumItems: curriculumItemsResult.items,
        disciplines: disciplinesResult.items,
        semesters: semestersResult.items,
        weeks: weeksResult.items,
        scheduleItems: scheduleItemsResult.items,
        lessonPeriods: lessonPeriodsResult.items,
        lessonTypes: lessonTypesResult.items,
        audiences: audiencesResult.items,
        buildings: buildingsResult.items,
        lessonSessions: lessonSessionsResult.items,
        attendanceRecords: attendanceRecordsResult.items,
        attendanceStatuses: attendanceStatusesResult.items,
        gradeElementTypes: gradeElementTypesResult.items,
        gradeItems: gradeItemsResult.items,
        grades: gradesResult.items
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить кабинет студента.')
    } finally {
      setIsLoading(false)
    }
  }, [auth.user])

  useEffect(() => {
    void loadStudentPortal()
  }, [loadStudentPortal])

  const studentName = data.student ? getPersonName(data.student) : 'Студент'
  const ownGroupId = toNumberOrNull(data.group?.id)

  const effectiveScheduleGroupId = scheduleGroupId ? Number(scheduleGroupId) : ownGroupId
  const scheduleRows = useMemo(
    () =>
      createScheduleRows({
        data,
        groupId: effectiveScheduleGroupId,
        semesterId: scheduleSemesterId,
        weekId: scheduleWeekId
      }),
    [data, effectiveScheduleGroupId, scheduleSemesterId, scheduleWeekId]
  )

  const curriculumGroups = useMemo(() => createCurriculumGroups(data), [data])
  const teacherRows = useMemo(() => createTeacherRows(data, ownGroupId), [data, ownGroupId])
  const selectedTeacher = useMemo(() => {
    const effectiveTeacherId = selectedTeacherId || teacherRows[0]?.id || ''

    return teacherRows.find((teacher) => teacher.id === effectiveTeacherId) ?? null
  }, [selectedTeacherId, teacherRows])
  const selectedTeacherScheduleRows = useMemo(
    () =>
      selectedTeacher
        ? createTeacherScheduleRows(data, selectedTeacher.teacherId)
        : [],
    [data, selectedTeacher]
  )
  const journalRows = useMemo(() => createJournalRows(data, ownGroupId), [data, ownGroupId])
  const gradeRows = useMemo(() => createGradeRows(data, ownGroupId), [data, ownGroupId])
  const intermediateGrades = useMemo(() => gradeRows.filter((row) => !row.isFinal), [gradeRows])
  const finalGrades = useMemo(() => gradeRows.filter((row) => row.isFinal), [gradeRows])
  const gradeStats = useMemo(() => createGradeStats(gradeRows), [gradeRows])

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getSectionTitle(section)}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Студенческий кабинет: расписание, учебный план, группа, журнал и успеваемость.
          </p>
        </div>

        <Button variant="secondary" onClick={() => void loadStudentPortal()} disabled={isLoading}>
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
            <p className="text-sm text-[var(--color-text-muted)]">Загрузка студенческого кабинета...</p>
          </CardContent>
        </Card>
      ) : null}

      {data.student ? (
        <>
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-lg font-bold text-white shadow-sm">
                    {getInitials(studentName)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold tracking-tight">{studentName}</h2>
                      <Badge>{data.status ? getRecordName(data.status) : 'Статус не указан'}</Badge>
                    </div>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {getStudentEducationLine(data)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {data.student.student_card_number ? (
                        <Badge variant="muted">№ {String(data.student.student_card_number)}</Badge>
                      ) : null}
                      {data.student.email ? <Badge variant="muted">{String(data.student.email)}</Badge> : null}
                      {data.student.phone ? <Badge variant="muted">{String(data.student.phone)}</Badge> : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[520px] xl:grid-cols-4">
                  <MetricCard label="Группа" value={getRecordNameOrDash(data.group)} />
                  <MetricCard label="Курс" value={getCourseLabel(data.group)} />
                  <MetricCard label="Дисциплин" value={String(getOwnDisciplines(data, ownGroupId).length)} />
                  <MetricCard label="Оценок" value={String(gradeRows.length)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {section === 'schedule' ? (
            <ScheduleSection
              data={data}
              rows={scheduleRows}
              groupId={scheduleGroupId}
              semesterId={scheduleSemesterId}
              weekId={scheduleWeekId}
              onGroupChange={setScheduleGroupId}
              onSemesterChange={setScheduleSemesterId}
              onWeekChange={setScheduleWeekId}
            />
          ) : null}

          {section === 'curriculum' ? <CurriculumSection data={data} groups={curriculumGroups} /> : null}

          {section === 'teachers' ? (
            <TeachersSection
              data={data}
              teachers={teacherRows}
              selectedTeacher={selectedTeacher}
              selectedTeacherScheduleRows={selectedTeacherScheduleRows}
              onSelectTeacher={(teacherId) => setSelectedTeacherId(teacherId)}
            />
          ) : null}

          {section === 'group' ? <MyGroupSection data={data} /> : null}

          {section === 'journal' ? (
            <JournalSection data={data} rows={journalRows} gradeRows={intermediateGrades} />
          ) : null}

          {section === 'performance' ? (
            <PerformanceSection
              stats={gradeStats}
              intermediateGrades={intermediateGrades}
              finalGrades={finalGrades}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function ScheduleSection({
  data,
  rows,
  groupId,
  semesterId,
  weekId,
  onGroupChange,
  onSemesterChange,
  onWeekChange
}: {
  data: StudentPortalData
  rows: ScheduleRow[]
  groupId: string
  semesterId: string
  weekId: string
  onGroupChange: (value: string) => void
  onSemesterChange: (value: string) => void
  onWeekChange: (value: string) => void
}) {
  const selectedSemesterWeeks = data.weeks.filter((week) => {
    return !semesterId || String(week.semester_id ?? '') === semesterId
  })

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Фильтры расписания</CardTitle>
          <CardDescription>
            По умолчанию показано расписание твоей группы. Можно выбрать другую группу, семестр и неделю.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <PortalSelect
              label="Группа"
              value={groupId}
              placeholder={`Моя группа: ${getRecordNameOrDash(data.group)}`}
              options={data.groups.map((group) => ({
                value: String(group.id),
                label: getRecordName(group)
              }))}
              onValueChange={onGroupChange}
            />

            <PortalSelect
              label="Семестр"
              value={semesterId}
              placeholder="Все семестры"
              options={data.semesters.map((semester) => ({
                value: String(semester.id),
                label: getRecordName(semester)
              }))}
              onValueChange={onSemesterChange}
            />

            <PortalSelect
              label="Неделя"
              value={weekId}
              placeholder="Все недели"
              options={selectedSemesterWeeks.map((week) => ({
                value: String(week.id),
                label: getWeekLabel(week)
              }))}
              onValueChange={onWeekChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FiCalendar className="h-5 w-5 text-[var(--color-primary)]" />
            <div>
              <CardTitle>Расписание занятий</CardTitle>
              <CardDescription>Только просмотр. Данные берутся из основного расписания.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {rows.length > 0 ? (
            <SimpleTable
              headers={['День', 'Пара', 'Неделя', 'Дисциплина', 'Преподаватель', 'Тип', 'Аудитория']}
              rows={rows.map((row) => [
                row.day,
                row.pair,
                row.week,
                row.discipline,
                row.teacher,
                row.type,
                row.audience
              ])}
            />
          ) : (
            <EmptyState>По выбранным фильтрам расписание не найдено.</EmptyState>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CurriculumSection({
  data,
  groups
}: {
  data: StudentPortalData
  groups: CurriculumCourseGroup[]
}) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FiBookOpen className="h-5 w-5 text-[var(--color-primary)]" />
            <div>
              <CardTitle>Учебный план специальности</CardTitle>
              <CardDescription>
                Подробный план по курсам: дисциплины, часы, семестры и формы контроля.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <InfoItem label="Специальность" value={getRecordNameOrDash(data.specialty)} />
            <InfoItem label="Факультет" value={getRecordNameOrDash(data.faculty)} />
            <InfoItem label="Форма обучения" value={getRecordNameOrDash(data.educationForm)} />
          </div>
        </CardContent>
      </Card>

      {groups.length > 0 ? (
        <div className="grid gap-4">
          {groups.map((group) => (
            <Card key={group.key}>
              <CardHeader>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>{group.course}</CardTitle>
                    <CardDescription>{getRecordName(group.plan)}</CardDescription>
                  </div>
                  <Badge variant="muted">Дисциплин: {group.items.length}</Badge>
                </div>
              </CardHeader>

              <CardContent>
                <SimpleTable
                  headers={[
                    'Семестр',
                    'Предмет',
                    'Всего',
                    'Лекции',
                    'Практики',
                    'Лаб.',
                    'Самост.',
                    'Контроль'
                  ]}
                  rows={group.items.map((item) => [
                    getRelationName(item.semester_id, createRecordNameMap(data.semesters)),
                    getRelationName(item.subject_id, createRecordNameMap(data.subjects)),
                    formatValue(item.hours_total),
                    formatValue(item.hours_lectures),
                    formatValue(item.hours_practices),
                    formatValue(item.hours_labs),
                    formatValue(item.hours_self_study),
                    formatControlForms(item.control_form, data.gradeElementTypes)
                  ])}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState>Учебный план для специальности пока не заполнен.</EmptyState>
      )}
    </div>
  )
}

function TeachersSection({
  data,
  teachers,
  selectedTeacher,
  selectedTeacherScheduleRows,
  onSelectTeacher
}: {
  data: StudentPortalData
  teachers: TeacherCardRow[]
  selectedTeacher: TeacherCardRow | null
  selectedTeacherScheduleRows: ScheduleRow[]
  onSelectTeacher: (teacherId: string) => void
}) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FiUserCheck className="h-5 w-5 text-[var(--color-primary)]" />
            <div>
              <CardTitle>Мои преподаватели</CardTitle>
              <CardDescription>
                Преподаватели, которые ведут дисциплины твоей группы. Выбери преподавателя, чтобы увидеть его полное расписание.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {teachers.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {teachers.map((teacher) => (
                <button
                  key={teacher.id}
                  type="button"
                  className={[
                    'rounded-2xl border p-4 text-left transition hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-muted)]',
                    selectedTeacher?.id === teacher.id
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                  ].join(' ')}
                  onClick={() => onSelectTeacher(teacher.id)}
                >
                  <p className="font-semibold text-[var(--color-text)]">{teacher.name}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">{teacher.department}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="muted">Дисциплин: {teacher.disciplineCount}</Badge>
                    {teacher.subjects.slice(0, 2).map((subject) => (
                      <Badge key={subject} variant="muted">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState>Для твоей группы пока не назначены преподаватели.</EmptyState>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedTeacher ? `Расписание преподавателя: ${selectedTeacher.name}` : 'Расписание преподавателя'}
          </CardTitle>
          <CardDescription>
            Здесь показано полное расписание выбранного преподавателя, включая занятия в других группах.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {selectedTeacherScheduleRows.length > 0 ? (
            <SimpleTable
              headers={['День', 'Пара', 'Группа', 'Дисциплина', 'Тип', 'Аудитория', 'Неделя']}
              rows={selectedTeacherScheduleRows.map((row) => [
                row.day,
                row.pair,
                row.group,
                row.discipline,
                row.type,
                row.audience,
                row.week
              ])}
            />
          ) : (
            <EmptyState>У выбранного преподавателя пока нет расписания.</EmptyState>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MyGroupSection({ data }: { data: StudentPortalData }) {
  const teacherById = createRecordMap(data.teachers)
  const dean = getRecordById(data.faculty?.dean_teacher_id, teacherById)
  const curator = getRecordById(data.group?.curator_teacher_id, teacherById)

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FiUsers className="h-5 w-5 text-[var(--color-primary)]" />
            <div>
              <CardTitle>Иерархия моей группы</CardTitle>
              <CardDescription>Факультет, специальность, группа, декан, куратор и однокурсники.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <InfoItem label="Факультет" value={getRecordNameOrDash(data.faculty)} />
            <InfoItem label="Декан" value={dean ? getPersonName(dean) : '—'} />
            <InfoItem label="Специальность" value={getRecordNameOrDash(data.specialty)} />
            <InfoItem label="Группа" value={getRecordNameOrDash(data.group)} />
            <InfoItem label="Курс" value={getCourseLabel(data.group)} />
            <InfoItem label="Куратор" value={curator ? getPersonName(curator) : '—'} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Однокурсники</CardTitle>
          <CardDescription>Студенты твоей учебной группы.</CardDescription>
        </CardHeader>

        <CardContent>
          {data.classmates.length > 0 ? (
            <SimpleTable
              headers={['ФИО', 'Студенческий', 'Email', 'Телефон']}
              rows={data.classmates.map((student) => [
                getPersonName(student),
                formatValue(student.student_card_number),
                formatValue(student.email),
                formatValue(student.phone)
              ])}
            />
          ) : (
            <EmptyState>Список однокурсников пока пуст.</EmptyState>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function JournalSection({
  rows,
  gradeRows
}: {
  data: StudentPortalData
  rows: JournalRow[]
  gradeRows: GradeRow[]
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard icon={<FiClipboard />} label="Занятий в журнале" value={String(rows.length)} />
        <SummaryCard label="Работ и контрольных" value={String(gradeRows.length)} />
        <SummaryCard label="Отметок посещаемости" value={String(rows.filter((row) => row.attendance !== '—').length)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Темы занятий и посещаемость</CardTitle>
          <CardDescription>Темы проведённых занятий, преподаватели и твои отметки посещаемости.</CardDescription>
        </CardHeader>

        <CardContent>
          {rows.length > 0 ? (
            <SimpleTable
              headers={['Дата', 'Дисциплина', 'Преподаватель', 'Тема', 'Посещение', 'Комментарий']}
              rows={rows.map((row) => [
                row.date,
                row.discipline,
                row.teacher,
                row.topic,
                row.attendance,
                row.comment
              ])}
            />
          ) : (
            <EmptyState>В журнале пока нет проведённых занятий.</EmptyState>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Контрольные и работы</CardTitle>
          <CardDescription>Промежуточные оценочные элементы по дисциплинам.</CardDescription>
        </CardHeader>

        <CardContent>
          {gradeRows.length > 0 ? (
            <SimpleTable
              headers={['Дата', 'Дисциплина', 'Работа', 'Тип', 'Результат']}
              rows={gradeRows.map((row) => [
                row.date,
                row.discipline,
                row.work,
                row.type,
                row.score
              ])}
            />
          ) : (
            <EmptyState>Промежуточных работ пока нет.</EmptyState>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PerformanceSection({
  stats,
  intermediateGrades,
  finalGrades
}: {
  stats: { total: number; average: number | null; finalCount: number }
  intermediateGrades: GradeRow[]
  finalGrades: GradeRow[]
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard icon={<FiTrendingUp />} label="Всего результатов" value={String(stats.total)} />
        <SummaryCard label="Средний балл" value={stats.average === null ? '—' : stats.average.toFixed(1)} />
        <SummaryCard icon={<FiAward />} label="Итоговых оценок" value={String(stats.finalCount)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Промежуточная успеваемость</CardTitle>
          <CardDescription>Оценки по контрольным, лабораторным, практическим и другим промежуточным элементам.</CardDescription>
        </CardHeader>

        <CardContent>
          {intermediateGrades.length > 0 ? (
            <GradeTable rows={intermediateGrades} />
          ) : (
            <EmptyState>Промежуточных оценок пока нет.</EmptyState>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
          <CardTitle>Зачётная книжка</CardTitle>
          <CardDescription>Итоговые оценочные элементы: зачёты, экзамены и финальные результаты.</CardDescription>
        </CardHeader>

        <CardContent className="p-4">
          {finalGrades.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {finalGrades.map((row) => (
                <article
                  key={row.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--color-text)]">{row.discipline}</p>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{row.type}</p>
                    </div>

                    <Badge variant={getGradeBadgeVariant(row)}>{row.score}</Badge>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-[var(--color-text-muted)]">
                    <div className="flex justify-between gap-3">
                      <span>Элемент</span>
                      <span className="text-right font-medium text-[var(--color-text)]">{row.work}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Дата</span>
                      <span className="text-right font-medium text-[var(--color-text)]">{row.date}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState>Итоговых оценок пока нет.</EmptyState>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function GradeTable({ rows }: { rows: GradeRow[] }) {
  return (
    <SimpleTable
      headers={['Дата', 'Дисциплина', 'Работа', 'Тип', 'Результат', 'Комментарий']}
      rows={rows.map((row) => [
        row.date,
        row.discipline,
        row.work,
        row.type,
        row.score,
        row.comment
      ])}
    />
  )
}

function PortalSelect({
  label,
  value,
  placeholder,
  options,
  onValueChange
}: {
  label: string
  value: string
  placeholder: string
  options: AdminCrudSelectOption[]
  onValueChange: (value: string) => void
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-[var(--color-text)]">{label}</span>
      <Select
        value={value || allSelectValue}
        onValueChange={(nextValue) => onValueChange(nextValue === allSelectValue ? '' : nextValue)}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value={allSelectValue}>{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
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
          {icon ?? <FiClipboard />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">{label}</p>
          <p className="truncate text-lg font-bold text-[var(--color-text)]">{value}</p>
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
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  className="px-4 py-3 align-top text-[var(--color-text)]"
                >
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

function createScheduleRows({
  data,
  groupId,
  semesterId,
  weekId
}: {
  data: StudentPortalData
  groupId: number | null
  semesterId: string
  weekId: string
}): ScheduleRow[] {
  const disciplineById = createRecordMap(data.disciplines)
  const subjectById = createRecordMap(data.subjects)
  const teacherById = createRecordMap(data.teachers)
  const groupById = createRecordMap(data.groups)
  const weekById = createRecordMap(data.weeks)
  const periodById = createRecordMap(data.lessonPeriods)
  const lessonTypeById = createRecordMap(data.lessonTypes)
  const audienceById = createRecordMap(data.audiences)

  return data.scheduleItems
    .filter((item) => {
      if (groupId !== null && Number(item.group_id) !== groupId) {
        return false
      }

      if (semesterId && String(item.semester_id ?? '') !== semesterId) {
        return false
      }

      if (weekId && String(item.week_id ?? '') !== weekId) {
        return false
      }

      return true
    })
    .map((item, index) => {
      const discipline = getRecordById(item.discipline_id, disciplineById)
      const teacher = getRecordById(item.teacher_id, teacherById)
      const group = getRecordById(item.group_id, groupById)
      const week = getRecordById(item.week_id, weekById)
      const period = getRecordById(item.lesson_period_id, periodById)
      const lessonType = getRecordById(item.lesson_type_id, lessonTypeById)
      const audience = getRecordById(item.audience_id, audienceById)

      return {
        id: String(item.id ?? index),
        dayOrder: Number(item.day_of_week ?? 999),
        periodOrder: Number(period?.number ?? 999),
        day: getDayLabel(item.day_of_week),
        pair: period
          ? `${formatValue(period.number)} пара (${formatValue(period.starts_at)}–${formatValue(period.ends_at)})`
          : '—',
        week: week ? getWeekLabel(week) : '—',
        group: group ? getRecordName(group) : '—',
        discipline: discipline ? getDisciplineName(discipline, subjectById) : '—',
        teacher: teacher ? getPersonName(teacher) : '—',
        type: lessonType ? getRecordName(lessonType) : '—',
        audience: audience ? getRecordName(audience) : '—',
        status: formatValue(item.status)
      }
    })
    .sort((first, second) => first.dayOrder - second.dayOrder || first.periodOrder - second.periodOrder)
}

function createTeacherScheduleRows(data: StudentPortalData, teacherId: number): ScheduleRow[] {
  return createScheduleRows({
    data: {
      ...data,
      scheduleItems: data.scheduleItems.filter((item) => Number(item.teacher_id) === teacherId)
    },
    groupId: null,
    semesterId: '',
    weekId: ''
  })
}

function createCurriculumGroups(data: StudentPortalData): CurriculumCourseGroup[] {
  const itemsByPlanId = new Map<number, AdminCrudRecord[]>()

  data.curriculumItems.forEach((item) => {
    const planId = toNumberOrNull(item.curriculum_plan_id)

    if (planId === null) {
      return
    }

    const items = itemsByPlanId.get(planId) ?? []
    items.push(item)
    itemsByPlanId.set(planId, items)
  })

  return data.curriculumPlans
    .map((plan) => {
      const planId = toNumberOrNull(plan.id) ?? -1
      const course = toNumberOrNull(plan.course)

      return {
        key: String(plan.id ?? plan.name),
        course: course === null ? 'Курс не указан' : `${course} курс`,
        plan,
        items: [...(itemsByPlanId.get(planId) ?? [])].sort(
          (first, second) => Number(first.semester_id ?? 999) - Number(second.semester_id ?? 999)
        )
      }
    })
    .sort((first, second) => Number(first.plan.course ?? 999) - Number(second.plan.course ?? 999))
}

function createTeacherRows(data: StudentPortalData, ownGroupId: number | null): TeacherCardRow[] {
  const subjectById = createRecordMap(data.subjects)
  const teacherById = createRecordMap(data.teachers)
  const departmentById = new Map<number, AdminCrudRecord>()
  const teacherMap = new Map<number, TeacherCardRow>()

  data.disciplines
    .filter((discipline) => ownGroupId !== null && Number(discipline.group_id) === ownGroupId)
    .forEach((discipline) => {
      const teacher = getRecordById(discipline.teacher_id, teacherById)
      const teacherId = toNumberOrNull(teacher?.id)

      if (!teacher || teacherId === null) {
        return
      }

      const subject = getRecordById(discipline.subject_id, subjectById)
      const department = getRecordById(teacher.department_id, departmentById)
      const current = teacherMap.get(teacherId) ?? {
        id: String(teacherId),
        teacherId,
        name: getPersonName(teacher),
        department: department ? getRecordName(department) : 'Кафедра не указана',
        subjects: [],
        disciplineCount: 0
      }

      current.disciplineCount += 1

      if (subject) {
        const subjectName = getRecordName(subject)

        if (!current.subjects.includes(subjectName)) {
          current.subjects.push(subjectName)
        }
      }

      teacherMap.set(teacherId, current)
    })

  return Array.from(teacherMap.values()).sort((first, second) =>
    first.name.localeCompare(second.name, 'ru')
  )
}

function createJournalRows(data: StudentPortalData, ownGroupId: number | null): JournalRow[] {
  const scheduleItemById = createRecordMap(data.scheduleItems)
  const disciplineById = createRecordMap(data.disciplines)
  const subjectById = createRecordMap(data.subjects)
  const teacherById = createRecordMap(data.teachers)
  const attendanceBySessionId = new Map<number, AdminCrudRecord>()
  const attendanceStatusById = createRecordMap(data.attendanceStatuses)

  data.attendanceRecords.forEach((record) => {
    const sessionId = toNumberOrNull(record.lesson_session_id)

    if (sessionId !== null) {
      attendanceBySessionId.set(sessionId, record)
    }
  })

  return data.lessonSessions
    .filter((session) => {
      const scheduleItem = getRecordById(session.schedule_item_id, scheduleItemById)

      return ownGroupId !== null && Number(scheduleItem?.group_id) === ownGroupId
    })
    .map((session, index) => {
      const scheduleItem = getRecordById(session.schedule_item_id, scheduleItemById)
      const discipline = scheduleItem ? getRecordById(scheduleItem.discipline_id, disciplineById) : null
      const teacher = getRecordById(session.teacher_id ?? scheduleItem?.teacher_id, teacherById)
      const attendance = getRecordById(attendanceBySessionId.get(Number(session.id))?.attendance_status_id, attendanceStatusById)
      const attendanceRecord = attendanceBySessionId.get(Number(session.id))

      return {
        id: String(session.id ?? index),
        date: formatDateForDisplay(session.lesson_date),
        discipline: discipline ? getDisciplineName(discipline, subjectById) : '—',
        teacher: teacher ? getPersonName(teacher) : '—',
        topic: formatValue(session.topic),
        attendance: attendance ? getRecordName(attendance) : '—',
        comment: formatValue(attendanceRecord?.comment)
      }
    })
    .sort((first, second) => second.date.localeCompare(first.date, 'ru'))
}

function createGradeRows(data: StudentPortalData, ownGroupId: number | null): GradeRow[] {
  const gradeItemById = createRecordMap(data.gradeItems)
  const disciplineById = createRecordMap(data.disciplines)
  const subjectById = createRecordMap(data.subjects)
  const gradeElementTypeById = createRecordMap(data.gradeElementTypes)

  return data.grades
    .map((grade, index) => {
      const gradeItem = getRecordById(grade.grade_item_id, gradeItemById)
      const discipline = gradeItem ? getRecordById(gradeItem.discipline_id, disciplineById) : null
      const gradeElementType = gradeItem
        ? getRecordById(gradeItem.grade_element_type_id, gradeElementTypeById)
        : null
      const resultStatus = getGradeResultStatus(grade, gradeElementType)
      const numericScore = resultStatus === 'absent' ? null : toNumberOrNull(grade.score)

      return {
        id: String(grade.id ?? index),
        discipline: discipline ? getDisciplineName(discipline, subjectById) : '—',
        work: gradeItem ? getRecordName(gradeItem) : `Работа #${String(grade.grade_item_id ?? '')}`,
        type: gradeElementType ? getRecordName(gradeElementType) : '—',
        date: formatDateForDisplay(gradeItem?.grade_date),
        score: getScoreLabel(grade, gradeItem, gradeElementType),
        numericScore,
        isFinal: isTruthy(gradeElementType?.is_final),
        resultStatus,
        comment: formatValue(grade.comment)
      }
    })
    .filter((row) => {
      if (ownGroupId === null) {
        return true
      }

      const gradeItem = getRecordById(row.id, new Map())
      void gradeItem

      return true
    })
    .sort((first, second) => second.date.localeCompare(first.date, 'ru'))
}

function createGradeStats(rows: GradeRow[]): { total: number; average: number | null; finalCount: number } {
  const numericScores = rows
    .map((row) => row.numericScore)
    .filter((score): score is number => score !== null)
  const average =
    numericScores.length > 0
      ? numericScores.reduce((sum, score) => sum + score, 0) / numericScores.length
      : null

  return {
    total: rows.length,
    average,
    finalCount: rows.filter((row) => row.isFinal).length
  }
}

function getOwnDisciplines(data: StudentPortalData, ownGroupId: number | null): AdminCrudRecord[] {
  return data.disciplines.filter((discipline) => {
    return ownGroupId !== null && Number(discipline.group_id) === ownGroupId
  })
}

function getScoreLabel(
  grade: AdminCrudRecord,
  gradeItem: AdminCrudRecord | null,
  gradeElementType: AdminCrudRecord | null
): string {
  const resultStatus = getGradeResultStatus(grade, gradeElementType)

  if (resultStatus === 'absent') return 'Неявка'
  if (resultStatus === 'passed') return 'Сдал'
  if (resultStatus === 'failed') return 'Не сдал'

  const score = formatValue(grade.score)

  if (!gradeItem?.max_score) {
    return score
  }

  return `${score} / ${formatValue(gradeItem.max_score)}`
}

function getGradeResultStatus(
  grade: AdminCrudRecord,
  gradeElementType: AdminCrudRecord | null
): 'graded' | 'passed' | 'failed' | 'absent' {
  const resultStatus = String(grade.result_status ?? '')

  if (resultStatus === 'absent' || resultStatus === 'passed' || resultStatus === 'failed') {
    return resultStatus
  }

  if (gradeElementType?.grading_mode === 'pass_fail') {
    return Number(grade.score) >= 1 ? 'passed' : 'failed'
  }

  return 'graded'
}

function getGradeBadgeVariant(row: GradeRow): 'default' | 'success' | 'warning' | 'danger' | 'muted' {
  if (row.resultStatus === 'absent' || row.resultStatus === 'failed') return 'danger'
  if (row.resultStatus === 'passed') return 'success'
  if (row.isFinal) return 'warning'

  return row.numericScore === null ? 'muted' : 'default'
}

function formatControlForms(value: unknown, gradeElementTypes: AdminCrudRecord[]): string {
  const gradeElementTypeById = createRecordMap(gradeElementTypes)
  const rawItems = parseMultiValue(value)

  if (rawItems.length === 0) {
    return '—'
  }

  return rawItems
    .map((item) => {
      const type = getRecordById(item, gradeElementTypeById)

      return type ? getRecordName(type) : String(item)
    })
    .join(', ')
}

function parseMultiValue(value: unknown): string[] {
  const rawValue = String(value ?? '').trim()

  if (!rawValue) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue)

    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item)).filter(Boolean)
    }
  } catch {
    return rawValue
      .split(/\n|,|\/|\+/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function createRecordMap(records: AdminCrudRecord[]): Map<number, AdminCrudRecord> {
  return new Map(
    records
      .map((record) => [toNumberOrNull(record.id), record] as const)
      .filter((entry): entry is readonly [number, AdminCrudRecord] => entry[0] !== null)
  )
}

function createRecordNameMap(records: AdminCrudRecord[]): Map<number, string> {
  return new Map(
    records
      .map((record) => [toNumberOrNull(record.id), getRecordName(record)] as const)
      .filter((entry): entry is readonly [number, string] => entry[0] !== null)
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

function getRelationName(value: unknown, labelsById: Map<number, string>): string {
  const id = toNumberOrNull(value)

  if (id === null) {
    return '—'
  }

  return labelsById.get(id) ?? `#${id}`
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

function getStudentEducationLine(data: StudentPortalData): string {
  const parts = [
    data.group ? `Группа ${getRecordName(data.group)}` : null,
    getCourseLabel(data.group),
    data.specialty ? getRecordName(data.specialty) : null,
    data.faculty ? getRecordName(data.faculty) : null
  ].filter((part) => part && part !== '—')

  return parts.length > 0 ? parts.join(' · ') : 'Учебная принадлежность не указана'
}

function getSectionTitle(section: StudentPortalSection): string {
  if (section === 'schedule') return 'Расписание'
  if (section === 'curriculum') return 'Учебный план'
  if (section === 'teachers') return 'Преподаватели'
  if (section === 'group') return 'Моя группа'
  if (section === 'journal') return 'Журнал'

  return 'Успеваемость'
}

function getCourseLabel(group: AdminCrudRecord | null): string {
  if (!group?.course) {
    return '—'
  }

  return `${String(group.course)} курс`
}

function getRecordNameOrDash(record: AdminCrudRecord | null): string {
  return record ? getRecordName(record) : '—'
}

function getWeekLabel(week: AdminCrudRecord): string {
  const parts = [
    week.number ? `${String(week.number)} неделя` : getRecordName(week),
    week.week_type ? String(week.week_type) : null,
    week.starts_at && week.ends_at
      ? `${formatDateForDisplay(week.starts_at)} — ${formatDateForDisplay(week.ends_at)}`
      : null
  ].filter(Boolean)

  return parts.join(' · ')
}

function getDayLabel(value: unknown): string {
  const day = Number(value)

  if (day === 1) return 'Понедельник'
  if (day === 2) return 'Вторник'
  if (day === 3) return 'Среда'
  if (day === 4) return 'Четверг'
  if (day === 5) return 'Пятница'
  if (day === 6) return 'Суббота'
  if (day === 7) return 'Воскресенье'

  return 'День не указан'
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
    .trim()
}

function getRecordName(record: AdminCrudRecord): string {
  if (record.name) {
    return String(record.name)
  }

  if (record.short_name) {
    return String(record.short_name)
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

function isTruthy(value: unknown): boolean {
  if (value === true || value === 1) {
    return true
  }

  const normalizedValue = String(value ?? '').trim().toLowerCase()

  return normalizedValue === '1' || normalizedValue === 'true' || normalizedValue === 'yes'
}

function emptyListResult(): { items: AdminCrudRecord[] } {
  return {
    items: []
  }
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}