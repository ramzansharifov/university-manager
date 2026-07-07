import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { FiRefreshCcw } from 'react-icons/fi'
import type { AdminCrudRecord } from '../../../features/admin-crud'
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
} from '../../../shared/ui'

const emptySelectValue = '__empty__'

type FilterOption = {
  value: string
  label: string
}

type GradeTone = 'empty' | 'minimum' | 'belowPassing' | 'passing' | 'maximum'

export function FinalGradeElementsMatrix(): ReactElement {
  const [faculties, setFaculties] = useState<AdminCrudRecord[]>([])
  const [specialties, setSpecialties] = useState<AdminCrudRecord[]>([])
  const [groups, setGroups] = useState<AdminCrudRecord[]>([])
  const [students, setStudents] = useState<AdminCrudRecord[]>([])
  const [subjects, setSubjects] = useState<AdminCrudRecord[]>([])
  const [disciplines, setDisciplines] = useState<AdminCrudRecord[]>([])
  const [academicYears, setAcademicYears] = useState<AdminCrudRecord[]>([])
  const [semesters, setSemesters] = useState<AdminCrudRecord[]>([])
  const [gradeElementTypes, setGradeElementTypes] = useState<AdminCrudRecord[]>([])
  const [gradeItems, setGradeItems] = useState<AdminCrudRecord[]>([])
  const [grades, setGrades] = useState<AdminCrudRecord[]>([])
  const [gradeCategories, setGradeCategories] = useState<AdminCrudRecord[]>([])

  const [selectedFacultyId, setSelectedFacultyId] = useState('')
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [selectedDisciplineId, setSelectedDisciplineId] = useState('')
  const [selectedFinalTypeId, setSelectedFinalTypeId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingGrade, setIsSavingGrade] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [gradeError, setGradeError] = useState<string | null>(null)

  const loadData = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const [
        facultiesResult,
        specialtiesResult,
        groupsResult,
        studentsResult,
        subjectsResult,
        disciplinesResult,
        academicYearsResult,
        semestersResult,
        gradeElementTypesResult,
        gradeItemsResult,
        gradesResult,
        gradeCategoriesResult
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
          entity: 'disciplines',
          page: 1,
          pageSize: 5000,
          orderBy: 'semester_id',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'academic_years',
          page: 1,
          pageSize: 500,
          orderBy: 'id',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'semesters',
          page: 1,
          pageSize: 500,
          orderBy: 'id',
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
          pageSize: 10000,
          orderBy: 'grade_date',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'grades',
          page: 1,
          pageSize: 20000,
          orderBy: 'id',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'dictionary_items',
          page: 1,
          pageSize: 100,
          filters: { dictionary_key: 'grade_categories' },
          orderBy: 'sort_order',
          orderDirection: 'asc'
        })
      ])

      setFaculties(facultiesResult.items)
      setSpecialties(specialtiesResult.items)
      setGroups(groupsResult.items)
      setStudents(studentsResult.items)
      setSubjects(subjectsResult.items)
      setDisciplines(disciplinesResult.items)
      setAcademicYears(academicYearsResult.items)
      setSemesters(semestersResult.items)
      setGradeElementTypes(gradeElementTypesResult.items)
      setGradeItems(gradeItemsResult.items)
      setGrades(gradesResult.items)
      setGradeCategories(gradeCategoriesResult.items)
    } catch (error) {
      setLoadError(getUserFacingError(error, 'Не удалось загрузить итоговые оценки'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const selectedFaculty = useMemo(
    () => faculties.find((faculty) => String(faculty.id) === selectedFacultyId) ?? null,
    [faculties, selectedFacultyId]
  )

  const selectedSpecialty = useMemo(
    () => specialties.find((specialty) => String(specialty.id) === selectedSpecialtyId) ?? null,
    [specialties, selectedSpecialtyId]
  )

  const selectedGroup = useMemo(
    () => groups.find((group) => String(group.id) === selectedGroupId) ?? null,
    [groups, selectedGroupId]
  )

  const selectedSemester = useMemo(
    () => semesters.find((semester) => String(semester.id) === selectedSemesterId) ?? null,
    [semesters, selectedSemesterId]
  )

  const selectedDiscipline = useMemo(
    () => disciplines.find((discipline) => String(discipline.id) === selectedDisciplineId) ?? null,
    [disciplines, selectedDisciplineId]
  )

  const selectedFinalType = useMemo(
    () => gradeElementTypes.find((item) => String(item.id) === selectedFinalTypeId) ?? null,
    [gradeElementTypes, selectedFinalTypeId]
  )

  const filteredSpecialties = useMemo(() => {
    if (!selectedFacultyId) {
      return []
    }

    return specialties.filter(
      (specialty) => Number(specialty.faculty_id) === Number(selectedFacultyId)
    )
  }, [selectedFacultyId, specialties])

  const filteredGroups = useMemo(() => {
    if (!selectedSpecialtyId) {
      return []
    }

    return groups.filter((group) => Number(group.specialty_id) === Number(selectedSpecialtyId))
  }, [groups, selectedSpecialtyId])

  const groupStudents = useMemo(() => {
    if (!selectedGroupId) {
      return []
    }

    return students
      .filter((student) => Number(student.group_id) === Number(selectedGroupId))
      .sort((firstStudent, secondStudent) =>
        getPersonFullName(firstStudent).localeCompare(getPersonFullName(secondStudent), 'ru')
      )
  }, [selectedGroupId, students])

  const groupDisciplines = useMemo(() => {
    if (!selectedGroupId) {
      return []
    }

    return disciplines.filter(
      (discipline) => Number(discipline.group_id) === Number(selectedGroupId)
    )
  }, [disciplines, selectedGroupId])

  const availableSemesterIds = useMemo(() => {
    const ids = new Set<number>()

    groupDisciplines.forEach((discipline) => {
      const semesterId = toNumberOrNull(discipline.semester_id)

      if (semesterId !== null) {
        ids.add(semesterId)
      }
    })

    return ids
  }, [groupDisciplines])

  const filteredSemesters = useMemo(() => {
    if (!selectedGroupId) {
      return []
    }

    const source =
      availableSemesterIds.size > 0
        ? semesters.filter((semester) => availableSemesterIds.has(Number(semester.id)))
        : semesters

    return [...source].sort(compareSemesters)
  }, [availableSemesterIds, selectedGroupId, semesters])

  const semesterDisciplines = useMemo(() => {
    if (!selectedGroupId || !selectedSemesterId) {
      return []
    }

    return groupDisciplines
      .filter((discipline) => Number(discipline.semester_id) === Number(selectedSemesterId))
      .sort((firstDiscipline, secondDiscipline) =>
        getDisciplineName(firstDiscipline, subjects).localeCompare(
          getDisciplineName(secondDiscipline, subjects),
          'ru'
        )
      )
  }, [groupDisciplines, selectedGroupId, selectedSemesterId, subjects])

  const finalGradeElementTypes = useMemo(
    () => gradeElementTypes.filter((item) => Number(item.is_final) === 1),
    [gradeElementTypes]
  )

  const selectedFinalGradeItem = useMemo(() => {
    if (!selectedDisciplineId || !selectedFinalTypeId) {
      return null
    }

    return (
      gradeItems.find(
        (gradeItem) =>
          Number(gradeItem.discipline_id) === Number(selectedDisciplineId) &&
          Number(gradeItem.grade_element_type_id) === Number(selectedFinalTypeId) &&
          toNumberOrNull(gradeItem.lesson_session_id) === null
      ) ??
      gradeItems.find(
        (gradeItem) =>
          Number(gradeItem.discipline_id) === Number(selectedDisciplineId) &&
          Number(gradeItem.grade_element_type_id) === Number(selectedFinalTypeId)
      ) ??
      null
    )
  }, [gradeItems, selectedDisciplineId, selectedFinalTypeId])

  const hasCompleteSelection = Boolean(
    selectedFaculty &&
    selectedSpecialty &&
    selectedGroup &&
    selectedSemester &&
    selectedDiscipline &&
    selectedFinalType
  )

  function handleFacultyChange(value: string): void {
    setSelectedFacultyId(value)
    setSelectedSpecialtyId('')
    setSelectedGroupId('')
    setSelectedSemesterId('')
    setSelectedDisciplineId('')
    setSelectedFinalTypeId('')
    setGradeError(null)
  }

  function handleSpecialtyChange(value: string): void {
    setSelectedSpecialtyId(value)
    setSelectedGroupId('')
    setSelectedSemesterId('')
    setSelectedDisciplineId('')
    setSelectedFinalTypeId('')
    setGradeError(null)
  }

  function handleGroupChange(value: string): void {
    setSelectedGroupId(value)
    setSelectedSemesterId('')
    setSelectedDisciplineId('')
    setSelectedFinalTypeId('')
    setGradeError(null)
  }

  function handleSemesterChange(value: string): void {
    setSelectedSemesterId(value)
    setSelectedDisciplineId('')
    setSelectedFinalTypeId('')
    setGradeError(null)
  }

  function handleDisciplineChange(value: string): void {
    setSelectedDisciplineId(value)
    setSelectedFinalTypeId('')
    setGradeError(null)
  }

  function handleFinalTypeChange(value: string): void {
    setSelectedFinalTypeId(value)
    setGradeError(null)
  }

  function resetFilters(): void {
    setSelectedFacultyId('')
    setSelectedSpecialtyId('')
    setSelectedGroupId('')
    setSelectedSemesterId('')
    setSelectedDisciplineId('')
    setSelectedFinalTypeId('')
    setGradeError(null)
  }

  function getStudentGradeRecord(
    student: AdminCrudRecord,
    gradeItem: AdminCrudRecord | null
  ): AdminCrudRecord | null {
    if (!gradeItem?.id) {
      return null
    }

    return (
      grades.find(
        (grade) =>
          Number(grade.grade_item_id) === Number(gradeItem.id) &&
          Number(grade.student_id) === Number(student.id)
      ) ?? null
    )
  }

  async function ensureFinalGradeItem(): Promise<AdminCrudRecord> {
    if (selectedFinalGradeItem?.id) {
      return selectedFinalGradeItem
    }

    if (!selectedDiscipline?.id || !selectedFinalType?.id) {
      throw new Error('Выбери дисциплину и итоговый оценочный элемент')
    }

    const maxScore = getGradeElementTypeMaxScore(selectedFinalType)
    const gradeCategoryId = getFinalGradeCategoryId(selectedFinalType, gradeCategories)
    const result = await window.api.adminCrud.create({
      entity: 'grade_items',
      data: {
        discipline_id: Number(selectedDiscipline.id),
        lesson_session_id: null,
        grade_element_type_id: Number(selectedFinalType.id),
        grade_category_id: gradeCategoryId,
        week_id: null,
        day_of_week: null,
        name: getRecordName(selectedFinalType),
        max_score: maxScore,
        grade_date: null,
        description: null
      }
    })

    if (!result.item?.id) {
      throw new Error('Не удалось создать итоговый оценочный элемент')
    }

    return result.item
  }

  async function saveStudentGrade(student: AdminCrudRecord, score: number | null): Promise<void> {
    if (isSavingGrade) {
      return
    }

    const studentId = toNumberOrNull(student.id)

    if (studentId === null) {
      setGradeError('Не удалось определить студента')
      return
    }

    setIsSavingGrade(true)
    setGradeError(null)

    try {
      const gradeItem =
        selectedFinalGradeItem ?? (score === null ? null : await ensureFinalGradeItem())
      const existingGrade = getStudentGradeRecord(student, gradeItem)

      if (score === null) {
        if (existingGrade?.id) {
          await window.api.adminCrud.delete({
            entity: 'grades',
            id: Number(existingGrade.id)
          })
          await loadData()
        }

        return
      }

      if (!gradeItem?.id) {
        throw new Error('Не удалось определить итоговый оценочный элемент')
      }

      if (existingGrade?.id) {
        await window.api.adminCrud.update({
          entity: 'grades',
          id: Number(existingGrade.id),
          data: {
            score
          }
        })
      } else {
        await window.api.adminCrud.create({
          entity: 'grades',
          data: {
            grade_item_id: Number(gradeItem.id),
            student_id: studentId,
            score,
            comment: null,
            graded_by_user_id: null
          }
        })
      }

      await loadData()
    } catch (error) {
      setGradeError(getUserFacingError(error, 'Не удалось сохранить итоговую оценку'))
    } finally {
      setIsSavingGrade(false)
    }
  }

  function handleScoreGradeBlur(student: AdminCrudRecord, value: string): void {
    const trimmedValue = value.trim().replace(',', '.')

    if (!trimmedValue) {
      void saveStudentGrade(student, null)
      return
    }

    const score = Number(trimmedValue)
    const minScore = getGradeElementTypeMinScore(selectedFinalType)
    const maxScore = getGradeElementTypeMaxScore(selectedFinalType)

    if (!Number.isFinite(score) || score < minScore || score > maxScore) {
      setGradeError(`Оценка должна быть числом от ${minScore} до ${maxScore}`)
      return
    }

    void saveStudentGrade(student, score)
  }

  function handlePassFailGradeChange(student: AdminCrudRecord, value: string): void {
    if (value === emptySelectValue) {
      void saveStudentGrade(student, null)
      return
    }

    void saveStudentGrade(student, value === 'pass' ? 1 : 0)
  }

  function renderGradeCell(student: AdminCrudRecord): ReactElement {
    const grade = getStudentGradeRecord(student, selectedFinalGradeItem)

    if (selectedFinalType?.grading_mode === 'pass_fail') {
      const value =
        grade?.score === null || grade?.score === undefined
          ? emptySelectValue
          : Number(grade.score) >= 1
            ? 'pass'
            : 'fail'

      return (
        <Select
          value={value}
          disabled={isSavingGrade}
          onValueChange={(nextValue) => handlePassFailGradeChange(student, nextValue)}
        >
          <SelectTrigger className="mx-auto h-8 w-32 text-xs">
            <SelectValue placeholder="—" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value={emptySelectValue}>—</SelectItem>
            <SelectItem value="pass">Сдал</SelectItem>
            <SelectItem value="fail">Не сдал</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    const minScore = getGradeElementTypeMinScore(selectedFinalType)
    const maxScore = getGradeElementTypeMaxScore(selectedFinalType)
    const score = toNumberOrNull(grade?.score)
    const tone = getGradeTone(
      score,
      minScore,
      maxScore,
      getGradeElementTypePassingScore(selectedFinalType)
    )

    return (
      <ScoreInput
        value={score === null ? '' : formatScoreValue(score)}
        disabled={isSavingGrade}
        toneClassName={getGradeToneClassName(tone)}
        onCommit={(value) => handleScoreGradeBlur(student, value)}
      />
    )
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle>Итоговые оценки</CardTitle>
              <CardDescription>
                Выбери группу, дисциплину и итоговый оценочный элемент, чтобы заполнить оценки
                студентов.
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void loadData()} disabled={isLoading}>
                <FiRefreshCcw />
                Обновить
              </Button>

              <Button variant="secondary" onClick={resetFilters}>
                Сбросить
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            <FilterSelect
              label="Факультет"
              value={selectedFacultyId}
              placeholder="Выбери факультет"
              options={faculties.map(toFilterOption)}
              onChange={handleFacultyChange}
            />

            <FilterSelect
              label="Специальность"
              value={selectedSpecialtyId}
              placeholder={selectedFacultyId ? 'Выбери специальность' : 'Сначала факультет'}
              disabled={!selectedFacultyId}
              options={filteredSpecialties.map(toFilterOption)}
              onChange={handleSpecialtyChange}
            />

            <FilterSelect
              label="Группа"
              value={selectedGroupId}
              placeholder={selectedSpecialtyId ? 'Выбери группу' : 'Сначала специальность'}
              disabled={!selectedSpecialtyId}
              options={filteredGroups.map(toFilterOption)}
              onChange={handleGroupChange}
            />

            <FilterSelect
              label="Семестр"
              value={selectedSemesterId}
              placeholder={selectedGroupId ? 'Выбери семестр' : 'Сначала группу'}
              disabled={!selectedGroupId || filteredSemesters.length === 0}
              options={filteredSemesters.map((semester) => ({
                value: String(semester.id),
                label: getSemesterLabel(semester, academicYears)
              }))}
              onChange={handleSemesterChange}
            />

            <FilterSelect
              label="Дисциплина"
              value={selectedDisciplineId}
              placeholder={selectedSemesterId ? 'Выбери дисциплину' : 'Сначала семестр'}
              disabled={!selectedSemesterId || semesterDisciplines.length === 0}
              options={semesterDisciplines.map((discipline) => ({
                value: String(discipline.id),
                label: getDisciplineName(discipline, subjects)
              }))}
              onChange={handleDisciplineChange}
            />

            <FilterSelect
              label="Итоговый элемент"
              value={selectedFinalTypeId}
              placeholder={
                finalGradeElementTypes.length > 0
                  ? 'Выбери итоговый элемент'
                  : 'Сначала создай итоговые элементы'
              }
              disabled={!selectedDisciplineId || finalGradeElementTypes.length === 0}
              options={finalGradeElementTypes.map(toFilterOption)}
              onChange={handleFinalTypeChange}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {selectedFaculty ? <Badge>{getRecordName(selectedFaculty)}</Badge> : null}
            {selectedSpecialty ? <Badge>{getRecordName(selectedSpecialty)}</Badge> : null}
            {selectedGroup ? <Badge>{getRecordName(selectedGroup)}</Badge> : null}
            {selectedSemester ? (
              <Badge>{getSemesterLabel(selectedSemester, academicYears)}</Badge>
            ) : null}
            {selectedDiscipline ? (
              <Badge>{getDisciplineName(selectedDiscipline, subjects)}</Badge>
            ) : null}
            {selectedFinalType ? (
              <Badge>{getGradeElementTypeDescription(selectedFinalType)}</Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {loadError ? (
        <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          {loadError}
        </div>
      ) : null}

      {gradeError ? (
        <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          {gradeError}
        </div>
      ) : null}

      {!hasCompleteSelection ? (
        <EmptyState text="Выбери факультет, специальность, группу, семестр, дисциплину и итоговый оценочный элемент." />
      ) : null}

      {hasCompleteSelection ? (
        <Card>
          <CardHeader>
            <CardTitle>Ведомость итоговых оценок</CardTitle>
            <CardDescription>
              {selectedGroup ? getRecordName(selectedGroup) : 'Группа'} ·{' '}
              {selectedDiscipline ? getDisciplineName(selectedDiscipline, subjects) : 'Дисциплина'}{' '}
              · {selectedFinalType ? getRecordName(selectedFinalType) : 'Итоговый элемент'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {groupStudents.length === 0 ? (
              <EmptyState text="В выбранной группе пока нет студентов." />
            ) : null}

            {groupStudents.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                <table className="w-full min-w-[44rem] border-collapse text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface-muted)]">
                      <th className="border-b border-r border-[var(--color-border)] px-4 py-3 text-left font-semibold text-[var(--color-text-muted)]">
                        Студент
                      </th>
                      <th className="border-b border-r border-[var(--color-border)] px-4 py-3 text-center font-semibold text-[var(--color-text-muted)]">
                        Оценка
                      </th>
                      <th className="border-b border-[var(--color-border)] px-4 py-3 text-left font-semibold text-[var(--color-text-muted)]">
                        Параметры
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {groupStudents.map((student) => (
                      <tr
                        key={String(student.id)}
                        className="border-b border-[var(--color-border)] last:border-b-0"
                      >
                        <td className="border-r border-[var(--color-border)] px-4 py-3 font-medium text-[var(--color-text)]">
                          {getPersonFullName(student)}
                        </td>
                        <td className="border-r border-[var(--color-border)] px-4 py-3 text-center">
                          {renderGradeCell(student)}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                          {selectedFinalType
                            ? getGradeElementTypeDescription(selectedFinalType)
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  options,
  placeholder,
  disabled,
  onChange
}: {
  label: string
  value: string
  options: FilterOption[]
  placeholder: string
  disabled?: boolean
  onChange: (value: string) => void
}): ReactElement {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
      <Select
        value={value || emptySelectValue}
        disabled={disabled}
        onValueChange={(nextValue) => onChange(nextValue === emptySelectValue ? '' : nextValue)}
      >
        <SelectTrigger className="min-w-0">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value={emptySelectValue}>Не выбрано</SelectItem>

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

function EmptyState({ text }: { text: string }): ReactElement {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
      {text}
    </div>
  )
}

function ScoreInput({
  value,
  disabled,
  toneClassName,
  onCommit
}: {
  value: string
  disabled?: boolean
  toneClassName?: string
  onCommit: (value: string) => void
}): ReactElement {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  return (
    <Input
      value={draft}
      inputMode="decimal"
      pattern="[0-9]*[.,]?[0-9]*"
      disabled={disabled}
      className={`mx-auto h-8 w-24 text-center text-xs ${toneClassName ?? ''}`}
      placeholder="—"
      onChange={(event) => {
        setDraft(sanitizeScoreInput(event.target.value))
      }}
      onBlur={() => onCommit(draft)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur()
        }
      }}
    />
  )
}

function getGradeElementTypeMaxScore(gradeElementType: AdminCrudRecord | null): number {
  if (gradeElementType?.grading_mode === 'pass_fail') {
    return 1
  }

  const maxScore = toNumberOrNull(gradeElementType?.max_score)

  if (maxScore === null || maxScore <= 0) {
    throw new Error('У выбранного оценочного элемента некорректно задан максимальный балл')
  }

  return maxScore
}

function getGradeElementTypeMinScore(gradeElementType: AdminCrudRecord | null): number {
  return toNumberOrNull(gradeElementType?.min_score) ?? 0
}

function getGradeElementTypePassingScore(gradeElementType: AdminCrudRecord | null): number | null {
  return toNumberOrNull(gradeElementType?.passing_score)
}

function getGradeElementTypeDescription(gradeElementType: AdminCrudRecord): string {
  if (gradeElementType.grading_mode === 'pass_fail') {
    return 'Сдал / не сдал'
  }

  const details = [
    `мин. ${getGradeElementTypeMinScore(gradeElementType)}`,
    `макс. ${getGradeElementTypeMaxScore(gradeElementType)}`
  ]
  const passingScore = getGradeElementTypePassingScore(gradeElementType)

  if (passingScore !== null) {
    details.push(`проходной ${passingScore}`)
  }

  return `Баллы · ${details.join(' · ')}`
}

function getFinalGradeCategoryId(
  gradeElementType: AdminCrudRecord,
  gradeCategories: AdminCrudRecord[]
): number | null {
  const name = getRecordName(gradeElementType).toLocaleLowerCase('ru-RU')
  const key =
    name.includes('экзамен') || name.includes('exam')
      ? 'exam'
      : name.includes('зач') || name.includes('credit')
        ? 'credit'
        : 'final'
  const category = gradeCategories.find((item) => String(item.item_key) === key)

  return toNumberOrNull(category?.id)
}

function getGradeTone(
  score: number | null,
  minScore: number,
  maxScore: number,
  passingScore: number | null
): GradeTone {
  if (score === null) {
    return 'empty'
  }

  if (areNumbersClose(score, maxScore)) {
    return 'maximum'
  }

  if (areNumbersClose(score, minScore)) {
    return 'minimum'
  }

  if (passingScore !== null && score < passingScore) {
    return 'belowPassing'
  }

  return 'passing'
}

function getGradeToneClassName(tone: GradeTone): string {
  switch (tone) {
    case 'minimum':
      return 'border-red-300 bg-red-100 text-red-900'
    case 'belowPassing':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'passing':
      return 'border-lime-200 bg-lime-50 text-lime-800'
    case 'maximum':
      return 'border-green-400 bg-green-100 text-green-900 font-semibold'
    default:
      return ''
  }
}

function toFilterOption(record: AdminCrudRecord): FilterOption {
  return {
    value: String(record.id),
    label: getRecordName(record)
  }
}

function getDisciplineName(discipline: AdminCrudRecord, subjects: AdminCrudRecord[]): string {
  if (discipline.name) {
    return String(discipline.name)
  }

  const subjectId = toNumberOrNull(discipline.subject_id)
  const subject = subjectId === null ? null : subjects.find((item) => Number(item.id) === subjectId)

  return subject ? getRecordName(subject) : getRecordName(discipline)
}

function getSemesterLabel(semester: AdminCrudRecord, academicYears: AdminCrudRecord[]): string {
  const number = toNumberOrNull(semester.number)
  const academicYearId = toNumberOrNull(semester.academic_year_id)
  const academicYear =
    academicYearId === null
      ? null
      : academicYears.find((item) => Number(item.id) === academicYearId)
  const semesterName = semester.name
    ? String(semester.name)
    : number
      ? `${number} семестр`
      : getRecordName(semester)

  return academicYear ? `${semesterName} · ${getRecordName(academicYear)}` : semesterName
}

function compareSemesters(firstSemester: AdminCrudRecord, secondSemester: AdminCrudRecord): number {
  const firstAcademicYearId = toNumberOrNull(firstSemester.academic_year_id) ?? 0
  const secondAcademicYearId = toNumberOrNull(secondSemester.academic_year_id) ?? 0

  if (firstAcademicYearId !== secondAcademicYearId) {
    return firstAcademicYearId - secondAcademicYearId
  }

  const firstNumber = toNumberOrNull(firstSemester.number) ?? 0
  const secondNumber = toNumberOrNull(secondSemester.number) ?? 0

  if (firstNumber !== secondNumber) {
    return firstNumber - secondNumber
  }

  return Number(firstSemester.id ?? 0) - Number(secondSemester.id ?? 0)
}

function sanitizeScoreInput(value: string): string {
  const normalized = value.replace(/[^\d.,]/g, '').replace(',', '.')
  const parts = normalized.split('.')

  if (parts.length <= 1) {
    return normalized
  }

  return `${parts[0]}.${parts.slice(1).join('')}`
}

function areNumbersClose(firstValue: number, secondValue: number): boolean {
  return Math.abs(firstValue - secondValue) < 0.0001
}

function formatScoreValue(value: number): string {
  if (Number.isInteger(value)) {
    return String(value)
  }

  return value.toFixed(2).replace(/\.?0+$/, '')
}

function getRecordName(record: AdminCrudRecord): string {
  return record.name ? String(record.name) : `#${String(record.id)}`
}

function getPersonFullName(record: AdminCrudRecord): string {
  const fullName = [record.last_name, record.first_name, record.middle_name]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .join(' ')

  return fullName || getRecordName(record)
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

function getUserFacingError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback
  }

  const message = error.message
    .replace(/^Error invoking remote method '[^']+':\s*/i, '')
    .replace(/^SqliteError:\s*/i, '')
    .trim()

  if (!message || /constraint failed|SQLITE_CONSTRAINT/i.test(message)) {
    return `${fallback}. Обнови данные и повтори попытку`
  }

  return message
}
