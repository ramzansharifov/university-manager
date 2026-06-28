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
      label: 'Форма контроля',
      placeholder: 'Например: экзамен, зачёт, курсовая'
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
      label: 'Контроль'
    }
  ]
}
