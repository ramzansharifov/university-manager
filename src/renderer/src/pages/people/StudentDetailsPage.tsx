import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FiArrowLeft,
  FiBookOpen,
  FiCalendar,
  FiClipboard,
  FiRefreshCcw,
  FiTrendingUp,
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

interface StudentRelatedData {
  group: AdminCrudRecord | null
  status: AdminCrudRecord | null
  specialty: AdminCrudRecord | null
  faculty: AdminCrudRecord | null
  academicYear: AdminCrudRecord | null
  educationForm: AdminCrudRecord | null
  disciplines: AdminCrudRecord[]
  subjects: AdminCrudRecord[]
  teachers: AdminCrudRecord[]
  semesters: AdminCrudRecord[]
  lessonPeriods: AdminCrudRecord[]
  scheduleItems: AdminCrudRecord[]
  lessonSessions: AdminCrudRecord[]
  attendanceRecords: AdminCrudRecord[]
  attendanceStatuses: AdminCrudRecord[]
  gradeElementTypes: AdminCrudRecord[]
  gradeItems: AdminCrudRecord[]
  grades: AdminCrudRecord[]
}

interface AttendanceRow {
  id: string
  date: string
  discipline: string
  lesson: string
  status: string
  comment: string
  isAbsence: boolean
  isPresent: boolean
}

interface GradeRow {
  id: string
  discipline: string
  work: string
  type: string
  date: string
  score: string
  numericScore: number | null
  comment: string
}

interface DisciplineRow {
  id: string
  name: string
  subject: string
  teacher: string
  semester: string
  status: string
}

const emptyRelatedData: StudentRelatedData = {
  group: null,
  status: null,
  specialty: null,
  faculty: null,
  academicYear: null,
  educationForm: null,
  disciplines: [],
  subjects: [],
  teachers: [],
  semesters: [],
  lessonPeriods: [],
  scheduleItems: [],
  lessonSessions: [],
  attendanceRecords: [],
  attendanceStatuses: [],
  gradeElementTypes: [],
  gradeItems: [],
  grades: []
}

export function StudentDetailsPage() {
  const { studentId } = useParams()
  const navigate = useNavigate()

  const [student, setStudent] = useState<AdminCrudRecord | null>(null)
  const [relatedData, setRelatedData] = useState<StudentRelatedData>(emptyRelatedData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const numericStudentId = useMemo(() => Number(studentId), [studentId])

  const loadStudent = useCallback(async () => {
    if (!Number.isFinite(numericStudentId)) {
      setError('Некорректный идентификатор студента')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const studentRecord = await window.api.adminCrud.getById({
        entity: 'students',
        id: numericStudentId
      })

      if (!studentRecord) {
        setStudent(null)
        setRelatedData(emptyRelatedData)
        setError('Студент не найден')
        return
      }

      const groupId = toNumberOrNull(studentRecord.group_id)
      const statusId = toNumberOrNull(studentRecord.status_id)

      const [
        groupRecord,
        statusRecord,
        attendanceRecordsResult,
        gradesResult,
        attendanceStatusesResult,
        gradeElementTypesResult,
        subjectsResult,
        teachersResult,
        semestersResult,
        lessonPeriodsResult
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
          entity: 'attendance_records',
          page: 1,
          pageSize: 20000,
          filters: { student_id: numericStudentId },
          orderBy: 'id',
          orderDirection: 'desc'
        }),
        window.api.adminCrud.list({
          entity: 'grades',
          page: 1,
          pageSize: 20000,
          filters: { student_id: numericStudentId },
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
          entity: 'subjects',
          page: 1,
          pageSize: 2000,
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
          entity: 'semesters',
          page: 1,
          pageSize: 1000,
          orderBy: 'number',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'lesson_periods',
          page: 1,
          pageSize: 200,
          orderBy: 'number',
          orderDirection: 'asc'
        })
      ])

      let specialtyRecord: AdminCrudRecord | null = null
      let facultyRecord: AdminCrudRecord | null = null
      let academicYearRecord: AdminCrudRecord | null = null
      let educationFormRecord: AdminCrudRecord | null = null
      let disciplines: AdminCrudRecord[] = []
      let scheduleItems: AdminCrudRecord[] = []
      let lessonSessions: AdminCrudRecord[] = []
      let gradeItems: AdminCrudRecord[] = []

      if (groupRecord) {
        const specialtyId = toNumberOrNull(groupRecord.specialty_id)
        const academicYearId = toNumberOrNull(groupRecord.academic_year_id)
        const educationFormId = toNumberOrNull(groupRecord.education_form_id)

        const [
          nextSpecialtyRecord,
          nextAcademicYearRecord,
          nextEducationFormRecord,
          disciplinesResult,
          scheduleItemsResult
        ] = await Promise.all([
          specialtyId === null
            ? Promise.resolve(null)
            : window.api.adminCrud.getById({
                entity: 'specialties',
                id: specialtyId
              }),
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
          window.api.adminCrud.list({
            entity: 'disciplines',
            page: 1,
            pageSize: 3000,
            filters: { group_id: groupId },
            orderBy: 'semester_id',
            orderDirection: 'asc'
          }),
          window.api.adminCrud.list({
            entity: 'schedule_items',
            page: 1,
            pageSize: 10000,
            filters: { group_id: groupId },
            orderBy: 'day_of_week',
            orderDirection: 'asc'
          })
        ])

        specialtyRecord = nextSpecialtyRecord
        academicYearRecord = nextAcademicYearRecord
        educationFormRecord = nextEducationFormRecord
        disciplines = disciplinesResult.items
        scheduleItems = scheduleItemsResult.items

        const facultyId = toNumberOrNull(specialtyRecord?.faculty_id)

        if (facultyId !== null) {
          facultyRecord = await window.api.adminCrud.getById({
            entity: 'faculties',
            id: facultyId
          })
        }

        const scheduleItemIds = getRecordIds(scheduleItems)
        const disciplineIds = getRecordIds(disciplines)
        const gradeItemIdsFromGrades = getRecordIdsFromField(gradesResult.items, 'grade_item_id')

        const [lessonSessionsResult, gradeItemsResult] = await Promise.all([
          scheduleItemIds.length > 0
            ? window.api.adminCrud.list({
                entity: 'lesson_sessions',
                page: 1,
                pageSize: 20000,
                filters: { schedule_item_id: scheduleItemIds },
                orderBy: 'lesson_date',
                orderDirection: 'desc'
              })
            : Promise.resolve(emptyListResult()),
          disciplineIds.length > 0
            ? window.api.adminCrud.list({
                entity: 'grade_items',
                page: 1,
                pageSize: 10000,
                filters: { discipline_id: disciplineIds },
                orderBy: 'grade_date',
                orderDirection: 'desc'
              })
            : gradeItemIdsFromGrades.length > 0
              ? window.api.adminCrud.list({
                  entity: 'grade_items',
                  page: 1,
                  pageSize: 10000,
                  filters: { id: gradeItemIdsFromGrades },
                  orderBy: 'grade_date',
                  orderDirection: 'desc'
                })
              : Promise.resolve(emptyListResult())
        ])

        lessonSessions = lessonSessionsResult.items
        gradeItems = gradeItemsResult.items
      } else {
        const lessonSessionIds = getRecordIdsFromField(
          attendanceRecordsResult.items,
          'lesson_session_id'
        )
        const gradeItemIds = getRecordIdsFromField(gradesResult.items, 'grade_item_id')

        const [lessonSessionsResult, gradeItemsResult] = await Promise.all([
          lessonSessionIds.length > 0
            ? window.api.adminCrud.list({
                entity: 'lesson_sessions',
                page: 1,
                pageSize: 20000,
                filters: { id: lessonSessionIds },
                orderBy: 'lesson_date',
                orderDirection: 'desc'
              })
            : Promise.resolve(emptyListResult()),
          gradeItemIds.length > 0
            ? window.api.adminCrud.list({
                entity: 'grade_items',
                page: 1,
                pageSize: 10000,
                filters: { id: gradeItemIds },
                orderBy: 'grade_date',
                orderDirection: 'desc'
              })
            : Promise.resolve(emptyListResult())
        ])

        lessonSessions = lessonSessionsResult.items
        gradeItems = gradeItemsResult.items
      }

      setStudent(studentRecord)
      setRelatedData({
        group: groupRecord,
        status: statusRecord,
        specialty: specialtyRecord,
        faculty: facultyRecord,
        academicYear: academicYearRecord,
        educationForm: educationFormRecord,
        disciplines,
        subjects: subjectsResult.items,
        teachers: teachersResult.items,
        semesters: semestersResult.items,
        lessonPeriods: lessonPeriodsResult.items,
        scheduleItems,
        lessonSessions,
        attendanceRecords: attendanceRecordsResult.items,
        attendanceStatuses: attendanceStatusesResult.items,
        gradeElementTypes: gradeElementTypesResult.items,
        gradeItems,
        grades: gradesResult.items
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить студента')
    } finally {
      setIsLoading(false)
    }
  }, [numericStudentId])

  useEffect(() => {
    void loadStudent()
  }, [loadStudent])

  const studentName = student ? getPersonName(student) : 'Студент'
  const attendanceRows = useMemo(() => createAttendanceRows(relatedData), [relatedData])
  const gradeRows = useMemo(() => createGradeRows(relatedData), [relatedData])
  const disciplineRows = useMemo(() => createDisciplineRows(relatedData), [relatedData])

  const attendanceStats = useMemo(() => {
    const total = attendanceRows.length
    const absences = attendanceRows.filter((row) => row.isAbsence).length
    const present = attendanceRows.filter((row) => row.isPresent).length

    return {
      total,
      absences,
      present,
      other: Math.max(0, total - absences - present)
    }
  }, [attendanceRows])

  const gradeStats = useMemo(() => {
    const numericScores = gradeRows
      .map((row) => row.numericScore)
      .filter((score): score is number => score !== null)

    const average =
      numericScores.length > 0
        ? numericScores.reduce((sum, score) => sum + score, 0) / numericScores.length
        : null

    const disciplineCount = new Set(gradeRows.map((row) => row.discipline)).size

    return {
      total: gradeRows.length,
      average,
      disciplineCount
    }
  }, [gradeRows])

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => navigate('/filters')}>
            <FiArrowLeft />К фильтрам
          </Button>

          <Button variant="ghost" onClick={() => navigate('/people')}>
            К людям
          </Button>
        </div>

        <Button variant="secondary" onClick={() => void loadStudent()} disabled={isLoading}>
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
            <p className="text-sm text-[var(--color-text-muted)]">Загрузка карточки студента...</p>
          </CardContent>
        </Card>
      ) : null}

      {student ? (
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
                      <h1 className="text-xl font-bold tracking-tight">{studentName}</h1>
                      <Badge>
                        {relatedData.status
                          ? getRecordName(relatedData.status)
                          : 'Статус не указан'}
                      </Badge>
                    </div>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {getEducationLine(relatedData)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {student.student_card_number ? (
                        <Badge variant="muted">№ {String(student.student_card_number)}</Badge>
                      ) : null}
                      {student.email ? (
                        <Badge variant="muted">{String(student.email)}</Badge>
                      ) : null}
                      {student.phone ? (
                        <Badge variant="muted">{String(student.phone)}</Badge>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[520px] xl:grid-cols-4">
                  <MetricCard label="Группа" value={getRecordNameOrDash(relatedData.group)} />
                  <MetricCard label="Курс" value={getCourseLabel(relatedData.group)} />
                  <MetricCard label="Пропуски" value={String(attendanceStats.absences)} />
                  <MetricCard label="Оценки" value={String(gradeStats.total)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="education">Учёба</TabsTrigger>
              <TabsTrigger value="attendance">Пропуски</TabsTrigger>
              <TabsTrigger value="grades">Работы и оценки</TabsTrigger>
              <TabsTrigger value="notes">Дополнительно</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Личные данные</CardTitle>
                    <CardDescription>Основная информация из карточки студента.</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <InfoItem label="Фамилия" value={student.last_name} />
                      <InfoItem label="Имя" value={student.first_name} />
                      <InfoItem label="Отчество" value={student.middle_name} />
                      <InfoItem
                        label="Дата рождения"
                        value={formatDateForDisplay(student.birth_date)}
                      />
                      <InfoItem
                        label="Дата поступления"
                        value={formatDateForDisplay(student.admission_date)}
                      />
                      <InfoItem
                        label="Дата изменения статуса"
                        value={formatDateForDisplay(student.status_changed_at)}
                      />
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
                      <InfoItem label="Email" value={student.email} />
                      <InfoItem label="Телефон" value={student.phone} />
                      <DetailsBlock title="Адрес" value={student.address} compact />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="education">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Учебная принадлежность</CardTitle>
                    <CardDescription>
                      Группа, курс, специальность, факультет, учебный год и форма обучения.
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <InfoItem label="Группа" value={getRecordNameOrDash(relatedData.group)} />
                      <InfoItem label="Курс" value={getCourseLabel(relatedData.group)} />
                      <InfoItem
                        label="Специальность"
                        value={getRecordNameOrDash(relatedData.specialty)}
                      />
                      <InfoItem
                        label="Факультет"
                        value={getRecordNameOrDash(relatedData.faculty)}
                      />
                      <InfoItem
                        label="Учебный год"
                        value={getRecordNameOrDash(relatedData.academicYear)}
                      />
                      <InfoItem
                        label="Форма обучения"
                        value={getRecordNameOrDash(relatedData.educationForm)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <FiBookOpen className="h-5 w-5 text-[var(--color-primary)]" />
                      <div>
                        <CardTitle>Дисциплины группы</CardTitle>
                        <CardDescription>
                          Предметы, преподаватели и семестры по группе студента.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {disciplineRows.length > 0 ? (
                      <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
                        <table className="w-full border-collapse text-sm">
                          <thead className="bg-[var(--color-surface-muted)]">
                            <tr>
                              <TableHead>Дисциплина</TableHead>
                              <TableHead>Предмет</TableHead>
                              <TableHead>Преподаватель</TableHead>
                              <TableHead>Семестр</TableHead>
                              <TableHead>Статус</TableHead>
                            </tr>
                          </thead>
                          <tbody>
                            {disciplineRows.map((row) => (
                              <tr key={row.id} className="border-t border-[var(--color-border)]">
                                <TableCell>{row.name}</TableCell>
                                <TableCell>{row.subject}</TableCell>
                                <TableCell>{row.teacher}</TableCell>
                                <TableCell>{row.semester}</TableCell>
                                <TableCell>{row.status}</TableCell>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptyState>Для группы студента пока нет дисциплин.</EmptyState>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="attendance">
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <SummaryCard
                    icon={<FiCalendar />}
                    label="Всего отметок"
                    value={String(attendanceStats.total)}
                  />
                  <SummaryCard
                    icon={<FiClipboard />}
                    label="Пропуски"
                    value={String(attendanceStats.absences)}
                    tone="danger"
                  />
                  <SummaryCard
                    icon={<FiUser />}
                    label="Присутствия"
                    value={String(attendanceStats.present)}
                    tone="success"
                  />
                  <SummaryCard label="Прочие статусы" value={String(attendanceStats.other)} />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>История посещаемости</CardTitle>
                    <CardDescription>
                      Все отметки посещаемости студента по занятиям и дисциплинам.
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {attendanceRows.length > 0 ? (
                      <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
                        <table className="w-full border-collapse text-sm">
                          <thead className="bg-[var(--color-surface-muted)]">
                            <tr>
                              <TableHead>Дата</TableHead>
                              <TableHead>Дисциплина</TableHead>
                              <TableHead>Занятие</TableHead>
                              <TableHead>Статус</TableHead>
                              <TableHead>Комментарий</TableHead>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceRows.map((row) => (
                              <tr key={row.id} className="border-t border-[var(--color-border)]">
                                <TableCell>{row.date}</TableCell>
                                <TableCell>{row.discipline}</TableCell>
                                <TableCell>{row.lesson}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      row.isAbsence ? 'danger' : row.isPresent ? 'success' : 'muted'
                                    }
                                  >
                                    {row.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{row.comment}</TableCell>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptyState>По студенту пока нет отметок посещаемости.</EmptyState>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="grades">
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <SummaryCard
                    icon={<FiTrendingUp />}
                    label="Всего результатов"
                    value={String(gradeStats.total)}
                  />
                  <SummaryCard
                    label="Средний балл"
                    value={gradeStats.average === null ? '—' : gradeStats.average.toFixed(1)}
                    tone="success"
                  />
                  <SummaryCard
                    label="Дисциплин с работами"
                    value={String(gradeStats.disciplineCount)}
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Результаты работ по дисциплинам</CardTitle>
                    <CardDescription>
                      Контрольные, практические, лабораторные, зачёты и другие оценочные элементы.
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {gradeRows.length > 0 ? (
                      <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
                        <table className="w-full border-collapse text-sm">
                          <thead className="bg-[var(--color-surface-muted)]">
                            <tr>
                              <TableHead>Дисциплина</TableHead>
                              <TableHead>Работа</TableHead>
                              <TableHead>Тип</TableHead>
                              <TableHead>Дата</TableHead>
                              <TableHead>Результат</TableHead>
                              <TableHead>Комментарий</TableHead>
                            </tr>
                          </thead>
                          <tbody>
                            {gradeRows.map((row) => (
                              <tr key={row.id} className="border-t border-[var(--color-border)]">
                                <TableCell>{row.discipline}</TableCell>
                                <TableCell>{row.work}</TableCell>
                                <TableCell>{row.type}</TableCell>
                                <TableCell>{row.date}</TableCell>
                                <TableCell>
                                  <Badge variant={row.numericScore === null ? 'muted' : 'default'}>
                                    {row.score}
                                  </Badge>
                                </TableCell>
                                <TableCell>{row.comment}</TableCell>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptyState>По студенту пока нет результатов работ.</EmptyState>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <div className="grid gap-4 xl:grid-cols-2">
                <DetailsBlock title="Социальный статус" value={student.social_status} />
                <DetailsBlock title="Общественная / соц. работа" value={student.public_activity} />
                <DetailsBlock title="Информация о переводе" value={student.transfer_info} />
                <DetailsBlock title="Примечание" value={student.note} />
              </div>
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
  value,
  tone = 'default'
}: {
  icon?: React.ReactNode
  label: string
  value: string
  tone?: 'default' | 'success' | 'danger'
}) {
  const toneClass =
    tone === 'success'
      ? 'text-[var(--color-success)]'
      : tone === 'danger'
        ? 'text-[var(--color-danger)]'
        : 'text-[var(--color-primary)]'

  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-current/10 ${toneClass}`}
        >
          {icon ?? <FiClipboard />}
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

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-[var(--color-border)] px-4 py-3 text-left font-semibold text-[var(--color-text-muted)]">
      {children}
    </th>
  )
}

function TableCell({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top text-[var(--color-text)]">{children}</td>
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
      {children}
    </div>
  )
}

function createAttendanceRows(data: StudentRelatedData): AttendanceRow[] {
  const statusById = createRecordMap(data.attendanceStatuses)
  const sessionById = createRecordMap(data.lessonSessions)
  const scheduleItemById = createRecordMap(data.scheduleItems)
  const disciplineById = createRecordMap(data.disciplines)
  const subjectById = createRecordMap(data.subjects)
  const lessonPeriodById = createRecordMap(data.lessonPeriods)

  return data.attendanceRecords
    .map((record, index) => {
      const status = getRecordById(record.attendance_status_id, statusById)
      const session = getRecordById(record.lesson_session_id, sessionById)
      const scheduleItem = session
        ? getRecordById(session.schedule_item_id, scheduleItemById)
        : null
      const discipline = scheduleItem
        ? getRecordById(scheduleItem.discipline_id, disciplineById)
        : null
      const period = scheduleItem
        ? getRecordById(scheduleItem.lesson_period_id, lessonPeriodById)
        : null
      const statusLabel = status ? getRecordName(status) : 'Статус не указан'

      return {
        id: String(record.id ?? index),
        date: formatDateForDisplay(session?.lesson_date),
        discipline: discipline ? getDisciplineName(discipline, subjectById) : '—',
        lesson: getLessonLabel(scheduleItem, period),
        status: statusLabel,
        comment: formatValue(record.comment),
        isAbsence: isAbsenceStatus(status),
        isPresent: isPresentStatus(status)
      }
    })
    .sort((first, second) => second.date.localeCompare(first.date, 'ru'))
}

function createGradeRows(data: StudentRelatedData): GradeRow[] {
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
        comment: formatValue(grade.comment)
      }
    })
    .sort((first, second) => second.date.localeCompare(first.date, 'ru'))
}

function createDisciplineRows(data: StudentRelatedData): DisciplineRow[] {
  const subjectById = createRecordMap(data.subjects)
  const teacherById = createRecordMap(data.teachers)
  const semesterById = createRecordMap(data.semesters)

  return data.disciplines.map((discipline, index) => {
    const subject = getRecordById(discipline.subject_id, subjectById)
    const teacher = getRecordById(discipline.teacher_id, teacherById)
    const semester = getRecordById(discipline.semester_id, semesterById)

    return {
      id: String(discipline.id ?? index),
      name: getDisciplineName(discipline, subjectById),
      subject: subject ? getRecordName(subject) : '—',
      teacher: teacher ? getPersonName(teacher) : '—',
      semester: semester ? getRecordName(semester) : '—',
      status: formatValue(discipline.status)
    }
  })
}

function getLessonLabel(
  scheduleItem: AdminCrudRecord | null,
  period: AdminCrudRecord | null
): string {
  if (!scheduleItem && !period) {
    return '—'
  }

  const day = getDayLabel(scheduleItem?.day_of_week)
  const periodLabel = period
    ? `${formatValue(period.number)} пара (${formatValue(period.starts_at)}–${formatValue(
        period.ends_at
      )})`
    : 'пара не указана'

  return `${day}, ${periodLabel}`
}

function getScoreLabel(
  grade: AdminCrudRecord,
  gradeItem: AdminCrudRecord | null,
  gradeElementType: AdminCrudRecord | null
): string {
  const resultStatus = getGradeResultStatus(grade, gradeElementType)

  if (resultStatus === 'absent') {
    return 'Неявка'
  }

  if (resultStatus === 'passed') {
    return 'Сдал'
  }

  if (resultStatus === 'failed') {
    return 'Не сдал'
  }

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

function getEducationLine(data: StudentRelatedData): string {
  const parts = [
    data.group ? `Группа ${getRecordName(data.group)}` : null,
    getCourseLabel(data.group),
    data.specialty ? getRecordName(data.specialty) : null,
    data.faculty ? getRecordName(data.faculty) : null
  ].filter((part) => part && part !== '—')

  return parts.length > 0 ? parts.join(' · ') : 'Учебная принадлежность не указана'
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

function isAbsenceStatus(status: AdminCrudRecord | null): boolean {
  const text = getStatusSearchText(status)

  return (
    text.includes('absence') ||
    text.includes('absent') ||
    text.includes('проп') ||
    text.includes('отсут') ||
    text.includes('н/б') ||
    text === 'н'
  )
}

function isPresentStatus(status: AdminCrudRecord | null): boolean {
  const text = getStatusSearchText(status)

  return text.includes('present') || text.includes('присут') || text.includes('явка')
}

function getStatusSearchText(status: AdminCrudRecord | null): string {
  return [status?.item_key, status?.name].filter(Boolean).map(String).join(' ').trim().toLowerCase()
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

function getRecordIds(records: AdminCrudRecord[]): number[] {
  return records
    .map((record) => toNumberOrNull(record.id))
    .filter((id): id is number => id !== null)
}

function getRecordIdsFromField(records: AdminCrudRecord[], field: string): number[] {
  return records
    .map((record) => toNumberOrNull(record[field]))
    .filter((id): id is number => id !== null)
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
