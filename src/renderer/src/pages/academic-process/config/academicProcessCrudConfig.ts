import type {
  AdminCrudColumnConfig,
  AdminCrudFieldConfig,
  AdminCrudRecord,
  AdminCrudSelectOption
} from '../../../features/admin-crud'

export interface AcademicProcessColumnMaps {
  departmentNameById: Map<number, string>
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
  }
]

export function createCurriculumPlanFields(options: {
  academicYearOptions: AdminCrudSelectOption[]
  educationFormOptions: AdminCrudSelectOption[]
}): AdminCrudFieldConfig[] {
  return [
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
      placeholder: 'Например: Учебный план 2025 / очная форма',
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
      label: 'Формы контроля',
      placeholder: 'Например: экзамен',
      type: 'multiText',
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
    key: 'name',
    label: 'Название учебного года',
    placeholder: 'Например: 2025-2026',
    required: true
  },
  {
    key: 'starts_at',
    label: 'Дата начала',
    placeholder: 'дд.мм.гггг',
    type: 'date'
  },
  {
    key: 'ends_at',
    label: 'Дата окончания',
    placeholder: 'дд.мм.гггг',
    type: 'date'
  },
  {
    key: 'status',
    label: 'Статус',
    placeholder: 'Например: active'
  }
]

export const academicYearColumns: AdminCrudColumnConfig[] = [
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
    label: 'Начало',
    type: 'date'
  },
  {
    key: 'ends_at',
    label: 'Окончание',
    type: 'date'
  },
  {
    key: 'status',
    label: 'Статус'
  }
]

export const groupSelectorColumns: AdminCrudColumnConfig[] = [
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
    key: 'description',
    label: 'Описание'
  }
]

export function createCurriculumItemOptions(
  items: AdminCrudRecord[],
  maps: {
    subjectNameById: Map<number, string>
    semesterNameById: Map<number, string>
  }
): AdminCrudSelectOption[] {
  return items.map((item) => {
    const subjectName = renderRelation(item.subject_id, maps.subjectNameById)
    const semesterName = renderRelation(item.semester_id, maps.semesterNameById)

    return {
      value: String(item.id),
      label: `${subjectName} / ${semesterName}`,
      meta: {
        subject_id:
          item.subject_id === null || item.subject_id === undefined
            ? null
            : String(item.subject_id),
        semester_id:
          item.semester_id === null || item.semester_id === undefined
            ? null
            : String(item.semester_id)
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
      options: options.curriculumItemOptions
    },
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
      key: 'teacher_id',
      label: 'Преподаватель',
      placeholder: 'Выбери преподавателя',
      type: 'select',
      valueType: 'number',
      options: options.teacherOptions,
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
      key: 'name',
      label: 'Название дисциплины',
      placeholder: 'Можно оставить пустым, если совпадает с предметом'
    }
  ]
}

export function createDisciplineColumns(maps: {
  curriculumItemNameById: Map<number, string>
  subjectNameById: Map<number, string>
  teacherNameById: Map<number, string>
  semesterNameById: Map<number, string>
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
