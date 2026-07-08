import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import {
  FiBookOpen,
  FiRefreshCcw,
  FiSearch,
  FiSettings,
  FiUserCheck,
  FiUsers
} from 'react-icons/fi'
import type { AdminCrudRecord } from '../../features/admin-crud'
import { useAuth } from '../../app/providers/AuthProvider'
import { LearningJournalMatrix } from '../learning-journal/ui/LearningJournalMatrix'
import { ScheduleItemsDrilldown } from '../schedule/ui/ScheduleItemsDrilldown'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input
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
  departments: AdminCrudRecord[]
  subjects: AdminCrudRecord[]
  teachers: AdminCrudRecord[]
  disciplines: AdminCrudRecord[]
  curriculumPlans: AdminCrudRecord[]
  curriculumItems: AdminCrudRecord[]
  semesters: AdminCrudRecord[]
  classmates: AdminCrudRecord[]
}

const emptyData: StudentPortalData = {
  student: null,
  group: null,
  status: null,
  specialty: null,
  faculty: null,
  academicYear: null,
  educationForm: null,
  departments: [],
  subjects: [],
  teachers: [],
  disciplines: [],
  curriculumPlans: [],
  curriculumItems: [],
  semesters: [],
  classmates: []
}

export function StudentPortalPage({ section }: StudentPortalPageProps): ReactElement {
  const auth = useAuth()
  const [data, setData] = useState<StudentPortalData>(emptyData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teacherSearch, setTeacherSearch] = useState('')

  const studentId = Number(auth.user?.profileId)
  const groupId = toNumberOrNull(data.group?.id)

  const loadStudentPortal = useCallback(async () => {
    if (auth.user?.profileType !== 'student' || !Number.isFinite(studentId)) {
      setError('У пользователя не указан студенческий профиль.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const studentRecord = await window.api.adminCrud.getById({
        entity: 'students',
        id: studentId
      })

      if (!studentRecord) {
        setData(emptyData)
        setError('Карточка студента не найдена.')
        return
      }

      const groupRecord = studentRecord.group_id
        ? await window.api.adminCrud.getById({
            entity: 'student_groups',
            id: Number(studentRecord.group_id)
          })
        : null

      const [
        statusRecord,
        departmentsResult,
        subjectsResult,
        teachersResult,
        disciplinesResult,
        semestersResult,
        specialtiesResult,
        facultiesResult,
        classmatesResult
      ] = await Promise.all([
        studentRecord.status_id
          ? window.api.adminCrud.getById({
              entity: 'dictionary_items',
              id: Number(studentRecord.status_id)
            })
          : Promise.resolve(null),
        window.api.adminCrud.list({
          entity: 'departments',
          page: 1,
          pageSize: 1000,
          orderBy: 'name',
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
          entity: 'teachers',
          page: 1,
          pageSize: 3000,
          orderBy: 'last_name',
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
          entity: 'semesters',
          page: 1,
          pageSize: 1000,
          orderBy: 'number',
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
          entity: 'faculties',
          page: 1,
          pageSize: 500,
          orderBy: 'name',
          orderDirection: 'asc'
        }),
        groupRecord?.id
          ? window.api.adminCrud.list({
              entity: 'students',
              page: 1,
              pageSize: 1000,
              filters: { group_id: Number(groupRecord.id) },
              orderBy: 'last_name',
              orderDirection: 'asc'
            })
          : Promise.resolve({ items: [] })
      ])

      const specialty =
        specialtiesResult.items.find((item) => Number(item.id) === Number(groupRecord?.specialty_id)) ??
        null
      const faculty =
        facultiesResult.items.find((item) => Number(item.id) === Number(specialty?.faculty_id)) ??
        null

      const [academicYear, educationForm, curriculumPlansResult] = await Promise.all([
        groupRecord?.academic_year_id
          ? window.api.adminCrud.getById({
              entity: 'academic_years',
              id: Number(groupRecord.academic_year_id)
            })
          : Promise.resolve(null),
        groupRecord?.education_form_id
          ? window.api.adminCrud.getById({
              entity: 'dictionary_items',
              id: Number(groupRecord.education_form_id)
            })
          : Promise.resolve(null),
        specialty?.id
          ? window.api.adminCrud.list({
              entity: 'curriculum_plans',
              page: 1,
              pageSize: 1000,
              filters: { specialty_id: Number(specialty.id) },
              orderBy: 'course',
              orderDirection: 'asc'
            })
          : Promise.resolve({ items: [] })
      ])

      const planIds = curriculumPlansResult.items
        .map((plan) => toNumberOrNull(plan.id))
        .filter((id): id is number => id !== null)

      const curriculumItemsResult =
        planIds.length > 0
          ? await window.api.adminCrud.list({
              entity: 'curriculum_items',
              page: 1,
              pageSize: 10000,
              filters: { curriculum_plan_id: planIds },
              orderBy: 'semester_id',
              orderDirection: 'asc'
            })
          : { items: [] }

      setData({
        student: studentRecord,
        group: groupRecord,
        status: statusRecord,
        specialty,
        faculty,
        academicYear,
        educationForm,
        departments: departmentsResult.items,
        subjects: subjectsResult.items,
        teachers: teachersResult.items,
        disciplines: disciplinesResult.items,
        curriculumPlans: curriculumPlansResult.items,
        curriculumItems: curriculumItemsResult.items,
        semesters: semestersResult.items,
        classmates: classmatesResult.items
      })
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Не удалось загрузить студенческий кабинет.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [auth.user?.profileType, studentId])

  useEffect(() => {
    void loadStudentPortal()
  }, [loadStudentPortal])

  const teacherRows = useMemo(() => {
    return createTeacherRows(data).filter((teacher) => {
      const query = teacherSearch.trim().toLowerCase()

      if (!query) {
        return true
      }

      return [teacher.name, teacher.department, teacher.subjects.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [data, teacherSearch])

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

      {!isLoading && data.student ? (
        <>
          {section === 'schedule' ? (
            <ScheduleItemsDrilldown
              initialGroupId={groupId}
              readOnly
              hideAudienceAvailability
            />
          ) : null}

          {section === 'curriculum' ? <CurriculumSection data={data} /> : null}

          {section === 'teachers' ? (
            <TeachersSection
              teachers={teacherRows}
              search={teacherSearch}
              onSearchChange={setTeacherSearch}
            />
          ) : null}

          {section === 'group' ? <GroupSection data={data} /> : null}

          {section === 'journal' ? (
            <LearningJournalMatrix initialGroupId={groupId} readOnly lockGroupSelection />
          ) : null}

          {section === 'performance' ? (
            <LearningJournalMatrix initialGroupId={groupId} readOnly lockGroupSelection />
          ) : null}

          {section === 'settings' ? (
            <SettingsSection data={data} username={auth.user?.username ?? 'student'} />
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function CurriculumSection({ data }: { data: StudentPortalData }): ReactElement {
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

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FiBookOpen className="h-5 w-5 text-[var(--color-primary)]" />
            <div>
              <CardTitle>Учебный план специальности</CardTitle>
              <CardDescription>
                План разделён на курсы и семестры. Данные берутся из основного модуля учебного процесса.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <InfoItem label="Факультет" value={getRecordNameOrDash(data.faculty)} />
            <InfoItem label="Специальность" value={getRecordNameOrDash(data.specialty)} />
            <InfoItem label="Форма обучения" value={getRecordNameOrDash(data.educationForm)} />
          </div>
        </CardContent>
      </Card>

      {data.curriculumPlans.length > 0 ? (
        data.curriculumPlans.map((plan) => {
          const planId = toNumberOrNull(plan.id)
          const items = planId === null ? [] : (itemsByPlanId.get(planId) ?? [])
          const itemsBySemester = groupItemsBySemester(items)

          return (
            <Card key={String(plan.id)} className="overflow-hidden">
              <CardHeader className="bg-[var(--color-surface-muted)]">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>{formatCourse(plan.course)}</CardTitle>
                    <CardDescription>{getRecordName(plan)}</CardDescription>
                  </div>
                  <Badge variant="muted">Семестров: {itemsBySemester.length}</Badge>
                </div>
              </CardHeader>

              <CardContent className="grid gap-4">
                {itemsBySemester.map((group) => (
                  <section
                    key={group.key}
                    className="overflow-hidden rounded-xl border border-[var(--color-border)]"
                  >
                    <div className="flex flex-col gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-semibold text-[var(--color-text)]">
                          {getRelationName(group.semesterId, semesterNameById)}
                        </h3>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          Дисциплины и часы семестра.
                        </p>
                      </div>
                      <Badge variant="muted">Дисциплин: {group.items.length}</Badge>
                    </div>

                    <SimpleTable
                      headers={['Предмет', 'Всего', 'Лекции', 'Практики', 'Лаб.', 'Самост.', 'Контроль']}
                      rows={group.items.map((item) => [
                        getRelationName(item.subject_id, subjectNameById),
                        formatValue(item.hours_total),
                        formatValue(item.hours_lectures),
                        formatValue(item.hours_practices),
                        formatValue(item.hours_labs),
                        formatValue(item.hours_self_study),
                        formatValue(item.control_form)
                      ])}
                    />
                  </section>
                ))}
              </CardContent>
            </Card>
          )
        })
      ) : (
        <EmptyState>Учебный план для специальности пока не заполнен.</EmptyState>
      )}
    </div>
  )
}

function TeachersSection({
  teachers,
  search,
  onSearchChange
}: {
  teachers: TeacherRow[]
  search: string
  onSearchChange: (value: string) => void
}): ReactElement {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FiUserCheck className="h-5 w-5 text-[var(--color-primary)]" />
            <div>
              <CardTitle>Преподаватели</CardTitle>
              <CardDescription>
                Поиск по преподавателям. Расписание занятий открывается тем же модулем расписания.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
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
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {teachers.map((teacher) => (
          <Card key={teacher.id}>
            <CardContent>
              <p className="font-semibold text-[var(--color-text)]">{teacher.name}</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{teacher.department}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {teacher.subjects.length > 0 ? (
                  teacher.subjects.slice(0, 4).map((subject) => (
                    <Badge key={subject} variant="muted">
                      {subject}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="muted">Предметы не указаны</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function GroupSection({ data }: { data: StudentPortalData }): ReactElement {
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
              <CardTitle>Моя группа</CardTitle>
              <CardDescription>Иерархия факультета, специальности и группы.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <InfoItem label="Факультет" value={getRecordNameOrDash(data.faculty)} />
            <InfoItem label="Декан" value={dean ? getPersonName(dean) : '—'} />
            <InfoItem label="Специальность" value={getRecordNameOrDash(data.specialty)} />
            <InfoItem label="Группа" value={getRecordNameOrDash(data.group)} />
            <InfoItem label="Курс" value={formatCourse(data.group?.course)} />
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

function SettingsSection({ data, username }: { data: StudentPortalData; username: string }): ReactElement {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FiSettings className="h-5 w-5 text-[var(--color-primary)]" />
            <div>
              <CardTitle>Профиль</CardTitle>
              <CardDescription>Личные данные и учебная принадлежность.</CardDescription>
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
            <InfoItem label="Факультет" value={getRecordNameOrDash(data.faculty)} />
            <InfoItem label="Специальность" value={getRecordNameOrDash(data.specialty)} />
            <InfoItem label="Группа" value={getRecordNameOrDash(data.group)} />
            <InfoItem label="Учебный год" value={getRecordNameOrDash(data.academicYear)} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface TeacherRow {
  id: string
  name: string
  department: string
  subjects: string[]
}

function createTeacherRows(data: StudentPortalData): TeacherRow[] {
  const departmentById = createRecordMap(data.departments)
  const subjectById = createRecordMap(data.subjects)

  return data.teachers.map((teacher) => {
    const department = getRecordById(teacher.department_id, departmentById)
    const subjects = parseMultiValue(teacher.teaching_subjects)
      .map((value) => getRecordById(value, subjectById))
      .filter((subject): subject is AdminCrudRecord => subject !== null)
      .map(getRecordName)

    return {
      id: String(teacher.id),
      name: getPersonName(teacher),
      department: department ? getRecordName(department) : 'Кафедра не указана',
      subjects
    }
  })
}

function groupItemsBySemester(items: AdminCrudRecord[]) {
  const groups = new Map<string, { key: string; semesterId: unknown; items: AdminCrudRecord[] }>()

  items.forEach((item) => {
    const key = String(item.semester_id ?? 'empty')
    const group = groups.get(key) ?? {
      key,
      semesterId: item.semester_id,
      items: []
    }

    group.items.push(item)
    groups.set(key, group)
  })

  return Array.from(groups.values()).sort((first, second) => Number(first.semesterId ?? 999) - Number(second.semesterId ?? 999))
}

function InfoItem({ label, value }: { label: string; value: unknown }): ReactElement {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2.5">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--color-text)]">{formatValue(value)}</p>
    </div>
  )
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }): ReactElement {
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

function EmptyState({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
      {children}
    </div>
  )
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

function getRecordNameOrDash(record: AdminCrudRecord | null): string {
  return record ? getRecordName(record) : '—'
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
  if (section === 'schedule') return 'То же расписание, что у администратора, но только в режиме просмотра.'
  if (section === 'curriculum') return 'Учебный план специальности по курсам и семестрам.'
  if (section === 'teachers') return 'Поиск преподавателей и краткая информация.'
  if (section === 'group') return 'Факультет, специальность, куратор и однокурсники.'
  if (section === 'journal') return 'Тот же журнал группы, что у администратора, но без возможности изменения.'
  if (section === 'performance') return 'Та же матрица журнала с оценками, но в режиме просмотра.'

  return 'Профиль, контакты и учебная принадлежность.'
}

function parseMultiValue(value: unknown): string[] {
  return String(value ?? '')
    .split(/\n|,|\/|\+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatCourse(value: unknown): string {
  const course = toNumberOrNull(value)

  return course === null ? 'Курс не указан' : `${course} курс`
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return String(value)
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}