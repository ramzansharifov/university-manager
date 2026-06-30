import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import type { AdminCrudRecord } from '../../../features/admin-crud'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../shared/ui'

const weekDayLabels = [
  { value: 1, shortLabel: 'Пн' },
  { value: 2, shortLabel: 'Вт' },
  { value: 3, shortLabel: 'Ср' },
  { value: 4, shortLabel: 'Чт' },
  { value: 5, shortLabel: 'Пт' },
  { value: 6, shortLabel: 'Сб' },
  { value: 7, shortLabel: 'Вс' }
]

export function LearningJournalMatrix() {
  const [faculties, setFaculties] = useState<AdminCrudRecord[]>([])
  const [specialties, setSpecialties] = useState<AdminCrudRecord[]>([])
  const [groups, setGroups] = useState<AdminCrudRecord[]>([])
  const [students, setStudents] = useState<AdminCrudRecord[]>([])
  const [subjects, setSubjects] = useState<AdminCrudRecord[]>([])
  const [disciplines, setDisciplines] = useState<AdminCrudRecord[]>([])
  const [weeks, setWeeks] = useState<AdminCrudRecord[]>([])
  const [gradeElementTypes, setGradeElementTypes] = useState<AdminCrudRecord[]>([])
  const [gradeItems, setGradeItems] = useState<AdminCrudRecord[]>([])
  const [grades, setGrades] = useState<AdminCrudRecord[]>([])

  const [selectedFaculty, setSelectedFaculty] = useState<AdminCrudRecord | null>(null)
  const [selectedSpecialty, setSelectedSpecialty] = useState<AdminCrudRecord | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<AdminCrudRecord | null>(null)
  const [selectedDisciplineId, setSelectedDisciplineId] = useState('')
  const [selectedWeekId, setSelectedWeekId] = useState('')

  const loadData = useCallback(async () => {
    const [
      facultiesResult,
      specialtiesResult,
      groupsResult,
      studentsResult,
      subjectsResult,
      disciplinesResult,
      weeksResult,
      gradeElementTypesResult,
      gradeItemsResult,
      gradesResult
    ] = await Promise.all([
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
        pageSize: 500,
        orderBy: 'name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'student_groups',
        page: 1,
        pageSize: 500,
        orderBy: 'name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'students',
        page: 1,
        pageSize: 2000,
        orderBy: 'last_name',
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
        entity: 'disciplines',
        page: 1,
        pageSize: 2000,
        orderBy: 'id',
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
        entity: 'grade_element_types',
        page: 1,
        pageSize: 500,
        orderBy: 'name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'grade_items',
        page: 1,
        pageSize: 2000,
        orderBy: 'grade_date',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'grades',
        page: 1,
        pageSize: 5000,
        orderBy: 'id',
        orderDirection: 'asc'
      })
    ])

    setFaculties(facultiesResult.items)
    setSpecialties(specialtiesResult.items)
    setGroups(groupsResult.items)
    setStudents(studentsResult.items)
    setSubjects(subjectsResult.items)
    setDisciplines(disciplinesResult.items)
    setWeeks(weeksResult.items)
    setGradeElementTypes(gradeElementTypesResult.items)
    setGradeItems(gradeItemsResult.items)
    setGrades(gradesResult.items)
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const subjectNameById = useMemo(() => createRecordNameMap(subjects), [subjects])

  const gradeElementTypeById = useMemo(
    () => createRecordMap(gradeElementTypes),
    [gradeElementTypes]
  )

  const gradeByStudentAndItem = useMemo(() => {
    const map = new Map<string, AdminCrudRecord>()

    grades.forEach((grade) => {
      const studentId = toNumberOrNull(grade.student_id)
      const gradeItemId = toNumberOrNull(grade.grade_item_id)

      if (studentId === null || gradeItemId === null) {
        return
      }

      map.set(createGradeKey(studentId, gradeItemId), grade)
    })

    return map
  }, [grades])

  const selectedFacultySpecialties = useMemo(() => {
    if (!selectedFaculty) {
      return []
    }

    return specialties.filter(
      (specialty) => Number(specialty.faculty_id) === Number(selectedFaculty.id)
    )
  }, [selectedFaculty, specialties])

  const selectedSpecialtyGroups = useMemo(() => {
    if (!selectedSpecialty) {
      return []
    }

    return groups.filter((group) => Number(group.specialty_id) === Number(selectedSpecialty.id))
  }, [groups, selectedSpecialty])

  const groupStudents = useMemo(() => {
    if (!selectedGroup) {
      return []
    }

    return students.filter((student) => Number(student.group_id) === Number(selectedGroup.id))
  }, [selectedGroup, students])

  const groupDisciplines = useMemo(() => {
    if (!selectedGroup) {
      return []
    }

    return disciplines.filter(
      (discipline) => Number(discipline.group_id) === Number(selectedGroup.id)
    )
  }, [disciplines, selectedGroup])

  useEffect(() => {
    if (!selectedGroup) {
      setSelectedDisciplineId('')
      return
    }

    const disciplineIds = groupDisciplines.map((discipline) => String(discipline.id))

    if (disciplineIds.length === 0) {
      setSelectedDisciplineId('')
      return
    }

    if (!disciplineIds.includes(selectedDisciplineId)) {
      setSelectedDisciplineId(disciplineIds[0])
    }
  }, [groupDisciplines, selectedDisciplineId, selectedGroup])

  const selectedDiscipline = useMemo(() => {
    if (!selectedDisciplineId) {
      return null
    }

    return (
      groupDisciplines.find((discipline) => String(discipline.id) === selectedDisciplineId) ?? null
    )
  }, [groupDisciplines, selectedDisciplineId])

  const semesterWeeks = useMemo(() => {
    const semesterId = toNumberOrNull(selectedDiscipline?.semester_id)

    if (semesterId === null) {
      return []
    }

    return weeks.filter((week) => Number(week.semester_id) === semesterId).sort(compareWeeks)
  }, [selectedDiscipline, weeks])

  useEffect(() => {
    if (!selectedDiscipline) {
      setSelectedWeekId('')
      return
    }

    const weekIds = semesterWeeks.map((week) => String(week.id))

    if (weekIds.length === 0) {
      setSelectedWeekId('')
      return
    }

    if (!weekIds.includes(selectedWeekId)) {
      setSelectedWeekId(weekIds[0])
    }
  }, [selectedDiscipline, selectedWeekId, semesterWeeks])

  const selectedWeek = useMemo(() => {
    if (!selectedWeekId) {
      return null
    }

    return semesterWeeks.find((week) => String(week.id) === selectedWeekId) ?? null
  }, [selectedWeekId, semesterWeeks])

  const selectedWeekIndex = useMemo(
    () => semesterWeeks.findIndex((week) => String(week.id) === selectedWeekId),
    [selectedWeekId, semesterWeeks]
  )

  const selectedWeekDays = useMemo(() => {
    if (!selectedWeek?.starts_at) {
      return []
    }

    const startDate = parseDate(String(selectedWeek.starts_at))

    return weekDayLabels.map((day) => {
      const date = addDays(startDate, day.value - 1)

      return {
        ...day,
        date,
        isoDate: formatDate(date),
        dayNumber: String(date.getUTCDate()).padStart(2, '0')
      }
    })
  }, [selectedWeek])

  const selectedWeekGradeItems = useMemo(() => {
    if (!selectedDiscipline || !selectedWeek) {
      return []
    }

    return gradeItems
      .filter((item) => Number(item.discipline_id) === Number(selectedDiscipline.id))
      .filter((item) => isGradeItemInWeek(item, selectedWeek))
      .sort(compareGradeItems)
  }, [gradeItems, selectedDiscipline, selectedWeek])

  const gradeItemsByDay = useMemo(() => {
    const map = new Map<number, AdminCrudRecord[]>()

    selectedWeekGradeItems.forEach((item) => {
      const dayOfWeek = getGradeItemDayOfWeek(item, selectedWeek)

      if (dayOfWeek === null) {
        return
      }

      const items = map.get(dayOfWeek) ?? []
      items.push(item)
      map.set(dayOfWeek, items)
    })

    return map
  }, [selectedWeek, selectedWeekGradeItems])

  function openFaculty(record: AdminCrudRecord) {
    setSelectedFaculty(record)
    setSelectedSpecialty(null)
    setSelectedGroup(null)
    setSelectedDisciplineId('')
    setSelectedWeekId('')
  }

  function openSpecialty(record: AdminCrudRecord) {
    setSelectedSpecialty(record)
    setSelectedGroup(null)
    setSelectedDisciplineId('')
    setSelectedWeekId('')
  }

  function openGroup(record: AdminCrudRecord) {
    setSelectedGroup(record)
    setSelectedDisciplineId('')
    setSelectedWeekId('')
  }

  function backToFaculties() {
    setSelectedFaculty(null)
    setSelectedSpecialty(null)
    setSelectedGroup(null)
    setSelectedDisciplineId('')
    setSelectedWeekId('')
  }

  function backToSpecialties() {
    setSelectedSpecialty(null)
    setSelectedGroup(null)
    setSelectedDisciplineId('')
    setSelectedWeekId('')
  }

  function backToGroups() {
    setSelectedGroup(null)
    setSelectedDisciplineId('')
    setSelectedWeekId('')
  }

  function openPreviousWeek() {
    if (selectedWeekIndex <= 0) {
      return
    }

    setSelectedWeekId(String(semesterWeeks[selectedWeekIndex - 1].id))
  }

  function openNextWeek() {
    if (selectedWeekIndex < 0 || selectedWeekIndex >= semesterWeeks.length - 1) {
      return
    }

    setSelectedWeekId(String(semesterWeeks[selectedWeekIndex + 1].id))
  }

  return (
    <div className="grid gap-4">
      <JournalBreadcrumb
        faculty={selectedFaculty}
        specialty={selectedSpecialty}
        group={selectedGroup}
        onFacultiesClick={backToFaculties}
        onSpecialtiesClick={selectedFaculty ? backToSpecialties : undefined}
        onGroupsClick={selectedSpecialty ? backToGroups : undefined}
      />

      {!selectedFaculty ? (
        <SelectionTable
          title="Факультеты"
          description="Выбери факультет, чтобы открыть специальности."
          items={faculties}
          columns={[
            { key: 'name', label: 'Факультет' },
            { key: 'short_name', label: 'Краткое название' }
          ]}
          emptyMessage="Факультеты пока не созданы."
          onOpen={openFaculty}
        />
      ) : null}

      {selectedFaculty && !selectedSpecialty ? (
        <SelectionTable
          title={`Специальности: ${getRecordName(selectedFaculty)}`}
          description="Выбери специальность, чтобы открыть группы."
          items={selectedFacultySpecialties}
          columns={[
            { key: 'code', label: 'Код' },
            { key: 'name', label: 'Специальность' },
            { key: 'degree', label: 'Уровень' }
          ]}
          emptyMessage="У этого факультета пока нет специальностей."
          onOpen={openSpecialty}
        />
      ) : null}

      {selectedFaculty && selectedSpecialty && !selectedGroup ? (
        <SelectionTable
          title={`Группы: ${getRecordName(selectedSpecialty)}`}
          description="Выбери группу, чтобы открыть её журнал."
          items={selectedSpecialtyGroups}
          columns={[
            { key: 'name', label: 'Группа' },
            { key: 'course', label: 'Курс' },
            { key: 'description', label: 'Описание' }
          ]}
          emptyMessage="У этой специальности пока нет групп."
          onOpen={openGroup}
        />
      ) : null}

      {selectedGroup ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <CardTitle>
                  Журнал группы: {getRecordName(selectedGroup)}
                  {selectedWeek ? ` · ${getMonthYearLabel(selectedWeek)}` : ''}
                </CardTitle>
                <CardDescription>
                  Недельный журнал: студенты слева, дни недели сверху, оценки в клетках.
                </CardDescription>
              </div>

              <div className="grid w-full gap-3 xl:max-w-xl xl:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-[var(--color-text)]">Дисциплина</span>
                  <select
                    value={selectedDisciplineId}
                    onChange={(event) => setSelectedDisciplineId(event.target.value)}
                    className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  >
                    {groupDisciplines.map((discipline) => (
                      <option key={String(discipline.id)} value={String(discipline.id)}>
                        {getDisciplineName(discipline, subjectNameById)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-[var(--color-text)]">Неделя</span>
                  <select
                    value={selectedWeekId}
                    disabled={semesterWeeks.length === 0}
                    onChange={(event) => setSelectedWeekId(event.target.value)}
                    className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {semesterWeeks.map((week) => (
                      <option key={String(week.id)} value={String(week.id)}>
                        {getWeekLabel(week)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {groupDisciplines.length === 0 ? (
              <EmptyState text="У этой группы пока нет дисциплин. Добавь дисциплины в разделе «Учебный процесс → Дисциплины групп»." />
            ) : null}

            {groupDisciplines.length > 0 && semesterWeeks.length === 0 ? (
              <EmptyState text="Для семестра выбранной дисциплины пока нет недель." />
            ) : null}

            {groupDisciplines.length > 0 && groupStudents.length === 0 ? (
              <EmptyState text="В этой группе пока нет студентов." />
            ) : null}

            {groupDisciplines.length > 0 && groupStudents.length > 0 && selectedWeek ? (
              <div className="grid gap-4">
                <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-[var(--color-text)]">
                      {getMonthYearLabel(selectedWeek)}
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {getWeekLabel(selectedWeek)} · {getWeekDateRangeLabel(selectedWeek)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={selectedWeekIndex <= 0}
                      onClick={openPreviousWeek}
                    >
                      <FiChevronLeft />
                      Пред. неделя
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={
                        selectedWeekIndex < 0 || selectedWeekIndex >= semesterWeeks.length - 1
                      }
                      onClick={openNextWeek}
                    >
                      След. неделя
                      <FiChevronRight />
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-[var(--color-surface-muted)]">
                        <th className="sticky left-0 z-20 min-w-64 border-b border-r border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-left font-semibold text-[var(--color-text-muted)]">
                          Студент
                        </th>

                        {selectedWeekDays.map((day) => (
                          <th
                            key={day.value}
                            className="min-w-44 border-b border-r border-[var(--color-border)] px-4 py-3 text-left last:border-r-0"
                          >
                            <div className="grid gap-1">
                              <span className="font-semibold text-[var(--color-text)]">
                                {day.shortLabel} {day.dayNumber}
                              </span>
                              <span className="text-xs font-normal text-[var(--color-text-muted)]">
                                {formatDateLabel(day.isoDate)}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {groupStudents.map((student) => (
                        <tr
                          key={String(student.id)}
                          className="border-b border-[var(--color-border)] last:border-b-0"
                        >
                          <td className="sticky left-0 z-10 border-r border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 font-medium text-[var(--color-text)]">
                            {getPersonName(student)}
                          </td>

                          {selectedWeekDays.map((day) => {
                            const dayItems = gradeItemsByDay.get(day.value) ?? []

                            return (
                              <td
                                key={day.value}
                                className="border-r border-[var(--color-border)] px-3 py-3 align-top text-[var(--color-text)] last:border-r-0"
                              >
                                {dayItems.length === 0 ? (
                                  <span className="text-[var(--color-text-muted)]">—</span>
                                ) : (
                                  <div className="grid gap-2">
                                    {dayItems.map((item) => {
                                      const grade = gradeByStudentAndItem.get(
                                        createGradeKey(Number(student.id), Number(item.id))
                                      )

                                      return (
                                        <div
                                          key={String(item.id)}
                                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1"
                                        >
                                          <div className="text-xs text-[var(--color-text-muted)]">
                                            {getRecordName(item)}
                                          </div>
                                          <div className="font-semibold">
                                            {formatGradeValue(grade, item, gradeElementTypeById)}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="muted">Студентов: {groupStudents.length}</Badge>
                  <Badge variant="muted">Дисциплин: {groupDisciplines.length}</Badge>
                  <Badge variant="muted">Колонок недели: {selectedWeekGradeItems.length}</Badge>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function JournalBreadcrumb({
  faculty,
  specialty,
  group,
  onFacultiesClick,
  onSpecialtiesClick,
  onGroupsClick
}: {
  faculty: AdminCrudRecord | null
  specialty: AdminCrudRecord | null
  group: AdminCrudRecord | null
  onFacultiesClick: () => void
  onSpecialtiesClick?: () => void
  onGroupsClick?: () => void
}) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={faculty ? 'secondary' : 'primary'} onClick={onFacultiesClick}>
          Факультеты
        </Button>

        {faculty ? (
          <>
            <span className="text-sm text-[var(--color-text-muted)]">/</span>
            <Button
              size="sm"
              variant={specialty ? 'secondary' : 'primary'}
              onClick={onSpecialtiesClick}
            >
              Специальности
            </Button>
            <Badge>{getRecordName(faculty)}</Badge>
          </>
        ) : null}

        {specialty ? (
          <>
            <span className="text-sm text-[var(--color-text-muted)]">/</span>
            <Button size="sm" variant={group ? 'secondary' : 'primary'} onClick={onGroupsClick}>
              Группы
            </Button>
            <Badge>{getRecordName(specialty)}</Badge>
          </>
        ) : null}

        {group ? (
          <>
            <span className="text-sm text-[var(--color-text-muted)]">/</span>
            <Badge>{getRecordName(group)}</Badge>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

function SelectionTable({
  title,
  description,
  items,
  columns,
  emptyMessage,
  onOpen
}: {
  title: string
  description: string
  items: AdminCrudRecord[]
  columns: Array<{ key: string; label: string }>
  emptyMessage: string
  onOpen: (record: AdminCrudRecord) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-[var(--color-surface-muted)]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="border-b border-[var(--color-border)] px-4 py-3 text-left font-semibold text-[var(--color-text-muted)]"
                  >
                    {column.label}
                  </th>
                ))}

                <th className="w-24 border-b border-[var(--color-border)] px-4 py-3 text-right font-semibold text-[var(--color-text-muted)]">
                  Действия
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr
                  key={String(item.id)}
                  className="cursor-pointer border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-muted)]"
                  onClick={() => onOpen(item)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-[var(--color-text)]">
                      {formatCellValue(item[column.key])}
                    </td>
                  ))}

                  <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="primary"
                        title="Открыть"
                        aria-label="Открыть"
                        onClick={() => onOpen(item)}
                      >
                        <FiArrowRight />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-8 text-center text-[var(--color-text-muted)]"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
      {text}
    </div>
  )
}

function createRecordMap(items: AdminCrudRecord[]): Map<number, AdminCrudRecord> {
  return new Map(
    items
      .map((item) => [toNumberOrNull(item.id), item] as const)
      .filter((entry): entry is readonly [number, AdminCrudRecord] => entry[0] !== null)
  )
}

function createRecordNameMap(items: AdminCrudRecord[]): Map<number, string> {
  return new Map(
    items
      .map((item) => [toNumberOrNull(item.id), getRecordName(item)] as const)
      .filter((entry): entry is readonly [number, string] => entry[0] !== null)
  )
}

function getDisciplineName(
  discipline: AdminCrudRecord,
  subjectNameById: Map<number, string>
): string {
  if (discipline.name) {
    return String(discipline.name)
  }

  const subjectId = toNumberOrNull(discipline.subject_id)

  if (subjectId !== null) {
    return subjectNameById.get(subjectId) ?? `#${subjectId}`
  }

  return getRecordName(discipline)
}

function getWeekLabel(week: AdminCrudRecord): string {
  return `${String(week.number ?? '')} неделя`
}

function getMonthYearLabel(week: AdminCrudRecord): string {
  const date = week.starts_at ? parseDate(String(week.starts_at)) : new Date()

  return new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric'
  }).format(date)
}

function getWeekDateRangeLabel(week: AdminCrudRecord): string {
  if (!week.starts_at || !week.ends_at) {
    return 'Без дат'
  }

  return `${formatDateLabel(String(week.starts_at))}–${formatDateLabel(String(week.ends_at))}`
}

function getGradeItemDayOfWeek(
  item: AdminCrudRecord,
  selectedWeek: AdminCrudRecord | null
): number | null {
  const explicitDay = toNumberOrNull(item.day_of_week)

  if (explicitDay !== null && explicitDay >= 1 && explicitDay <= 7) {
    return explicitDay
  }

  if (!item.grade_date || !selectedWeek?.starts_at) {
    return null
  }

  const gradeDate = parseDate(String(item.grade_date))
  const weekStartDate = parseDate(String(selectedWeek.starts_at))
  const diffDays = Math.floor(
    (gradeDate.getTime() - weekStartDate.getTime()) / (24 * 60 * 60 * 1000)
  )

  if (diffDays < 0 || diffDays > 6) {
    return null
  }

  return diffDays + 1
}

function isGradeItemInWeek(item: AdminCrudRecord, week: AdminCrudRecord): boolean {
  const itemWeekId = toNumberOrNull(item.week_id)

  if (itemWeekId !== null) {
    return itemWeekId === Number(week.id)
  }

  if (!item.grade_date || !week.starts_at || !week.ends_at) {
    return false
  }

  const gradeDate = String(item.grade_date)

  return gradeDate >= String(week.starts_at) && gradeDate <= String(week.ends_at)
}

function formatGradeValue(
  grade: AdminCrudRecord | undefined,
  item: AdminCrudRecord,
  gradeElementTypeById: Map<number, AdminCrudRecord>
): string {
  if (!grade) {
    return '—'
  }

  const elementTypeId = toNumberOrNull(item.grade_element_type_id)
  const elementType = elementTypeId === null ? null : gradeElementTypeById.get(elementTypeId)

  if (elementType?.grading_mode === 'pass_fail') {
    return Number(grade.score) > 0 ? 'Сдал' : 'Не сдал'
  }

  return String(grade.score ?? '—')
}

function compareGradeItems(firstItem: AdminCrudRecord, secondItem: AdminCrudRecord): number {
  const firstDay = toNumberOrNull(firstItem.day_of_week)
  const secondDay = toNumberOrNull(secondItem.day_of_week)

  if (firstDay !== null && secondDay !== null && firstDay !== secondDay) {
    return firstDay - secondDay
  }

  const firstDate = String(firstItem.grade_date ?? '')
  const secondDate = String(secondItem.grade_date ?? '')

  if (firstDate !== secondDate) {
    return firstDate.localeCompare(secondDate)
  }

  return Number(firstItem.id) - Number(secondItem.id)
}

function compareWeeks(firstWeek: AdminCrudRecord, secondWeek: AdminCrudRecord): number {
  const firstNumber = toNumberOrNull(firstWeek.number)
  const secondNumber = toNumberOrNull(secondWeek.number)

  if (firstNumber !== null && secondNumber !== null && firstNumber !== secondNumber) {
    return firstNumber - secondNumber
  }

  return Number(firstWeek.id) - Number(secondWeek.id)
}

function createGradeKey(studentId: number, gradeItemId: number): string {
  return `${studentId}:${gradeItemId}`
}

function getRecordName(record: AdminCrudRecord): string {
  if (record.name) {
    return String(record.name)
  }

  return `#${String(record.id)}`
}

function getPersonName(record: AdminCrudRecord): string {
  const name = [record.last_name, record.first_name, record.middle_name]
    .filter(Boolean)
    .map(String)
    .join(' ')
    .trim()

  return name || getRecordName(record)
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return String(value)
}

function formatDateLabel(value: string): string {
  const [year, month, day] = value.split('-')

  if (!year || !month || !day) {
    return value
  }

  return `${day}.${month}.${year}`
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)

  return new Date(Date.UTC(year, month - 1, day))
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function formatDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}
