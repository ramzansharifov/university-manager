import type {
  AdminCrudColumnConfig,
  AdminCrudFieldConfig,
  AdminCrudRecord,
  AdminCrudSelectOption
} from '../../../features/admin-crud'

export const organizationFields: AdminCrudFieldConfig[] = [
  {
    key: 'name',
    label: 'Название',
    placeholder: 'Например: Управление кадров',
    required: true
  },
  {
    key: 'short_name',
    label: 'Краткое название',
    placeholder: 'Например: УК'
  },
  {
    key: 'description',
    label: 'Описание',
    placeholder: 'Дополнительная информация',
    type: 'textarea'
  }
]

export const organizationColumns: AdminCrudColumnConfig[] = [
  {
    key: 'id',
    label: 'ID'
  },
  {
    key: 'name',
    label: 'Название'
  },
  {
    key: 'short_name',
    label: 'Краткое название'
  },
  {
    key: 'description',
    label: 'Описание'
  }
]

export function createFacultyFields(): AdminCrudFieldConfig[] {
  return [
    {
      key: 'name',
      label: 'Название факультета',
      placeholder: 'Например: Факультет информационных технологий',
      required: true
    },
    {
      key: 'short_name',
      label: 'Краткое название',
      placeholder: 'Например: ФИТ'
    },
    {
      key: 'description',
      label: 'Описание',
      placeholder: 'Дополнительная информация',
      type: 'textarea'
    }
  ]
}

export function createFacultyColumns(
  teacherNameById: Map<number, string>
): AdminCrudColumnConfig[] {
  return [
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
      label: 'Краткое'
    },
    {
      key: 'dean_teacher_id',
      label: 'Декан',
      render: (record) => renderRelation(record.dean_teacher_id, teacherNameById)
    },
    {
      key: 'deputy_dean_teacher_id',
      label: 'Зам. декана',
      render: (record) => renderRelation(record.deputy_dean_teacher_id, teacherNameById)
    }
  ]
}

export function createDepartmentFields(): AdminCrudFieldConfig[] {
  return [
    {
      key: 'name',
      label: 'Название кафедры',
      placeholder: 'Например: Кафедра программной инженерии',
      required: true
    },
    {
      key: 'short_name',
      label: 'Краткое название',
      placeholder: 'Например: КПИ'
    },
    {
      key: 'description',
      label: 'Описание',
      placeholder: 'Дополнительная информация',
      type: 'textarea'
    }
  ]
}

export function createDepartmentColumns(
  teacherNameById: Map<number, string>
): AdminCrudColumnConfig[] {
  return [
    {
      key: 'id',
      label: 'ID'
    },
    {
      key: 'name',
      label: 'Кафедра'
    },
    {
      key: 'short_name',
      label: 'Краткое'
    },
    {
      key: 'head_teacher_id',
      label: 'Заведующий',
      render: (record) => renderRelation(record.head_teacher_id, teacherNameById)
    },
    {
      key: 'deputy_head_teacher_id',
      label: 'Заместитель',
      render: (record) => renderRelation(record.deputy_head_teacher_id, teacherNameById)
    }
  ]
}

export const specialtyFields: AdminCrudFieldConfig[] = [
  {
    key: 'code',
    label: 'Код специальности',
    placeholder: 'Например: 09.03.04'
  },
  {
    key: 'name',
    label: 'Название специальности',
    placeholder: 'Например: Программная инженерия',
    required: true
  },
  {
    key: 'degree',
    label: 'Степень / уровень',
    placeholder: 'Например: Бакалавриат'
  },
  {
    key: 'study_duration_years',
    label: 'Длительность обучения в годах',
    placeholder: 'Например: 4',
    type: 'number',
    required: true,
    defaultValue: '4'
  },
  {
    key: 'description',
    label: 'Описание',
    placeholder: 'Дополнительная информация',
    type: 'textarea'
  }
]

export const specialtyColumns: AdminCrudColumnConfig[] = [
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
    label: 'Срок'
  },
  {
    key: 'description',
    label: 'Описание'
  }
]

export function createGroupFields(
  academicYearOptions: AdminCrudSelectOption[]
): AdminCrudFieldConfig[] {
  return [
    {
      key: 'name',
      label: 'Название группы',
      placeholder: 'Например: ПИ-21-1',
      required: true
    },
    {
      key: 'course',
      label: 'Курс',
      placeholder: 'Например: 2',
      type: 'number',
      defaultValue: '1',
      required: true
    },
    {
      key: 'academic_year_id',
      label: 'Учебный год поступления',
      placeholder: 'Выбери год поступления группы',
      type: 'select',
      valueType: 'number',
      options: academicYearOptions,
      required: true
    },
    {
      key: 'description',
      label: 'Описание',
      placeholder: 'Дополнительная информация',
      type: 'textarea'
    }
  ]
}

export function createGroupColumns(
  teacherNameById: Map<number, string>,
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
      key: 'curator_teacher_id',
      label: 'Куратор',
      render: (record) => renderRelation(record.curator_teacher_id, teacherNameById)
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
) {
  return items.map((item) => ({
    value: String(item.id),
    label: labelFactory(item)
  }))
}

export function createOptionsMap(options: AdminCrudSelectOption[]): Map<number, string> {
  return new Map(options.map((option) => [Number(option.value), option.label]))
}

export function getPersonName(record: AdminCrudRecord): string {
  return [record.last_name, record.first_name, record.middle_name]
    .filter(Boolean)
    .map(String)
    .join(' ')
}

function renderRelation(value: unknown, labelsById: Map<number, string>): string {
  if (value === null || value === undefined || value === '') {
    return 'Не назначен'
  }

  const id = Number(value)

  if (!Number.isFinite(id)) {
    return String(value)
  }

  return labelsById.get(id) ?? `#${id}`
}
