import type {
  AdminCrudColumnConfig,
  AdminCrudFieldConfig,
  AdminCrudRecord,
  AdminCrudSelectOption
} from '../../../features/admin-crud'

export const lessonSessionStatusOptions: AdminCrudSelectOption[] = [
  { value: 'planned', label: 'Запланировано' },
  { value: 'conducted', label: 'Проведено' },
  { value: 'cancelled', label: 'Отменено' }
]

export const completionStatusOptions: AdminCrudSelectOption[] = [
  { value: 'not_completed', label: 'Не выполнено' },
  { value: 'partially_completed', label: 'Частично выполнено' },
  { value: 'completed', label: 'Выполнено' }
]

export const topicCompletedOptions: AdminCrudSelectOption[] = [
  { value: '0', label: 'Нет' },
  { value: '1', label: 'Да' }
]

export const gradingModeOptions: AdminCrudSelectOption[] = [
  { value: 'score', label: 'Баллы' },
  { value: 'pass_fail', label: 'Сдал / не сдал' }
]

export const gradeElementTypeFields: AdminCrudFieldConfig[] = [
  {
    key: 'name',
    label: 'Название элемента',
    placeholder: 'Например: Экзамен, Зачёт, Контрольная работа',
    required: true
  },
  {
    key: 'grading_mode',
    label: 'Тип оценивания',
    placeholder: 'Выбери тип оценивания',
    type: 'select',
    options: gradingModeOptions,
    required: true,
    defaultValue: 'score'
  },
  {
    key: 'min_score',
    label: 'Минимальный балл',
    placeholder: 'Например: 0',
    type: 'number'
  },
  {
    key: 'max_score',
    label: 'Максимальный балл',
    placeholder: 'Например: 100',
    type: 'number'
  },
  {
    key: 'passing_score',
    label: 'Проходной балл',
    placeholder: 'Например: 60',
    type: 'number'
  },
  {
    key: 'is_intermediate',
    label: 'Промежуточный элемент',
    placeholder: 'Промежуточный элемент, например контрольная',
    type: 'checkbox',
    valueType: 'number',
    defaultValue: '0'
  },
  {
    key: 'is_final',
    label: 'Итоговый элемент',
    placeholder: 'Итоговый элемент, например экзамен или зачёт',
    type: 'checkbox',
    valueType: 'number',
    defaultValue: '0'
  },
  {
    key: 'description',
    label: 'Описание',
    placeholder: 'Дополнительная информация',
    type: 'textarea',
    fullWidth: true
  }
]

export const gradeElementTypeColumns: AdminCrudColumnConfig[] = [
  {
    key: 'name',
    label: 'Элемент'
  },
  {
    key: 'grading_mode',
    label: 'Тип оценивания',
    render: (record) => renderGradingMode(record.grading_mode)
  },
  {
    key: 'min_score',
    label: 'Мин. балл'
  },
  {
    key: 'max_score',
    label: 'Макс. балл'
  },
  {
    key: 'passing_score',
    label: 'Проходной'
  },
  {
    key: 'is_intermediate',
    label: 'Промежуточный',
    render: (record) => renderBoolean(record.is_intermediate)
  },
  {
    key: 'is_final',
    label: 'Итоговый',
    render: (record) => renderBoolean(record.is_final)
  },
  {
    key: 'description',
    label: 'Описание'
  }
]

export interface LearningJournalMaps {
  scheduleItemNameById: Map<number, string>
  lessonSessionNameById: Map<number, string>
  studentNameById: Map<number, string>
  attendanceStatusNameById: Map<number, string>
  disciplineNameById: Map<number, string>
  gradeCategoryNameById: Map<number, string>
  gradeItemNameById: Map<number, string>
  teacherNameById: Map<number, string>
  weekNameById: Map<number, string>
  completionStatusNameByValue: Map<string, string>
  lessonSessionStatusNameByValue: Map<string, string>
  topicCompletedNameByValue: Map<string, string>
}

export function createLessonSessionFields(options: {
  scheduleItemOptions: AdminCrudSelectOption[]
  weekOptions: AdminCrudSelectOption[]
  teacherOptions: AdminCrudSelectOption[]
}): AdminCrudFieldConfig[] {
  return [
    {
      key: 'schedule_item_id',
      label: 'Занятие из расписания',
      placeholder: 'Выбери занятие из расписания',
      type: 'select',
      valueType: 'number',
      options: options.scheduleItemOptions,
      required: true,
      autoFillTargets: [
        {
          targetKey: 'week_id',
          metaKey: 'week_id'
        },
        {
          targetKey: 'teacher_id',
          metaKey: 'teacher_id'
        },
        {
          targetKey: 'lesson_date',
          metaKey: 'lesson_date'
        }
      ]
    },
    {
      key: 'week_id',
      label: 'Неделя',
      placeholder: 'Заполнится из расписания',
      type: 'select',
      valueType: 'number',
      options: options.weekOptions,
      disabled: true
    },
    {
      key: 'lesson_date',
      label: 'Дата занятия',
      type: 'date',
      required: true
    },
    {
      key: 'teacher_id',
      label: 'Преподаватель',
      placeholder: 'Заполнится из расписания',
      type: 'select',
      valueType: 'number',
      options: options.teacherOptions,
      disabled: true
    },
    {
      key: 'topic',
      label: 'Тема занятия',
      placeholder: 'Например: Введение в тему',
      required: true
    },
    {
      key: 'status',
      label: 'Статус',
      placeholder: 'Выбери статус',
      type: 'select',
      options: lessonSessionStatusOptions,
      required: true
    },
    {
      key: 'comment',
      label: 'Комментарий',
      placeholder: 'Дополнительная информация',
      type: 'textarea',
      fullWidth: true
    }
  ]
}

export function createLessonSessionColumns(maps: LearningJournalMaps): AdminCrudColumnConfig[] {
  return [
    {
      key: 'lesson_date',
      label: 'Дата',
      type: 'date'
    },
    {
      key: 'schedule_item_id',
      label: 'Расписание',
      render: (record) => renderRelation(record.schedule_item_id, maps.scheduleItemNameById)
    },
    {
      key: 'topic',
      label: 'Тема'
    },
    {
      key: 'teacher_id',
      label: 'Преподаватель',
      render: (record) => renderRelation(record.teacher_id, maps.teacherNameById)
    },
    {
      key: 'status',
      label: 'Статус',
      render: (record) => renderStringRelation(record.status, maps.lessonSessionStatusNameByValue)
    }
  ]
}

export function createAttendanceFields(options: {
  lessonSessionOptions: AdminCrudSelectOption[]
  studentOptions: AdminCrudSelectOption[]
  attendanceStatusOptions: AdminCrudSelectOption[]
}): AdminCrudFieldConfig[] {
  return [
    {
      key: 'lesson_session_id',
      label: 'Занятие',
      placeholder: 'Выбери проведённое занятие',
      type: 'select',
      valueType: 'number',
      options: options.lessonSessionOptions,
      required: true,
      autoFillTargets: [
        {
          targetKey: 'group_id',
          metaKey: 'group_id'
        }
      ]
    },
    {
      key: 'group_id',
      label: 'Группа',
      virtual: true,
      hidden: true
    },
    {
      key: 'student_id',
      label: 'Студент',
      placeholder: 'Выбери студента группы',
      type: 'select',
      valueType: 'number',
      options: options.studentOptions,
      dependsOn: 'group_id',
      dependencyPlaceholder: 'Сначала выбери занятие',
      required: true
    },
    {
      key: 'attendance_status_id',
      label: 'Статус посещения',
      placeholder: 'Выбери статус',
      type: 'select',
      valueType: 'number',
      options: options.attendanceStatusOptions,
      required: true
    },
    {
      key: 'comment',
      label: 'Комментарий',
      placeholder: 'Причина отсутствия, примечание',
      type: 'textarea',
      fullWidth: true
    }
  ]
}

export function createAttendanceColumns(maps: LearningJournalMaps): AdminCrudColumnConfig[] {
  return [
    {
      key: 'lesson_session_id',
      label: 'Занятие',
      render: (record) => renderRelation(record.lesson_session_id, maps.lessonSessionNameById)
    },
    {
      key: 'student_id',
      label: 'Студент',
      render: (record) => renderRelation(record.student_id, maps.studentNameById)
    },
    {
      key: 'attendance_status_id',
      label: 'Посещение',
      render: (record) => renderRelation(record.attendance_status_id, maps.attendanceStatusNameById)
    },
    {
      key: 'comment',
      label: 'Комментарий'
    }
  ]
}

export function createGradeItemFields(options: {
  disciplineOptions: AdminCrudSelectOption[]
  gradeCategoryOptions: AdminCrudSelectOption[]
}): AdminCrudFieldConfig[] {
  return [
    {
      key: 'discipline_id',
      label: 'Дисциплина',
      placeholder: 'Выбери дисциплину',
      type: 'select',
      valueType: 'number',
      options: options.disciplineOptions,
      required: true
    },
    {
      key: 'grade_category_id',
      label: 'Категория',
      placeholder: 'Выбери категорию',
      type: 'select',
      valueType: 'number',
      options: options.gradeCategoryOptions
    },
    {
      key: 'name',
      label: 'Название работы',
      placeholder: 'Например: Контрольная работа №1',
      required: true
    },
    {
      key: 'max_score',
      label: 'Максимальный балл',
      placeholder: 'Например: 100',
      type: 'number',
      required: true
    },
    {
      key: 'grade_date',
      label: 'Дата',
      type: 'date'
    },
    {
      key: 'description',
      label: 'Описание',
      placeholder: 'Дополнительная информация',
      type: 'textarea',
      fullWidth: true
    }
  ]
}

export function createGradeItemColumns(maps: LearningJournalMaps): AdminCrudColumnConfig[] {
  return [
    {
      key: 'discipline_id',
      label: 'Дисциплина',
      render: (record) => renderRelation(record.discipline_id, maps.disciplineNameById)
    },
    {
      key: 'grade_category_id',
      label: 'Категория',
      render: (record) => renderRelation(record.grade_category_id, maps.gradeCategoryNameById)
    },
    {
      key: 'name',
      label: 'Работа'
    },
    {
      key: 'max_score',
      label: 'Макс. балл'
    },
    {
      key: 'grade_date',
      label: 'Дата',
      type: 'date'
    }
  ]
}

export function createGradeFields(options: {
  gradeItemOptions: AdminCrudSelectOption[]
  studentOptions: AdminCrudSelectOption[]
}): AdminCrudFieldConfig[] {
  return [
    {
      key: 'grade_item_id',
      label: 'Оценочная работа',
      placeholder: 'Выбери работу',
      type: 'select',
      valueType: 'number',
      options: options.gradeItemOptions,
      required: true,
      autoFillTargets: [
        {
          targetKey: 'group_id',
          metaKey: 'group_id'
        }
      ]
    },
    {
      key: 'group_id',
      label: 'Группа',
      virtual: true,
      hidden: true
    },
    {
      key: 'student_id',
      label: 'Студент',
      placeholder: 'Выбери студента группы',
      type: 'select',
      valueType: 'number',
      options: options.studentOptions,
      dependsOn: 'group_id',
      dependencyPlaceholder: 'Сначала выбери оценочную работу',
      required: true
    },
    {
      key: 'score',
      label: 'Балл',
      placeholder: 'Например: 85',
      type: 'number',
      required: true
    },
    {
      key: 'comment',
      label: 'Комментарий',
      placeholder: 'Комментарий к оценке',
      type: 'textarea',
      fullWidth: true
    }
  ]
}

export function createGradeColumns(maps: LearningJournalMaps): AdminCrudColumnConfig[] {
  return [
    {
      key: 'grade_item_id',
      label: 'Работа',
      render: (record) => renderRelation(record.grade_item_id, maps.gradeItemNameById)
    },
    {
      key: 'student_id',
      label: 'Студент',
      render: (record) => renderRelation(record.student_id, maps.studentNameById)
    },
    {
      key: 'score',
      label: 'Балл'
    },
    {
      key: 'comment',
      label: 'Комментарий'
    }
  ]
}

export const scoreScaleFields: AdminCrudFieldConfig[] = [
  {
    key: 'name',
    label: 'Название шкалы',
    placeholder: 'Например: Отлично',
    required: true
  },
  {
    key: 'min_score',
    label: 'Минимальный балл',
    placeholder: 'Например: 85',
    type: 'number',
    required: true
  },
  {
    key: 'max_score',
    label: 'Максимальный балл',
    placeholder: 'Например: 100',
    type: 'number',
    required: true
  },
  {
    key: 'result_name',
    label: 'Результат',
    placeholder: 'Например: Отлично',
    required: true
  }
]

export const scoreScaleColumns: AdminCrudColumnConfig[] = [
  {
    key: 'name',
    label: 'Шкала'
  },
  {
    key: 'min_score',
    label: 'От'
  },
  {
    key: 'max_score',
    label: 'До'
  },
  {
    key: 'result_name',
    label: 'Результат'
  }
]

export function createCompletionFields(options: {
  lessonSessionOptions: AdminCrudSelectOption[]
}): AdminCrudFieldConfig[] {
  return [
    {
      key: 'lesson_session_id',
      label: 'Занятие',
      placeholder: 'Выбери занятие',
      type: 'select',
      valueType: 'number',
      options: options.lessonSessionOptions,
      required: true
    },
    {
      key: 'status',
      label: 'Статус выполнения',
      placeholder: 'Выбери статус',
      type: 'select',
      options: completionStatusOptions,
      required: true
    },
    {
      key: 'topic_completed',
      label: 'Тема выполнена',
      placeholder: 'Выбери значение',
      type: 'select',
      valueType: 'number',
      options: topicCompletedOptions,
      required: true
    },
    {
      key: 'comment',
      label: 'Комментарий',
      placeholder: 'Что выполнено / что перенесено',
      type: 'textarea',
      fullWidth: true
    }
  ]
}

export function createCompletionColumns(maps: LearningJournalMaps): AdminCrudColumnConfig[] {
  return [
    {
      key: 'lesson_session_id',
      label: 'Занятие',
      render: (record) => renderRelation(record.lesson_session_id, maps.lessonSessionNameById)
    },
    {
      key: 'status',
      label: 'Статус',
      render: (record) => renderStringRelation(record.status, maps.completionStatusNameByValue)
    },
    {
      key: 'topic_completed',
      label: 'Тема выполнена',
      render: (record) =>
        renderStringRelation(String(record.topic_completed), maps.topicCompletedNameByValue)
    },
    {
      key: 'comment',
      label: 'Комментарий'
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

export function createStringOptionsMap(options: AdminCrudSelectOption[]): Map<string, string> {
  return new Map(options.map((option) => [option.value, option.label]))
}

export function createStudentOptions(items: AdminCrudRecord[]): AdminCrudSelectOption[] {
  return items.map((student) => ({
    value: String(student.id),
    label: getPersonName(student),
    meta: {
      group_id:
        student.group_id === null || student.group_id === undefined
          ? null
          : String(student.group_id)
    }
  }))
}

export function createScheduleItemOptions(
  items: AdminCrudRecord[],
  maps: {
    groupNameById: Map<number, string>
    disciplineNameById: Map<number, string>
    teacherNameById: Map<number, string>
    lessonPeriodNameById: Map<number, string>
    weekById: Map<number, AdminCrudRecord>
  }
): AdminCrudSelectOption[] {
  return items.map((item) => {
    const weekId = toNumberOrNull(item.week_id)
    const dayOfWeek = toNumberOrNull(item.day_of_week)
    const week = weekId === null ? undefined : maps.weekById.get(weekId)
    const lessonDate = week && dayOfWeek ? getDateByWeekDay(week.starts_at, dayOfWeek) : null

    const groupName = renderRelation(item.group_id, maps.groupNameById)
    const disciplineName = renderRelation(item.discipline_id, maps.disciplineNameById)
    const periodName = renderRelation(item.lesson_period_id, maps.lessonPeriodNameById)

    return {
      value: String(item.id),
      label: `${groupName} / ${disciplineName} / ${periodName}`,
      meta: {
        group_id:
          item.group_id === null || item.group_id === undefined ? null : String(item.group_id),
        discipline_id:
          item.discipline_id === null || item.discipline_id === undefined
            ? null
            : String(item.discipline_id),
        teacher_id:
          item.teacher_id === null || item.teacher_id === undefined
            ? null
            : String(item.teacher_id),
        week_id: item.week_id === null || item.week_id === undefined ? null : String(item.week_id),
        lesson_date: lessonDate
      }
    }
  })
}

export function createLessonSessionOptions(
  items: AdminCrudRecord[],
  maps: {
    scheduleItemNameById: Map<number, string>
    scheduleItemGroupIdById: Map<number, number>
  }
): AdminCrudSelectOption[] {
  return items.map((item) => {
    const scheduleItemId = toNumberOrNull(item.schedule_item_id)
    const groupId =
      scheduleItemId === null ? null : (maps.scheduleItemGroupIdById.get(scheduleItemId) ?? null)

    return {
      value: String(item.id),
      label: `${String(item.lesson_date ?? '')} / ${renderRelation(item.schedule_item_id, maps.scheduleItemNameById)}`,
      meta: {
        group_id: groupId === null ? null : String(groupId)
      }
    }
  })
}

export function createGradeItemOptions(
  items: AdminCrudRecord[],
  maps: {
    disciplineNameById: Map<number, string>
    disciplineGroupIdById: Map<number, number>
  }
): AdminCrudSelectOption[] {
  return items.map((item) => {
    const disciplineId = toNumberOrNull(item.discipline_id)
    const groupId =
      disciplineId === null ? null : (maps.disciplineGroupIdById.get(disciplineId) ?? null)

    return {
      value: String(item.id),
      label: `${String(item.name ?? '')} / ${renderRelation(item.discipline_id, maps.disciplineNameById)}`,
      meta: {
        group_id: groupId === null ? null : String(groupId)
      }
    }
  })
}

export function createDisciplineOptions(
  items: AdminCrudRecord[],
  maps: {
    subjectNameById: Map<number, string>
    groupNameById: Map<number, string>
  }
): AdminCrudSelectOption[] {
  return items.map((item) => {
    const subjectName = renderRelation(item.subject_id, maps.subjectNameById)
    const groupName = renderRelation(item.group_id, maps.groupNameById)
    const disciplineName = item.name ? String(item.name) : subjectName

    return {
      value: String(item.id),
      label: `${disciplineName} / ${groupName}`
    }
  })
}

export function createWeekOptions(items: AdminCrudRecord[]): AdminCrudSelectOption[] {
  return items.map((item) => {
    const dates =
      item.starts_at && item.ends_at ? `: ${String(item.starts_at)}–${String(item.ends_at)}` : ''

    return {
      value: String(item.id),
      label: `${String(item.number ?? '')} неделя${dates}`
    }
  })
}

export function createLessonPeriodOptions(items: AdminCrudRecord[]): AdminCrudSelectOption[] {
  return items.map((item) => ({
    value: String(item.id),
    label: `${String(item.number ?? '')} пара: ${String(item.starts_at ?? '')}–${String(item.ends_at ?? '')}`
  }))
}

export function getRecordName(record: AdminCrudRecord): string {
  if (record.name) {
    return String(record.name)
  }

  return `#${String(record.id)}`
}

export function getPersonName(record: AdminCrudRecord): string {
  const name = [record.last_name, record.first_name, record.middle_name]
    .filter(Boolean)
    .map(String)
    .join(' ')
    .trim()

  return name || getRecordName(record)
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

function renderStringRelation(value: unknown, labelsByValue: Map<string, string>): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return labelsByValue.get(String(value)) ?? String(value)
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

function getDateByWeekDay(weekStartsAt: unknown, dayOfWeek: number): string | null {
  if (!weekStartsAt || dayOfWeek < 1 || dayOfWeek > 7) {
    return null
  }

  const startDate = parseDate(String(weekStartsAt))
  const date = addDays(startDate, dayOfWeek - 1)

  return formatDate(date)
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

function renderGradingMode(value: unknown): string {
  if (value === 'pass_fail') {
    return 'Сдал / не сдал'
  }

  return 'Баллы'
}

function renderBoolean(value: unknown): string {
  return value === true || value === 'true' || value === '1' || value === 1 ? 'Да' : 'Нет'
}
