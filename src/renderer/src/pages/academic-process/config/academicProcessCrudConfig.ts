import type {
  AdminCrudColumnConfig,
  AdminCrudFieldConfig,
  AdminCrudRecord,
  AdminCrudSelectOption
} from '../../../features/admin-crud'
import { formatDateRangeForDisplay } from '../../../shared/lib/date'
import type { DisciplineProgress } from '../lib/disciplineProgress'

export interface AcademicProcessColumnMaps {
  departmentNameById: Map<number, string>
}

export interface DepartmentFacultyScope {
  appliesToAllFaculties: boolean
  facultyIds: Set<number>
}

export function createSubjectFields(
  departmentOptions: AdminCrudSelectOption[]
): AdminCrudFieldConfig[] {
  return [
    {
      key: 'department_id',
      label: 'Кафедра',
      placeholder: 'Выбери кафедру',
      type: 'select',
      valueType: 'number',
      options: departmentOptions
    },
    {
      key: 'name',
      label: 'Название предмета',
      placeholder: 'Например: Базы данных',
      required: true
    },
    {
      key: 'description',
      label: 'Описание',
      placeholder: 'Краткое описание предмета',
      type: 'textarea'
    }
  ]
}

export function createSubjectColumns(maps: AcademicProcessColumnMaps): AdminCrudColumnConfig[] {
  return [
    {
      key: 'id',
      label: 'ID'
    },
    {
      key: 'department_id',
      label: 'Кафедра',
      render: (record) => renderRelation(record.department_id, maps.departmentNameById)
    },
    {
      key: 'name',
      label: 'Предмет'
    },
    {
      key: 'description',
      label: 'Описание'
    }
  ]
}

export function createOptions(
  items: AdminCrudRecord[],
  labelFactory: (record: AdminCrudRecord) => string
): AdminCrudSelectOption[] {
  return items.map((item) => {
    const label = labelFactory(item).trim()

    return {
      value: String(item.id),
      label: label || `#${String(item.id)}`
    }
  })
}

export function createOptionsMap(options: AdminCrudSelectOption[]): Map<number, string> {
  return new Map(options.map((option) => [Number(option.value), option.label]))
}

export function getRecordName(record: AdminCrudRecord): string {
  if (record.name) {
    return String(record.name)
  }

  if (record.short_name) {
    return String(record.short_name)
  }

  return `#${String(record.id)}`
}

function renderRelation(value: unknown, labelsById: Map<number, string>): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  const id = Number(value)

  if (!Number.isFinite(id)) {
    return String(value)
  }

  return labelsById.get(id) ?? `#${id}`
}

export const specialtySelectorColumns: AdminCrudColumnConfig[] = [
  {
    key: 'id',
    label: 'ID'
  },
  {
    key: 'code',
    label: 'Код'
  },
  {
    key: 'name',
    label: 'Специальность'
  },
  {
    key: 'degree',
    label: 'Уровень'
  },
  {
    key: 'study_duration_years',
    label: 'Срок обучения'
  }
]

export function createCurriculumPlanFields(options: {
  academicYearOptions: AdminCrudSelectOption[]
  educationFormOptions: AdminCrudSelectOption[]
}): AdminCrudFieldConfig[] {
  return [
    {
      key: 'course',
      label: 'Курс обучения',
      placeholder: 'Например: 1',
      type: 'number',
      required: true,
      defaultValue: '1'
    },
    {
      key: 'academic_year_id',
      label: 'Учебный год',
      placeholder: 'Выбери учебный год',
      type: 'select',
      valueType: 'number',
      options: options.academicYearOptions,
      required: true
    },
    {
      key: 'education_form_id',
      label: 'Форма обучения',
      placeholder: 'Выбери форму обучения',
      type: 'select',
      valueType: 'number',
      options: options.educationFormOptions
    },
    {
      key: 'name',
      label: 'Название учебного плана',
      placeholder: 'Например: 1 курс / 2025-2026 / очная форма',
      required: true
    },
    {
      key: 'note',
      label: 'Примечание',
      placeholder: 'Дополнительная информация',
      type: 'textarea'
    }
  ]
}

export function createCurriculumPlanColumns(maps: {
  academicYearNameById: Map<number, string>
  educationFormNameById: Map<number, string>
}): AdminCrudColumnConfig[] {
  return [
    {
      key: 'id',
      label: 'ID'
    },
    {
      key: 'course',
      label: 'Курс'
    },
    {
      key: 'name',
      label: 'Учебный план'
    },
    {
      key: 'academic_year_id',
      label: 'Учебный год',
      render: (record) => renderRelation(record.academic_year_id, maps.academicYearNameById)
    },
    {
      key: 'education_form_id',
      label: 'Форма',
      render: (record) => renderRelation(record.education_form_id, maps.educationFormNameById)
    },
    {
      key: 'note',
      label: 'Примечание'
    }
  ]
}

export function createCurriculumItemFields(options: {
  subjectOptions: AdminCrudSelectOption[]
  semesterOptions: AdminCrudSelectOption[]
  finalGradeElementTypeOptions: AdminCrudSelectOption[]
}): AdminCrudFieldConfig[] {
  return [
    {
      key: 'subject_id',
      label: 'Предмет',
      placeholder: 'Выбери предмет',
      type: 'select',
      valueType: 'number',
      options: options.subjectOptions,
      required: true
    },
    {
      key: 'semester_id',
      label: 'Семестр',
      placeholder: 'Выбери семестр',
      type: 'select',
      valueType: 'number',
      options: options.semesterOptions,
      required: true
    },
    {
      key: 'hours_total',
      label: 'Всего часов',
      placeholder: 'Например: 144',
      type: 'number',
      required: true
    },
    {
      key: 'hours_lectures',
      label: 'Лекции',
      placeholder: 'Например: 36',
      type: 'number',
      required: true
    },
    {
      key: 'hours_practices',
      label: 'Практики',
      placeholder: 'Например: 36',
      type: 'number',
      required: true
    },
    {
      key: 'hours_labs',
      label: 'Лабораторные',
      placeholder: 'Например: 18',
      type: 'number',
      required: true
    },
    {
      key: 'hours_self_study',
      label: 'Самостоятельная работа',
      placeholder: 'Например: 54',
      type: 'number',
      required: true
    },
    {
      key: 'control_form',
      label: 'Форма контроля',
      placeholder:
        options.finalGradeElementTypeOptions.length > 0
          ? 'Выбери форму контроля'
          : 'Сначала создай итоговые оценочные элементы в разделе «Журнал обучения»',
      type: 'select',
      options: options.finalGradeElementTypeOptions,
      required: true,
      fullWidth: true
    }
  ]
}

export function createCurriculumItemColumns(maps: {
  subjectNameById: Map<number, string>
  semesterNameById: Map<number, string>
}): AdminCrudColumnConfig[] {
  return [
    {
      key: 'id',
      label: 'ID'
    },
    {
      key: 'subject_id',
      label: 'Предмет',
      render: (record) => renderRelation(record.subject_id, maps.subjectNameById)
    },
    {
      key: 'semester_id',
      label: 'Семестр',
      render: (record) => renderRelation(record.semester_id, maps.semesterNameById)
    },
    {
      key: 'hours_total',
      label: 'Всего'
    },
    {
      key: 'hours_lectures',
      label: 'Лекции'
    },
    {
      key: 'hours_practices',
      label: 'Практики'
    },
    {
      key: 'hours_labs',
      label: 'Лаб.'
    },
    {
      key: 'hours_self_study',
      label: 'Самост.'
    },
    {
      key: 'control_form',
      label: 'Контроль',
      render: (record) => formatControlForms(record.control_form)
    }
  ]
}
export const academicYearFields: AdminCrudFieldConfig[] = [
  {
    key: 'starts_at',
    label: 'Дата начала учебного года',
    placeholder: 'дд.мм.гггг',
    type: 'date',
    required: true
  }
]

export function createAcademicYearColumns(maps: {
  semesterByAcademicYearAndNumber: Map<string, AdminCrudRecord>
}): AdminCrudColumnConfig[] {
  return [
    {
      key: 'id',
      label: 'ID'
    },
    {
      key: 'name',
      label: 'Учебный год'
    },
    {
      key: 'starts_at',
      label: 'Начало года',
      type: 'date'
    },
    {
      key: 'ends_at',
      label: 'Окончание года',
      type: 'date'
    },
    {
      key: 'first_semester_dates',
      label: '1 семестр',
      render: (record) =>
        renderSemesterDateRange(
          getAcademicYearSemester(maps.semesterByAcademicYearAndNumber, record, 1)
        )
    },
    {
      key: 'second_semester_dates',
      label: '2 семестр',
      render: (record) =>
        renderSemesterDateRange(
          getAcademicYearSemester(maps.semesterByAcademicYearAndNumber, record, 2)
        )
    }
  ]
}

export function createSemesterByAcademicYearAndNumber(
  items: AdminCrudRecord[]
): Map<string, AdminCrudRecord> {
  const result = new Map<string, AdminCrudRecord>()

  items.forEach((semester) => {
    const academicYearId = toNumberOrNull(semester.academic_year_id)
    const semesterNumber = toNumberOrNull(semester.number)

    if (academicYearId === null || semesterNumber === null) {
      return
    }

    result.set(createAcademicYearSemesterKey(academicYearId, semesterNumber), semester)
  })

  return result
}

function getAcademicYearSemester(
  semesterByAcademicYearAndNumber: Map<string, AdminCrudRecord>,
  academicYear: AdminCrudRecord,
  semesterNumber: number
): AdminCrudRecord | undefined {
  const academicYearId = toNumberOrNull(academicYear.id)

  if (academicYearId === null) {
    return undefined
  }

  return semesterByAcademicYearAndNumber.get(
    createAcademicYearSemesterKey(academicYearId, semesterNumber)
  )
}

function createAcademicYearSemesterKey(academicYearId: number, semesterNumber: number): string {
  return `${academicYearId}:${semesterNumber}`
}

function renderSemesterDateRange(semester: AdminCrudRecord | undefined): string {
  if (!semester) {
    return 'Не сформирован'
  }

  return formatDateRangeForDisplay(semester.starts_at, semester.ends_at, {
    fallback: 'Не сформирован',
    separator: ' — '
  })
}
export const vacationTypeOptions: AdminCrudSelectOption[] = [
  {
    value: 'intermediate',
    label: 'Промежуточные каникулы'
  },
  {
    value: 'after_course',
    label: 'Послекурсовые каникулы'
  }
]

export function createAcademicVacationFields(
  academicYearOptions: AdminCrudSelectOption[]
): AdminCrudFieldConfig[] {
  return [
    {
      key: 'academic_year_id',
      label: 'Учебный год',
      placeholder: 'Выбери учебный год',
      type: 'select',
      valueType: 'number',
      options: academicYearOptions,
      required: true
    },
    {
      key: 'vacation_type',
      label: 'Тип каникул',
      placeholder: 'Выбери тип каникул',
      type: 'select',
      options: vacationTypeOptions,
      required: true
    },
    {
      key: 'starts_at',
      label: 'Дата начала',
      placeholder: 'дд.мм.гггг',
      type: 'date',
      required: true
    },
    {
      key: 'ends_at',
      label: 'Дата окончания',
      placeholder: 'дд.мм.гггг',
      type: 'date',
      visibleWhen: {
        fieldKey: 'vacation_type',
        value: 'intermediate'
      }
    },
    {
      key: 'description',
      label: 'Примечание',
      placeholder: 'Дополнительная информация',
      type: 'textarea'
    }
  ]
}

export function createAcademicVacationColumns(maps: {
  academicYearNameById: Map<number, string>
}): AdminCrudColumnConfig[] {
  return [
    {
      key: 'id',
      label: 'ID'
    },
    {
      key: 'academic_year_id',
      label: 'Учебный год',
      render: (record) => renderRelation(record.academic_year_id, maps.academicYearNameById)
    },
    {
      key: 'vacation_type',
      label: 'Тип',
      render: (record) => renderVacationType(record.vacation_type)
    },
    {
      key: 'starts_at',
      label: 'Начало',
      type: 'date'
    },
    {
      key: 'ends_at',
      label: 'Окончание',
      type: 'date'
    },
    {
      key: 'description',
      label: 'Примечание'
    }
  ]
}

function renderVacationType(value: unknown): string {
  const option = vacationTypeOptions.find((item) => item.value === String(value))

  return option?.label ?? String(value ?? '—')
}

export function createGroupSelectorColumns(
  academicYearNameById: Map<number, string>
): AdminCrudColumnConfig[] {
  return [
    {
      key: 'id',
      label: 'ID'
    },
    {
      key: 'name',
      label: 'Группа'
    },
    {
      key: 'course',
      label: 'Курс'
    },
    {
      key: 'academic_year_id',
      label: 'Учебный год поступления',
      render: (record) => renderRelation(record.academic_year_id, academicYearNameById)
    },
    {
      key: 'description',
      label: 'Описание'
    }
  ]
}

export function createCurriculumItemOptions(
  items: AdminCrudRecord[],
  maps: {
    subjectNameById: Map<number, string>
    semesterNameById: Map<number, string>
    subjectDepartmentIdById?: Map<number, number>
    departmentFacultyScopeById?: Map<number, DepartmentFacultyScope>
  }
): AdminCrudSelectOption[] {
  return items.map((item) => {
    const subjectId = toNumberOrNull(item.subject_id)
    const semesterId = toNumberOrNull(item.semester_id)

    const subjectName = renderRelation(item.subject_id, maps.subjectNameById)
    const semesterName = renderRelation(item.semester_id, maps.semesterNameById)

    const subjectDepartmentId =
      subjectId === null ? null : (maps.subjectDepartmentIdById?.get(subjectId) ?? null)

    const subjectFacultyScope =
      subjectDepartmentId === null
        ? undefined
        : maps.departmentFacultyScopeById?.get(subjectDepartmentId)
    const subjectFacultyIds = getSortedFacultyIds(subjectFacultyScope)
    const firstSubjectFacultyId = subjectFacultyIds[0] ?? null

    return {
      value: String(item.id),
      label: `${subjectName} / ${semesterName}`,
      meta: {
        subject_id: subjectId === null ? null : String(subjectId),
        semester_id: semesterId === null ? null : String(semesterId),
        subject_name: subjectName === '—' ? null : subjectName,
        subject_department_id: subjectDepartmentId === null ? null : String(subjectDepartmentId),
        subject_faculty_id: firstSubjectFacultyId === null ? null : String(firstSubjectFacultyId),
        subject_faculty_ids: subjectFacultyIds.join(','),
        subject_applies_to_all_faculties: subjectFacultyScope?.appliesToAllFaculties ? '1' : '0'
      }
    }
  })
}

export function createDisciplineFields(options: {
  curriculumItemOptions: AdminCrudSelectOption[]
  subjectOptions: AdminCrudSelectOption[]
  teacherOptions: AdminCrudSelectOption[]
  semesterOptions: AdminCrudSelectOption[]
}): AdminCrudFieldConfig[] {
  return [
    {
      key: 'curriculum_item_id',
      label: 'Пункт учебного плана',
      placeholder: 'Выбери пункт плана',
      type: 'select',
      valueType: 'number',
      options: options.curriculumItemOptions,
      required: true,
      autoFillTargets: [
        {
          targetKey: 'subject_id',
          metaKey: 'subject_id'
        },
        {
          targetKey: 'semester_id',
          metaKey: 'semester_id'
        },
        {
          targetKey: 'name',
          metaKey: 'subject_name'
        },
        {
          targetKey: 'subject_department_id',
          metaKey: 'subject_department_id'
        },
        {
          targetKey: 'subject_faculty_id',
          metaKey: 'subject_faculty_id'
        },
        {
          targetKey: 'subject_faculty_ids',
          metaKey: 'subject_faculty_ids'
        },
        {
          targetKey: 'subject_applies_to_all_faculties',
          metaKey: 'subject_applies_to_all_faculties'
        }
      ]
    },
    {
      key: 'subject_id',
      label: 'Предмет',
      placeholder: 'Предмет заполнится из пункта плана',
      type: 'select',
      valueType: 'number',
      options: options.subjectOptions,
      disabled: true,
      required: true
    },
    {
      key: 'semester_id',
      label: 'Семестр',
      placeholder: 'Семестр заполнится из пункта плана',
      type: 'select',
      valueType: 'number',
      options: options.semesterOptions,
      disabled: true,
      required: true
    },
    {
      key: 'subject_department_id',
      label: 'Кафедра предмета',
      virtual: true,
      hidden: true
    },
    {
      key: 'subject_faculty_id',
      label: 'Факультет предмета',
      virtual: true,
      hidden: true
    },
    {
      key: 'subject_faculty_ids',
      label: 'Факультеты предмета',
      virtual: true,
      hidden: true
    },
    {
      key: 'subject_applies_to_all_faculties',
      label: 'Кафедра предмета доступна всем факультетам',
      virtual: true,
      hidden: true
    },
    {
      key: 'teacher_id',
      label: 'Преподаватель',
      placeholder: 'Выбери преподавателя кафедры предмета',
      type: 'select',
      valueType: 'number',
      options: options.teacherOptions,
      dependsOn: 'subject_id',
      optionFilter: { kind: 'discipline-teacher-scope' },
      dependencyPlaceholder: 'Сначала выбери пункт учебного плана',
      required: true
    },
    {
      key: 'name',
      label: 'Название дисциплины',
      placeholder: 'Заполнится названием предмета, но можно изменить'
    }
  ]
}

export function createDisciplineColumns(maps: {
  curriculumItemNameById: Map<number, string>
  subjectNameById: Map<number, string>
  teacherNameById: Map<number, string>
  semesterNameById: Map<number, string>
  disciplineProgressById?: Map<number, DisciplineProgress>
}): AdminCrudColumnConfig[] {
  return [
    {
      key: 'id',
      label: 'ID'
    },
    {
      key: 'curriculum_item_id',
      label: 'Пункт плана',
      render: (record) => renderRelation(record.curriculum_item_id, maps.curriculumItemNameById)
    },
    {
      key: 'subject_id',
      label: 'Предмет',
      render: (record) => renderRelation(record.subject_id, maps.subjectNameById)
    },
    {
      key: 'teacher_id',
      label: 'Преподаватель',
      render: (record) => renderRelation(record.teacher_id, maps.teacherNameById)
    },
    {
      key: 'semester_id',
      label: 'Семестр',
      render: (record) => renderRelation(record.semester_id, maps.semesterNameById)
    },
    {
      key: 'progress',
      label: 'Выполнение',
      render: (record) => renderDisciplineProgress(record, maps.disciplineProgressById)
    },
    {
      key: 'name',
      label: 'Название'
    }
  ]
}

export function getPersonName(record: AdminCrudRecord): string {
  return [record.last_name, record.first_name, record.middle_name]
    .filter(Boolean)
    .map(String)
    .join(' ')
}

export function getSemesterName(record: AdminCrudRecord): string {
  if (record.number) {
    return `${String(record.number)} семестр`
  }

  return getRecordName(record)
}

export function formatControlForms(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return String(value)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ')
}

function renderDisciplineProgress(
  record: AdminCrudRecord,
  disciplineProgressById: Map<number, DisciplineProgress> | undefined
): string {
  const disciplineId = toNumberOrNull(record.id)
  const progress = disciplineId === null ? undefined : disciplineProgressById?.get(disciplineId)

  if (!progress?.hasCurriculumItem) {
    return 'План не связан'
  }

  if (progress.requiredPairs <= 0) {
    return 'Аудиторная нагрузка не задана'
  }

  const statusText = progress.isFullyScheduled
    ? 'расписание заполнено'
    : `осталось ${progress.remainingPairs}`

  return `Запланировано ${progress.scheduledPairs}/${progress.requiredPairs} пар · проведено ${progress.conductedPairs} · ${statusText}`
}

function getSortedFacultyIds(scope: DepartmentFacultyScope | undefined): number[] {
  return Array.from(scope?.facultyIds ?? []).sort((firstId, secondId) => firstId - secondId)
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}
