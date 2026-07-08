import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import {
  FiAward,
  FiBookOpen,
  FiCalendar,
  FiClipboard,
  FiClock,
  FiMapPin,
  FiRefreshCcw,
  FiSearch,
  FiSettings,
  FiTrendingUp,
  FiUser,
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
  Input,
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
  | 'settings'

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
  departments: AdminCrudRecord[]
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
  item: AdminCrudRecord
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
  semesterGroups: CurriculumSemesterGroup[]
}

interface CurriculumSemesterGroup {
  key: string
  title: string
  sortOrder: number
  items: AdminCrudRecord[]
  totalHours: number
}

interface TeacherCardRow {
  id: string
  teacherId: number
  departmentId: number | null
  subjectIds: number[]
  name: string
  department: string
  subjects: string[]
  disciplineCount: number
  teachesOwnGroup: boolean
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
  disciplineId: number | null
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
const dayNumbers = [1, 2, 3, 4, 5, 6, 7]

const emptyData: StudentPortalData = {
  student: null,
  group: null,
  status: null,
  specialty: null,
  faculty: null,
  academicYear: null,
  educationForm: null,
  faculties: [],
  departments: [],
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

  const [journalSemesterId, setJournalSemesterId] = useState('')
  const [journalWeekId, setJournalWeekId] = useState('')

  const [teacherSearch, setTeacherSearch] = useState('')
  const [teacherDepartmentId, setTeacherDepartmentId] = useState('')
  const [teacherSubjectId, setTeacherSubjectId] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')

  const [performanceDisciplineId, setPerformanceDisciplineId] = useState('')

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
        departmentsResult,
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
          entity: 'departments',
          page: 1,
          pageSize: 1000,
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
          : (specialtiesResult.items.find((item) => Number(item.id) === specialtyId) ?? null)
      const facultyId = toNumberOrNull(specialtyRecord?.faculty_id)
      const facultyRecord =
        facultyId === null
          ? null
          : (facultiesResult.items.find((item) => Number(item.id) === facultyId) ?? null)

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
        departments: departmentsResult.items,
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
      setError(
        loadError instanceof Error ? loadError.message : 'Не удалось загрузить кабинет студента.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [auth.user])

  useEffect(() => {
    void loadStudentPortal()
  }, [loadStudentPortal])

  const ownGroupId = toNumberOrNull(data.group?.id)
  const defaultSemesterId = useMemo(() => getDefaultSemesterId(data), [data])
  const defaultScheduleWeekId = useMemo(
    () => getDefaultWeekId(data, scheduleSemesterId || defaultSemesterId),
    [data, defaultSemesterId, scheduleSemesterId]
  )
  const defaultJournalWeekId = useMemo(
    () => getDefaultWeekId(data, journalSemesterId || defaultSemesterId),
    [data, defaultSemesterId, journalSemesterId]
  )

  const effectiveScheduleGroupId = scheduleGroupId ? Number(scheduleGroupId) : ownGroupId
  const effectiveScheduleSemesterId = scheduleSemesterId || defaultSemesterId
  const effectiveScheduleWeekId = scheduleWeekId || defaultScheduleWeekId
  const effectiveJournalSemesterId = journalSemesterId || defaultSemesterId
  const effectiveJournalWeekId = journalWeekId || defaultJournalWeekId

  const scheduleRows = useMemo(
    () =>
      createScheduleRows({
        data,
        groupId: effectiveScheduleGroupId,
        semesterId: effectiveScheduleSemesterId,
        weekId: effectiveScheduleWeekId
      }),
    [data, effectiveScheduleGroupId, effectiveScheduleSemesterId, effectiveScheduleWeekId]
  )

  const curriculumGroups = useMemo(() => createCurriculumGroups(data), [data])
  const allTeacherRows = useMemo(() => createTeacherRows(data, ownGroupId), [data, ownGroupId])
  const filteredTeacherRows = useMemo(
    () =>
      filterTeacherRows({
        teachers: allTeacherRows,
        search: teacherSearch,
        departmentId: teacherDepartmentId,
        subjectId: teacherSubjectId
      }),
    [allTeacherRows, teacherDepartmentId, teacherSearch, teacherSubjectId]
  )
  const selectedTeacher = useMemo(() => {
    const effectiveTeacherId = selectedTeacherId || filteredTeacherRows[0]?.id || ''

    return allTeacherRows.find((teacher) => teacher.id === effectiveTeacherId) ?? null
  }, [allTeacherRows, filteredTeacherRows, selectedTeacherId])
  const selectedTeacherScheduleRows = useMemo(
    () => (selectedTeacher ? createTeacherScheduleRows(data, selectedTeacher.teacherId) : []),
    [data, selectedTeacher]
  )
  const journalRows = useMemo(() => createJournalRows(data, ownGroupId), [data, ownGroupId])
  const gradeRows = useMemo(() => createGradeRows(data), [data])
  const performanceDisciplineOptions = useMemo(
    () => createGradeDisciplineOptions(gradeRows),
    [gradeRows]
  )
  const filteredGradeRows = useMemo(
    () => filterGradeRowsByDiscipline(gradeRows, performanceDisciplineId),
    [gradeRows, performanceDisciplineId]
  )
  const intermediateGrades = useMemo(
    () => filteredGradeRows.filter((row) => !row.isFinal),
    [filteredGradeRows]
  )
  const finalGrades = useMemo(() => filteredGradeRows.filter((row) => row.isFinal), [filteredGradeRows])
  const gradeStats = useMemo(() => createGradeStats(filteredGradeRows), [filteredGradeRows])

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getSectionTitle(section)}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {getSectionDescription(section)}
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
            <p className="text-sm text-[var(--color-text-muted)]">
              Загрузка студенческого кабинета...
            </p>
          </CardContent>
        </Card>
      ) : null}

      {data.student ? (
        <>
          {section === 'schedule' ? (
            <ScheduleSection
              data={data}
              rows={scheduleRows}
              groupId={scheduleGroupId}
              semesterId={scheduleSemesterId}
              weekId={scheduleWeekId}
              effectiveSemesterId={effectiveScheduleSemesterId}
              effectiveWeekId={effectiveScheduleWeekId}
              onGroupChange={setScheduleGroupId}
              onSemesterChange={(value) => {
                setScheduleSemesterId(value)
                setScheduleWeekId('')
              }}
              onWeekChange={setScheduleWeekId}
            />
          ) : null}

          {section === 'curriculum' ? (
            <CurriculumSection data={data} groups={curriculumGroups} />
          ) : null}

          {section === 'teachers' ? (
            <TeachersSection
              data={data}
              teachers={filteredTeacherRows}
              allTeacherCount={allTeacherRows.length}
              selectedTeacher={selectedTeacher}
              selectedTeacherScheduleRows={selectedTeacherScheduleRows}
              search={teacherSearch}
              departmentId={teacherDepartmentId}
              subjectId={teacherSubjectId}
              onSearchChange={setTeacherSearch}
              onDepartmentChange={setTeacherDepartmentId}
              onSubjectChange={setTeacherSubjectId}
              onSelectTeacher={(teacherId) => setSelectedTeacherId(teacherId)}
            />
          ) : null}

          {section === 'group' ? <MyGroupSection data={data} /> : null}

          {section === 'journal' ? (
            <JournalSection
              data={data}
              rows={journalRows}
              ownGroupId={ownGroupId}
              semesterId={journalSemesterId}
              weekId={journalWeekId}
              effectiveSemesterId={effectiveJournalSemesterId}
              effectiveWeekId={effectiveJournalWeekId}
              gradeRows={gradeRows.filter((row) => !row.isFinal)}
              onSemesterChange={(value) => {
                setJournalSemesterId(value)
                setJournalWeekId('')
              }}
              onWeekChange={setJournalWeekId}
            />
          ) : null}

          {section === 'performance' ? (
            <PerformanceSection
              stats={gradeStats}
              disciplineId={performanceDisciplineId}
              disciplineOptions={performanceDisciplineOptions}
              intermediateGrades={intermediateGrades}
              finalGrades={finalGrades}
              onDisciplineChange={setPerformanceDisciplineId}
            />
          ) : null}

          {section === 'settings' ? <SettingsSection data={data} username={auth.user.username} /> : null}
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
  effectiveSemesterId,
  effectiveWeekId,
  onGroupChange,
  onSemesterChange,
  onWeekChange
}: {
  data: StudentPortalData
  rows: ScheduleRow[]
  groupId: string
  semesterId: string
  weekId: string
  effectiveSemesterId: string
  effectiveWeekId: string
  onGroupChange: (value: string) => void
  onSemesterChange: (value: string) => void
  onWeekChange: (value: string) => void
}) {
  const selectedSemesterWeeks = data.weeks.filter((week) => {
    return !effectiveSemesterId || String(week.semester_id ?? '') === effectiveSemesterId
  })

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <FiCalendar className="mt-1 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
            <div>
              <CardTitle>Расписание занятий</CardTitle>
              <CardDescription>
                По умолчанию открывается расписание твоей группы на текущий или ближайший семестр и
                неделю. Фильтрами можно посмотреть расписание других групп.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 xl:grid-cols-3">
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
              placeholder={
                effectiveSemesterId
                  ? `Автоматически: ${getRelationName(effectiveSemesterId, createRecordNameMap(data.semesters))}`
                  : 'Все семестры'
              }
              options={data.semesters.map((semester) => ({
                value: String(semester.id),
                label: getRecordName(semester)
              }))}
              onValueChange={onSemesterChange}
            />

            <PortalSelect
              label="Неделя"
              value={weekId}
              placeholder={
                effectiveWeekId
                  ? `Автоматически: ${getRelationName(effectiveWeekId, createWeekNameMap(data.weeks))}`
                  : 'Все недели'
              }
              options={selectedSemesterWeeks.map((week) => ({
                value: String(week.id),
                label: getWeekLabel(week)
              }))}
              onValueChange={onWeekChange}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="muted">
              Группа: {groupId ? getRelationName(groupId, createRecordNameMap(data.groups)) : getRecordNameOrDash(data.group)}
            </Badge>
            {effectiveSemesterId ? (
              <Badge variant="muted">
                Семестр: {getRelationName(effectiveSemesterId, createRecordNameMap(data.semesters))}
              </Badge>
            ) : null}
            {effectiveWeekId ? (
              <Badge variant="muted">
                Неделя: {getRelationName(effectiveWeekId, createWeekNameMap(data.weeks))}
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <ReadOnlyScheduleWeekBoard rows={rows} />
    </div>
  )
}

function ReadOnlyScheduleWeekBoard({ rows }: { rows: ScheduleRow[] }) {
  const rowsByDay = useMemo(() => {
    const result = new Map<number, ScheduleRow[]>()

    rows.forEach((row) => {
      const dayRows = result.get(row.dayOrder) ?? []
      dayRows.push(row)
      result.set(row.dayOrder, dayRows)
    })

    return result
  }, [rows])

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {dayNumbers.map((dayNumber) => {
        const dayRows = [...(rowsByDay.get(dayNumber) ?? [])].sort(
          (first, second) => first.periodOrder - second.periodOrder
        )

        return (
          <Card key={dayNumber} className="min-h-64 overflow-hidden">
            <CardHeader className="bg-[var(--color-surface-muted)]">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">{getDayLabel(dayNumber)}</CardTitle>
                <Badge variant={dayRows.length > 0 ? 'default' : 'muted'}>
                  {dayRows.length} {getLessonCountText(dayRows.length)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="grid gap-3 p-4">
              {dayRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
                  Занятий нет.
                </div>
              ) : null}

              {dayRows.map((row) => (
                <article
                  key={row.id}
                  className="grid gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">{row.discipline}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                        <span className="inline-flex items-center gap-1">
                          <FiClock />
                          {row.pair}
                        </span>
                        {row.type !== '—' ? <Badge variant="muted">{row.type}</Badge> : null}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-1 text-xs text-[var(--color-text-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <FiUser />
                      {row.teacher}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <FiMapPin />
                      {row.audience}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <FiUsers />
                      {row.group}
                    </span>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        )
      })}
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
                План разделён на курсы и семестры. Внутри — дисциплины, часы и формы контроля.
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
            <Card key={group.key} className="overflow-hidden">
              <CardHeader className="bg-[var(--color-surface-muted)]">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>{group.course}</CardTitle>
                    <CardDescription>{getRecordName(group.plan)}</CardDescription>
                  </div>
                  <Badge variant="muted">
                    Семестров: {group.semesterGroups.length}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="grid gap-4">
                {group.semesterGroups.map((semesterGroup) => (
                  <section
                    key={semesterGroup.key}
                    className="overflow-hidden rounded-xl border border-[var(--color-border)]"
                  >
                    <div className="flex flex-col gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-semibold text-[var(--color-text)]">
                          {semesterGroup.title}
                        </h3>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          Дисциплины семестра и распределение часов.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="muted">Дисциплин: {semesterGroup.items.length}</Badge>
                        <Badge variant="muted">Часов: {semesterGroup.totalHours}</Badge>
                      </div>
                    </div>

                    <SimpleTable
                      headers={[
                        'Предмет',
                        'Всего',
                        'Лекции',
                        'Практики',
                        'Лаб.',
                        'Самост.',
                        'Контроль'
                      ]}
                      rows={semesterGroup.items.map((item) => [
                        getRelationName(item.subject_id, createRecordNameMap(data.subjects)),
                        formatValue(item.hours_total),
                        formatValue(item.hours_lectures),
                        formatValue(item.hours_practices),
                        formatValue(item.hours_labs),
                        formatValue(item.hours_self_study),
                        formatControlForms(item.control_form, data.gradeElementTypes)
                      ])}
                    />
                  </section>
                ))}
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
  allTeacherCount,
  selectedTeacher,
  selectedTeacherScheduleRows,
  search,
  departmentId,
  subjectId,
  onSearchChange,
  onDepartmentChange,
  onSubjectChange,
  onSelectTeacher
}: {
  data: StudentPortalData
  teachers: TeacherCardRow[]
  allTeacherCount: number
  selectedTeacher: TeacherCardRow | null
  selectedTeacherScheduleRows: ScheduleRow[]
  search: string
  departmentId: string
  subjectId: string
  onSearchChange: (value: string) => void
  onDepartmentChange: (value: string) => void
  onSubjectChange: (value: string) => void
  onSelectTeacher: (teacherId: string) => void
}) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <FiUserCheck className="mt-1 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
            <div>
              <CardTitle>Преподаватели</CardTitle>
              <CardDescription>
                Поиск доступен по всем преподавателям. Выбери преподавателя, чтобы увидеть его полное
                расписание во всех группах.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr]">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--color-text)]">Поиск</span>
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <Input
                  className="pl-9"
                  value={search}
                  placeholder="ФИО, кафедра или предмет"
                  onChange={(event) => onSearchChange(event.target.value)}
                />
              </div>
            </label>

            <PortalSelect
              label="Кафедра"
              value={departmentId}
              placeholder="Все кафедры"
              options={data.departments.map((department) => ({
                value: String(department.id),
                label: getRecordName(department)
              }))}
              onValueChange={onDepartmentChange}
            />

            <PortalSelect
              label="Предмет"
              value={subjectId}
              placeholder="Все предметы"
              options={data.subjects.map((subject) => ({
                value: String(subject.id),
                label: getRecordName(subject)
              }))}
              onValueChange={onSubjectChange}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="muted">Найдено: {teachers.length}</Badge>
            <Badge variant="muted">Всего: {allTeacherCount}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Список преподавателей</CardTitle>
            <CardDescription>Карточки преподавателей с краткой информацией.</CardDescription>
          </CardHeader>

          <CardContent>
            {teachers.length > 0 ? (
              <div className="grid max-h-[640px] gap-3 overflow-y-auto pr-1">
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
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--color-text)]">{teacher.name}</p>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                          {teacher.department}
                        </p>
                      </div>

                      {teacher.teachesOwnGroup ? <Badge variant="success">Мой</Badge> : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="muted">Дисциплин: {teacher.disciplineCount}</Badge>
                      {teacher.subjects.slice(0, 3).map((subject) => (
                        <Badge key={subject} variant="muted">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState>По выбранным фильтрам преподаватели не найдены.</EmptyState>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedTeacher ? `Расписание: ${selectedTeacher.name}` : 'Расписание преподавателя'}
            </CardTitle>
            <CardDescription>
              Полное расписание выбранного преподавателя, включая занятия в других группах.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {selectedTeacherScheduleRows.length > 0 ? (
              <ReadOnlyScheduleWeekBoard rows={selectedTeacherScheduleRows} />
            ) : (
              <EmptyState>У выбранного преподавателя пока нет расписания.</EmptyState>
            )}
          </CardContent>
        </Card>
      </div>
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
  data,
  rows,
  ownGroupId,
  semesterId,
  weekId,
  effectiveSemesterId,
  effectiveWeekId,
  gradeRows,
  onSemesterChange,
  onWeekChange
}: {
  data: StudentPortalData
  rows: JournalRow[]
  ownGroupId: number | null
  semesterId: string
  weekId: string
  effectiveSemesterId: string
  effectiveWeekId: string
  gradeRows: GradeRow[]
  onSemesterChange: (value: string) => void
  onWeekChange: (value: string) => void
}) {
  const selectedSemesterWeeks = data.weeks.filter((week) => {
    return !effectiveSemesterId || String(week.semester_id ?? '') === effectiveSemesterId
  })
  const scheduleRows = useMemo(
    () =>
      createScheduleRows({
        data,
        groupId: ownGroupId,
        semesterId: effectiveSemesterId,
        weekId: effectiveWeekId
      }),
    [data, effectiveSemesterId, effectiveWeekId, ownGroupId]
  )

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <FiClipboard className="mt-1 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
            <div>
              <CardTitle>Журнал моей группы</CardTitle>
              <CardDescription>
                Read-only матрица как в админском журнале: дни недели, пары, темы занятий и твои
                отметки посещаемости. Группа выбрана автоматически.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <PortalSelect
              label="Семестр"
              value={semesterId}
              placeholder={
                effectiveSemesterId
                  ? `Автоматически: ${getRelationName(effectiveSemesterId, createRecordNameMap(data.semesters))}`
                  : 'Все семестры'
              }
              options={data.semesters.map((semester) => ({
                value: String(semester.id),
                label: getRecordName(semester)
              }))}
              onValueChange={onSemesterChange}
            />

            <PortalSelect
              label="Неделя"
              value={weekId}
              placeholder={
                effectiveWeekId
                  ? `Автоматически: ${getRelationName(effectiveWeekId, createWeekNameMap(data.weeks))}`
                  : 'Все недели'
              }
              options={selectedSemesterWeeks.map((week) => ({
                value: String(week.id),
                label: getWeekLabel(week)
              }))}
              onValueChange={onWeekChange}
            />
          </div>
        </CardContent>
      </Card>

      <StudentJournalMatrix data={data} scheduleRows={scheduleRows} />

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard icon={<FiClipboard />} label="Занятий с отметками" value={String(rows.length)} />
        <SummaryCard label="Работ и контрольных" value={String(gradeRows.length)} />
        <SummaryCard
          label="Отметок посещаемости"
          value={String(rows.filter((row) => row.attendance !== '—').length)}
        />
      </div>

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

function StudentJournalMatrix({
  data,
  scheduleRows
}: {
  data: StudentPortalData
  scheduleRows: ScheduleRow[]
}) {
  const attendanceByScheduleItemId = useMemo(() => {
    const sessionByScheduleItemId = new Map<number, AdminCrudRecord>()

    data.lessonSessions.forEach((session) => {
      const scheduleItemId = toNumberOrNull(session.schedule_item_id)

      if (scheduleItemId !== null) {
        sessionByScheduleItemId.set(scheduleItemId, session)
      }
    })

    const attendanceByScheduleItem = new Map<number, AdminCrudRecord>()

    data.attendanceRecords.forEach((record) => {
      const sessionId = toNumberOrNull(record.lesson_session_id)
      const session =
        sessionId === null
          ? null
          : data.lessonSessions.find((item) => Number(item.id) === sessionId) ?? null
      const scheduleItemId = toNumberOrNull(session?.schedule_item_id)

      if (scheduleItemId !== null) {
        attendanceByScheduleItem.set(scheduleItemId, record)
      }
    })

    return {
      sessionByScheduleItemId,
      attendanceByScheduleItem
    }
  }, [data.attendanceRecords, data.lessonSessions])

  const attendanceStatusById = useMemo(
    () => createRecordMap(data.attendanceStatuses),
    [data.attendanceStatuses]
  )
  const lessonNumbers = useMemo(() => {
    const numbers = data.lessonPeriods
      .map((period) => toNumberOrNull(period.number))
      .filter((value): value is number => value !== null)

    return numbers.length > 0 ? numbers : [1, 2, 3, 4, 5]
  }, [data.lessonPeriods])

  return (
    <Card>
      <CardHeader className="bg-[var(--color-surface-muted)]">
        <CardTitle>Матрица недели</CardTitle>
        <CardDescription>
          Нажимать и редактировать нельзя: студент только просматривает сохранённые темы и отметки.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full min-w-[72rem] border-collapse text-sm">
            <thead className="bg-[var(--color-surface-muted)]">
              <tr>
                <th className="border-b border-r border-[var(--color-border)] px-4 py-3 text-left font-semibold text-[var(--color-text-muted)]">
                  День
                </th>
                {lessonNumbers.map((lessonNumber) => (
                  <th
                    key={lessonNumber}
                    className="border-b border-r border-[var(--color-border)] px-4 py-3 text-left font-semibold text-[var(--color-text-muted)] last:border-r-0"
                  >
                    {lessonNumber} пара
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {dayNumbers.map((dayNumber) => (
                <tr key={dayNumber} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="border-r border-[var(--color-border)] px-4 py-3 font-semibold text-[var(--color-text)]">
                    {getDayLabel(dayNumber)}
                  </td>

                  {lessonNumbers.map((lessonNumber) => {
                    const row = scheduleRows.find(
                      (item) => item.dayOrder === dayNumber && item.periodOrder === lessonNumber
                    )
                    const session = row
                      ? attendanceByScheduleItemId.sessionByScheduleItemId.get(Number(row.item.id))
                      : null
                    const attendance = row
                      ? attendanceByScheduleItemId.attendanceByScheduleItem.get(Number(row.item.id))
                      : null
                    const attendanceStatus = attendance
                      ? getRecordById(attendance.attendance_status_id, attendanceStatusById)
                      : null

                    return (
                      <td
                        key={`${dayNumber}:${lessonNumber}`}
                        className="border-r border-[var(--color-border)] px-3 py-3 align-top last:border-r-0"
                      >
                        {row ? (
                          <div className="grid gap-2">
                            <div>
                              <p className="font-semibold text-[var(--color-text)]">{row.discipline}</p>
                              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                {row.teacher}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant="muted">{row.type}</Badge>
                              <Badge variant={attendanceStatus ? 'default' : 'muted'}>
                                {attendanceStatus ? getRecordName(attendanceStatus) : 'Нет отметки'}
                              </Badge>
                            </div>

                            <p className="rounded-lg bg-[var(--color-surface-muted)] px-2 py-1.5 text-xs text-[var(--color-text-muted)]">
                              Тема: {formatValue(session?.topic)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)]">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function PerformanceSection({
  stats,
  disciplineId,
  disciplineOptions,
  intermediateGrades,
  finalGrades,
  onDisciplineChange
}: {
  stats: { total: number; average: number | null; finalCount: number }
  disciplineId: string
  disciplineOptions: AdminCrudSelectOption[]
  intermediateGrades: GradeRow[]
  finalGrades: GradeRow[]
  onDisciplineChange: (value: string) => void
}) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Фильтр успеваемости</CardTitle>
          <CardDescription>
            Можно посмотреть все оценки сразу или выбрать конкретную дисциплину.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <PortalSelect
            label="Дисциплина"
            value={disciplineId}
            placeholder="Все дисциплины"
            options={disciplineOptions}
            onValueChange={onDisciplineChange}
          />
        </CardContent>
      </Card>

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
        <CardHeader className="bg-[var(--color-surface-muted)]">
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

function SettingsSection({ data, username }: { data: StudentPortalData; username: string }) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FiSettings className="h-5 w-5 text-[var(--color-primary)]" />
            <div>
              <CardTitle>Профиль студента</CardTitle>
              <CardDescription>
                Личные данные, учебная принадлежность и контакты текущего аккаунта.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <InfoItem label="Аккаунт" value={username} />
            <InfoItem label="ФИО" value={data.student ? getPersonName(data.student) : '—'} />
            <InfoItem label="Статус" value={getRecordNameOrDash(data.status)} />
            <InfoItem label="Студенческий" value={data.student?.student_card_number} />
            <InfoItem label="Email" value={data.student?.email} />
            <InfoItem label="Телефон" value={data.student?.phone} />
            <InfoItem label="Дата рождения" value={formatDateForDisplay(data.student?.birth_date)} />
            <InfoItem label="Дата поступления" value={formatDateForDisplay(data.student?.admission_date)} />
            <InfoItem label="Адрес" value={data.student?.address} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Учебная принадлежность</CardTitle>
          <CardDescription>Данные подтягиваются из карточки студента и группы.</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <InfoItem label="Факультет" value={getRecordNameOrDash(data.faculty)} />
            <InfoItem label="Специальность" value={getRecordNameOrDash(data.specialty)} />
            <InfoItem label="Группа" value={getRecordNameOrDash(data.group)} />
            <InfoItem label="Курс" value={getCourseLabel(data.group)} />
            <InfoItem label="Учебный год" value={getRecordNameOrDash(data.academicYear)} />
            <InfoItem label="Форма обучения" value={getRecordNameOrDash(data.educationForm)} />
          </div>
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
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
      <table className="w-full min-w-[56rem] border-collapse text-sm">
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
        item,
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
  const subjectNameById = createRecordNameMap(data.subjects)
  const semesterNameById = createRecordNameMap(data.semesters)
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
      const items = [...(itemsByPlanId.get(planId) ?? [])].sort((first, second) => {
        const semesterDiff = Number(first.semester_id ?? 999) - Number(second.semester_id ?? 999)

        if (semesterDiff !== 0) {
          return semesterDiff
        }

        return getRelationName(first.subject_id, subjectNameById).localeCompare(
          getRelationName(second.subject_id, subjectNameById),
          'ru'
        )
      })

      return {
        key: String(plan.id ?? plan.name),
        course: course === null ? 'Курс не указан' : `${course} курс`,
        plan,
        semesterGroups: groupCurriculumItemsBySemester(items, semesterNameById)
      }
    })
    .sort((first, second) => Number(first.plan.course ?? 999) - Number(second.plan.course ?? 999))
}

function groupCurriculumItemsBySemester(
  items: AdminCrudRecord[],
  semesterNameById: Map<number, string>
): CurriculumSemesterGroup[] {
  const groups = new Map<string, CurriculumSemesterGroup>()

  items.forEach((item) => {
    const semesterId = toNumberOrNull(item.semester_id)
    const sortOrder = semesterId ?? Number.MAX_SAFE_INTEGER
    const key = semesterId === null ? 'empty' : String(semesterId)
    const group =
      groups.get(key) ??
      ({
        key,
        title: semesterId === null ? 'Семестр не указан' : (semesterNameById.get(semesterId) ?? `${semesterId} семестр`),
        sortOrder,
        items: [],
        totalHours: 0
      } satisfies CurriculumSemesterGroup)

    group.items.push(item)
    group.totalHours += toNumberOrNull(item.hours_total) ?? 0
    groups.set(key, group)
  })

  return Array.from(groups.values()).sort((first, second) => first.sortOrder - second.sortOrder)
}

function createTeacherRows(data: StudentPortalData, ownGroupId: number | null): TeacherCardRow[] {
  const subjectById = createRecordMap(data.subjects)
  const teacherById = createRecordMap(data.teachers)
  const departmentById = createRecordMap(data.departments)
  const teacherMap = new Map<number, TeacherCardRow>()

  data.teachers.forEach((teacher) => {
    const teacherId = toNumberOrNull(teacher.id)

    if (teacherId === null) {
      return
    }

    const department = getRecordById(teacher.department_id, departmentById)
    const subjectIds = parseMultiValue(teacher.teaching_subjects)
      .map((item) => toNumberOrNull(item))
      .filter((id): id is number => id !== null)

    teacherMap.set(teacherId, {
      id: String(teacherId),
      teacherId,
      departmentId: toNumberOrNull(teacher.department_id),
      subjectIds,
      name: getPersonName(teacher),
      department: department ? getRecordName(department) : 'Кафедра не указана',
      subjects: subjectIds
        .map((subjectId) => {
          const subject = subjectById.get(subjectId)

          return subject ? getRecordName(subject) : `#${subjectId}`
        })
        .filter(Boolean),
      disciplineCount: 0,
      teachesOwnGroup: false
    })
  })

  data.disciplines.forEach((discipline) => {
    const teacher = getRecordById(discipline.teacher_id, teacherById)
    const teacherId = toNumberOrNull(teacher?.id)

    if (!teacher || teacherId === null) {
      return
    }

    const current = teacherMap.get(teacherId)

    if (!current) {
      return
    }

    current.disciplineCount += 1
    current.teachesOwnGroup =
      current.teachesOwnGroup ||
      (ownGroupId !== null && Number(discipline.group_id) === ownGroupId)

    const subject = getRecordById(discipline.subject_id, subjectById)

    if (subject) {
      const subjectId = toNumberOrNull(subject.id)
      const subjectName = getRecordName(subject)

      if (subjectId !== null && !current.subjectIds.includes(subjectId)) {
        current.subjectIds.push(subjectId)
      }

      if (!current.subjects.includes(subjectName)) {
        current.subjects.push(subjectName)
      }
    }
  })

  return Array.from(teacherMap.values()).sort((first, second) =>
    first.name.localeCompare(second.name, 'ru')
  )
}

function filterTeacherRows({
  teachers,
  search,
  departmentId,
  subjectId
}: {
  teachers: TeacherCardRow[]
  search: string
  departmentId: string
  subjectId: string
}): TeacherCardRow[] {
  const normalizedSearch = search.trim().toLowerCase()

  return teachers.filter((teacher) => {
    if (departmentId && String(teacher.departmentId ?? '') !== departmentId) {
      return false
    }

    if (subjectId && !teacher.subjectIds.includes(Number(subjectId))) {
      return false
    }

    if (!normalizedSearch) {
      return true
    }

    const haystack = [teacher.name, teacher.department, ...teacher.subjects]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedSearch)
  })
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
      const attendanceRecord = attendanceBySessionId.get(Number(session.id))
      const attendance = getRecordById(attendanceRecord?.attendance_status_id, attendanceStatusById)

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

function createGradeRows(data: StudentPortalData): GradeRow[] {
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
        disciplineId: toNumberOrNull(discipline?.id ?? gradeItem?.discipline_id),
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
    .sort((first, second) => second.date.localeCompare(first.date, 'ru'))
}

function createGradeDisciplineOptions(rows: GradeRow[]): AdminCrudSelectOption[] {
  const options = new Map<string, AdminCrudSelectOption>()

  rows.forEach((row) => {
    if (row.disciplineId === null) {
      return
    }

    options.set(String(row.disciplineId), {
      value: String(row.disciplineId),
      label: row.discipline
    })
  })

  return Array.from(options.values()).sort((first, second) =>
    first.label.localeCompare(second.label, 'ru')
  )
}

function filterGradeRowsByDiscipline(rows: GradeRow[], disciplineId: string): GradeRow[] {
  if (!disciplineId) {
    return rows
  }

  return rows.filter((row) => String(row.disciplineId ?? '') === disciplineId)
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

function getDefaultSemesterId(data: StudentPortalData): string {
  const now = new Date()
  const currentSemester = data.semesters.find((semester) => {
    return isDateWithinRange(now, semester.starts_at, semester.ends_at)
  })

  if (currentSemester?.id) {
    return String(currentSemester.id)
  }

  const groupAcademicYearId = toNumberOrNull(data.group?.academic_year_id)
  const groupSemester = data.semesters.find((semester) => {
    return groupAcademicYearId !== null && Number(semester.academic_year_id) === groupAcademicYearId
  })

  return groupSemester?.id ? String(groupSemester.id) : ''
}

function getDefaultWeekId(data: StudentPortalData, semesterId: string): string {
  const now = new Date()
  const semesterWeeks = data.weeks.filter((week) => {
    return !semesterId || String(week.semester_id ?? '') === semesterId
  })
  const currentWeek = semesterWeeks.find((week) => isDateWithinRange(now, week.starts_at, week.ends_at))

  if (currentWeek?.id) {
    return String(currentWeek.id)
  }

  return semesterWeeks[0]?.id ? String(semesterWeeks[0].id) : ''
}

function isDateWithinRange(date: Date, startsAt: unknown, endsAt: unknown): boolean {
  const startDate = parseDate(startsAt)
  const endDate = parseDate(endsAt)

  if (!startDate || !endDate) {
    return false
  }

  return date >= startDate && date <= endDate
}

function parseDate(value: unknown): Date | null {
  const stringValue = String(value ?? '').trim()

  if (!stringValue) {
    return null
  }

  const date = new Date(stringValue)

  return Number.isNaN(date.getTime()) ? null : date
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

function createWeekNameMap(records: AdminCrudRecord[]): Map<number, string> {
  return new Map(
    records
      .map((record) => [toNumberOrNull(record.id), getWeekLabel(record)] as const)
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

function getSectionTitle(section: StudentPortalSection): string {
  if (section === 'schedule') return 'Расписание'
  if (section === 'curriculum') return 'Учебный план'
  if (section === 'teachers') return 'Преподаватели'
  if (section === 'group') return 'Моя группа'
  if (section === 'journal') return 'Журнал'
  if (section === 'performance') return 'Успеваемость'

  return 'Настройки'
}

function getSectionDescription(section: StudentPortalSection): string {
  if (section === 'schedule') return 'Карточки расписания по дням недели и фильтры просмотра других групп.'
  if (section === 'curriculum') return 'Учебный план специальности по курсам, семестрам и дисциплинам.'
  if (section === 'teachers') return 'Поиск преподавателей и просмотр полного расписания выбранного преподавателя.'
  if (section === 'group') return 'Факультет, специальность, группа, куратор и однокурсники.'
  if (section === 'journal') return 'Матрица журнала группы, темы занятий, посещаемость и контрольные.'
  if (section === 'performance') return 'Промежуточные оценки, итоговые элементы и зачётная книжка.'

  return 'Профиль, контакты и учебная принадлежность студента.'
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

function getLessonCountText(count: number): string {
  const normalizedCount = Math.abs(count) % 100
  const lastDigit = normalizedCount % 10

  if (normalizedCount > 10 && normalizedCount < 20) {
    return 'занятий'
  }

  if (lastDigit === 1) {
    return 'занятие'
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'занятия'
  }

  return 'занятий'
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