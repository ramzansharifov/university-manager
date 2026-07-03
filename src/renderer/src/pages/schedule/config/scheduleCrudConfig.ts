import type {
  AdminCrudColumnConfig,
  AdminCrudFieldConfig,
  AdminCrudRecord,
  AdminCrudSelectOption
} from '../../../features/admin-crud'
import { formatDateRangeForDisplay } from '../../../shared/lib/date'

export interface ScheduleColumnMaps {
  audienceTypeNameById: Map<number, string>
  buildingNameById: Map<number, string>
}

export const audienceTypeFields: AdminCrudFieldConfig[] = [
  {
    key: 'name',
    label: 'Название типа',
    placeholder: 'Например: лекционная, семинарская, лаборатория',
    required: true
  },
  {
    key: 'description',
    label: 'Описание',
    placeholder: 'Дополнительная информация',
    type: 'textarea'
  }
]

export const audienceTypeColumns: AdminCrudColumnConfig[] = [
  {
    key: 'id',
    label: 'ID'
  },
  {
    key: 'name',
    label: 'Тип аудитории'
  },
  {
    key: 'description',
    label: 'Описание'
  }
]

export const lessonTypeFields: AdminCrudFieldConfig[] = [
  {
    key: 'name',
    label: 'Название типа занятия',
    placeholder: 'Например: Лекция, Практика, Контрольная работа',
    required: true
  }
]

export const lessonTypeColumns: AdminCrudColumnConfig[] = [
  {
    key: 'id',
    label: 'ID'
  },
  {
    key: 'name',
    label: 'Тип занятия'
  }
]

export const buildingFields: AdminCrudFieldConfig[] = [
  {
    key: 'name',
    label: 'Название корпуса',
    placeholder: 'Например: Главный корпус',
    required: true
  },
  {
    key: 'address',
    label: 'Адрес',
    placeholder: 'Адрес корпуса'
  },
  {
    key: 'description',
    label: 'Описание',
    placeholder: 'Дополнительная информация',
    type: 'textarea'
  }
]

export const buildingColumns: AdminCrudColumnConfig[] = [
  {
    key: 'id',
    label: 'ID'
  },
  {
    key: 'name',
    label: 'Корпус'
  },
  {
    key: 'address',
    label: 'Адрес'
  },
  {
    key: 'description',
    label: 'Описание'
  }
]

export function createAudienceFields(options: {
  audienceTypeOptions: AdminCrudSelectOption[]
  buildingOptions: AdminCrudSelectOption[]
}): AdminCrudFieldConfig[] {
  return [
    {
      key: 'name',
      label: 'Номер / название аудитории',
      placeholder: 'Например: 105, 804, Стадион, Актовый зал',
      required: true
    },
    {
      key: 'audience_type_id',
      label: 'Тип аудитории',
      placeholder: 'Выбери тип аудитории',
      type: 'select',
      valueType: 'number',
      options: options.audienceTypeOptions,
      required: true
    },
    {
      key: 'building_id',
      label: 'Корпус',
      placeholder: 'Выбери корпус, если он нужен',
      type: 'select',
      valueType: 'number',
      options: options.buildingOptions
    },
    {
      key: 'capacity',
      label: 'Вместимость',
      placeholder: 'Например: 30',
      type: 'number'
    }
  ]
}

export function createAudienceColumns(maps: ScheduleColumnMaps): AdminCrudColumnConfig[] {
  return [
    {
      key: 'id',
      label: 'ID'
    },
    {
      key: 'name',
      label: 'Аудитория'
    },
    {
      key: 'audience_type_id',
      label: 'Тип',
      render: (record) => renderRelation(record.audience_type_id, maps.audienceTypeNameById)
    },
    {
      key: 'building_id',
      label: 'Корпус',
      render: (record) => renderRelation(record.building_id, maps.buildingNameById)
    },
    {
      key: 'floor',
      label: 'Этаж'
    },
    {
      key: 'capacity',
      label: 'Вместимость'
    }
  ]
}

export const lessonPeriodFields: AdminCrudFieldConfig[] = [
  {
    key: 'starts_at',
    label: 'Начало пары',
    placeholder: 'Например: 08:30',
    type: 'time',
    required: true
  },
  {
    key: 'duration_minutes',
    label: 'Длительность пары, минут',
    placeholder: 'Например: 90',
    type: 'number',
    virtual: true,
    persistKey: 'university-manager.lesson-period.duration-minutes',
    persistWhenCheckedKey: 'remember_duration'
  },
  {
    key: 'remember_duration',
    label: 'Запомнить длительность',
    placeholder: 'Запомнить эту длительность для следующих пар',
    type: 'checkbox',
    virtual: true
  },
  {
    key: 'ends_at',
    label: 'Конец пары',
    placeholder: 'Например: 10:00',
    type: 'time',
    required: true,
    autoFillTimeEnd: {
      startKey: 'starts_at',
      durationKey: 'duration_minutes'
    }
  }
]

export const lessonPeriodColumns: AdminCrudColumnConfig[] = [
  {
    key: 'number',
    label: '№ пары'
  },
  {
    key: 'name',
    label: 'Название'
  },
  {
    key: 'starts_at',
    label: 'Начало'
  },
  {
    key: 'ends_at',
    label: 'Конец'
  },
  {
    key: 'break_after',
    label: 'Перерыв после',
    render: (record) => getBreakAfterText(record)
  }
]

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

  return `#${String(record.id)}`
}

export const dayOfWeekOptions: AdminCrudSelectOption[] = [
  { value: '1', label: 'Понедельник' },
  { value: '2', label: 'Вторник' },
  { value: '3', label: 'Среда' },
  { value: '4', label: 'Четверг' },
  { value: '5', label: 'Пятница' },
  { value: '6', label: 'Суббота' },
  { value: '7', label: 'Воскресенье' }
]

export const weekTypeOptions: AdminCrudSelectOption[] = [
  { value: 'all', label: 'Каждую неделю' },
  { value: 'odd', label: 'Нечётная неделя' },
  { value: 'even', label: 'Чётная неделя' }
]

export interface ScheduleItemColumnMaps {
  semesterNameById: Map<number, string>
  weekNameById: Map<number, string>
  lessonPeriodNameById: Map<number, string>
  groupNameById: Map<number, string>
  disciplineNameById: Map<number, string>
  teacherNameById: Map<number, string>
  audienceNameById: Map<number, string>
  lessonTypeNameById: Map<number, string>
  dayOfWeekNameById: Map<number, string>
  weekTypeNameByValue: Map<string, string>
}

export function createScheduleItemFields(options: {
  semesterOptions: AdminCrudSelectOption[]
  weekOptions: AdminCrudSelectOption[]
  lessonPeriodOptions: AdminCrudSelectOption[]
  groupOptions: AdminCrudSelectOption[]
  disciplineOptions: AdminCrudSelectOption[]
  teacherOptions: AdminCrudSelectOption[]
  audienceOptions: AdminCrudSelectOption[]
  lessonTypeOptions: AdminCrudSelectOption[]
}): AdminCrudFieldConfig[] {
  return [
    {
      key: 'discipline_id',
      label: 'Дисциплина',
      placeholder: 'Выбери дисциплину группы',
      type: 'select',
      valueType: 'number',
      options: options.disciplineOptions,
      required: true,
      autoFillTargets: [
        {
          targetKey: 'teacher_id',
          metaKey: 'teacher_id'
        },
        {
          targetKey: 'semester_id',
          metaKey: 'semester_id'
        }
      ]
    },
    {
      key: 'semester_id',
      label: 'Семестр',
      placeholder: 'Семестр заполнится из дисциплины',
      type: 'select',
      valueType: 'number',
      options: options.semesterOptions,
      disabled: true,
      required: true
    },
    {
      key: 'week_id',
      label: 'Неделя',
      placeholder: 'Выбери неделю',
      type: 'select',
      valueType: 'number',
      options: options.weekOptions,
      dependsOn: 'semester_id',
      dependencyPlaceholder: 'Сначала выбери дисциплину',
      required: true
    },
    {
      key: 'teacher_id',
      label: 'Преподаватель',
      placeholder: 'Преподаватель заполнится из дисциплины',
      type: 'select',
      valueType: 'number',
      options: options.teacherOptions,
      disabled: true,
      required: true
    },
    {
      key: 'day_of_week',
      label: 'День недели',
      placeholder: 'Выбери день недели',
      type: 'select',
      valueType: 'number',
      options: dayOfWeekOptions,
      required: true
    },
    {
      key: 'lesson_period_id',
      label: 'Пара',
      placeholder: 'Выбери пару',
      type: 'select',
      valueType: 'number',
      options: options.lessonPeriodOptions,
      required: true
    },
    {
      key: 'audience_id',
      label: 'Аудитория',
      placeholder: 'Выбери аудиторию',
      type: 'select',
      valueType: 'number',
      options: options.audienceOptions
    },
    {
      key: 'lesson_type_id',
      label: 'Тип занятия',
      placeholder: 'Выбери тип занятия',
      type: 'select',
      valueType: 'number',
      options: options.lessonTypeOptions
    }
  ]
}

export function createScheduleItemColumns(maps: ScheduleItemColumnMaps): AdminCrudColumnConfig[] {
  return [
    {
      key: 'discipline_id',
      label: 'Дисциплина',
      render: (record) => renderRelation(record.discipline_id, maps.disciplineNameById)
    },
    {
      key: 'week_id',
      label: 'Неделя',
      render: (record) => renderRelation(record.week_id, maps.weekNameById)
    },
    {
      key: 'day_of_week',
      label: 'День',
      render: (record) => renderRelation(record.day_of_week, maps.dayOfWeekNameById)
    },
    {
      key: 'lesson_period_id',
      label: 'Пара',
      render: (record) => renderRelation(record.lesson_period_id, maps.lessonPeriodNameById)
    },
    {
      key: 'teacher_id',
      label: 'Преподаватель',
      render: (record) => renderRelation(record.teacher_id, maps.teacherNameById)
    },
    {
      key: 'audience_id',
      label: 'Аудитория',
      render: (record) => renderRelation(record.audience_id, maps.audienceNameById)
    },
    {
      key: 'lesson_type_id',
      label: 'Тип',
      render: (record) => renderRelation(record.lesson_type_id, maps.lessonTypeNameById)
    }
  ]
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
      label: `${disciplineName} / ${groupName}`,
      meta: {
        group_id:
          item.group_id === null || item.group_id === undefined ? null : String(item.group_id),
        teacher_id:
          item.teacher_id === null || item.teacher_id === undefined
            ? null
            : String(item.teacher_id),
        semester_id:
          item.semester_id === null || item.semester_id === undefined
            ? null
            : String(item.semester_id)
      }
    }
  })
}

export function createWeekOptions(items: AdminCrudRecord[]): AdminCrudSelectOption[] {
  return items.map((item) => {
    const dateRange = formatDateRangeForDisplay(item.starts_at, item.ends_at, {
      fallback: ''
    })
    const dates = dateRange ? `: ${dateRange}` : ''

    return {
      value: String(item.id),
      label: `${String(item.number ?? '')} неделя${dates}`,
      meta: {
        semester_id:
          item.semester_id === null || item.semester_id === undefined
            ? null
            : String(item.semester_id)
      }
    }
  })
}

export function createLessonPeriodOptions(items: AdminCrudRecord[]): AdminCrudSelectOption[] {
  return items.map((item) => ({
    value: String(item.id),
    label:
      `${String(item.number ?? '')} пара: ${String(item.starts_at ?? '')}–${String(item.ends_at ?? '')}`.trim()
  }))
}

export function createWeekTypeMap(): Map<string, string> {
  return new Map(weekTypeOptions.map((option) => [option.value, option.label]))
}

export function createStringOptionsMap(options: AdminCrudSelectOption[]): Map<string, string> {
  return new Map(options.map((option) => [option.value, option.label]))
}

export function getPersonName(record: AdminCrudRecord): string {
  const name = [record.last_name, record.first_name, record.middle_name]
    .filter(Boolean)
    .map(String)
    .join(' ')
    .trim()

  return name || getRecordName(record)
}

export function getSemesterName(record: AdminCrudRecord): string {
  if (record.name) {
    return String(record.name)
  }

  if (record.number) {
    return `${String(record.number)} семестр`
  }

  return getRecordName(record)
}

export function createNestedScheduleItemFields(
  options: Parameters<typeof createScheduleItemFields>[0]
): AdminCrudFieldConfig[] {
  return createScheduleItemFields(options).filter(
    (field) =>
      field.key !== 'semester_id' &&
      field.key !== 'group_id' &&
      field.key !== 'discipline_id' &&
      field.key !== 'teacher_id'
  )
}

export function createNestedScheduleItemColumns(
  maps: ScheduleItemColumnMaps
): AdminCrudColumnConfig[] {
  return createScheduleItemColumns(maps).filter(
    (column) =>
      column.key !== 'semester_id' &&
      column.key !== 'group_id' &&
      column.key !== 'discipline_id' &&
      column.key !== 'teacher_id'
  )
}

export const facultySelectorColumns: AdminCrudColumnConfig[] = [
  {
    key: 'id',
    label: 'ID'
  },
  {
    key: 'name',
    label: 'Факультет'
  },
  {
    key: 'short_name',
    label: 'Краткое название'
  }
]

export const scheduleSpecialtyColumns: AdminCrudColumnConfig[] = [
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
    key: 'description',
    label: 'Описание'
  }
]

export const scheduleGroupColumns: AdminCrudColumnConfig[] = [
  {
    key: 'name',
    label: 'Группа'
  },
  {
    key: 'course',
    label: 'Курс'
  },
  {
    key: 'description',
    label: 'Описание'
  }
]

export function createGroupScheduleItemFields(
  options: Parameters<typeof createScheduleItemFields>[0]
): AdminCrudFieldConfig[] {
  return createScheduleItemFields(options).filter((field) => field.key !== 'group_id')
}

export function createGroupScheduleItemColumns(
  maps: ScheduleItemColumnMaps
): AdminCrudColumnConfig[] {
  return createScheduleItemColumns(maps).filter((column) => column.key !== 'group_id')
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

function getBreakAfterText(record: AdminCrudRecord): string {
  if (!record.starts_at || !record.ends_at) {
    return '—'
  }

  return 'Автоматически по следующей паре'
}
