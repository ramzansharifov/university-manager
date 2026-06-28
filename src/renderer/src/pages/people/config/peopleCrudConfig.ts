import type {
  AdminCrudColumnConfig,
  AdminCrudFieldConfig,
  AdminCrudRecord,
  AdminCrudSelectOption
} from '../../../features/admin-crud'

export interface PeopleFieldOptions {
  studentStatusOptions: AdminCrudSelectOption[]
  teacherStatusOptions: AdminCrudSelectOption[]
  employeeStatusOptions: AdminCrudSelectOption[]
  departmentOptions: AdminCrudSelectOption[]
  divisionOptions: AdminCrudSelectOption[]
  positionOptions: AdminCrudSelectOption[]
}

export interface PeopleColumnMaps {
  studentStatusNameById: Map<number, string>
  teacherStatusNameById: Map<number, string>
  employeeStatusNameById: Map<number, string>
  departmentNameById: Map<number, string>
  divisionNameById: Map<number, string>
  positionNameById: Map<number, string>
}

export const groupColumns: AdminCrudColumnConfig[] = [
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

export function createStudentFields(options: PeopleFieldOptions): AdminCrudFieldConfig[] {
  return [
    {
      key: 'status_id',
      label: 'Статус',
      placeholder: 'Выбери статус студента',
      type: 'select',
      valueType: 'number',
      options: options.studentStatusOptions
    },
    {
      key: 'last_name',
      label: 'Фамилия',
      placeholder: 'Например: Иванов',
      required: true
    },
    {
      key: 'first_name',
      label: 'Имя',
      placeholder: 'Например: Иван',
      required: true
    },
    {
      key: 'middle_name',
      label: 'Отчество',
      placeholder: 'Например: Иванович'
    },
    {
      key: 'birth_date',
      label: 'Дата рождения',
      placeholder: 'дд.мм.гггг',
      type: 'date'
    },
    {
      key: 'email',
      label: 'Email',
      placeholder: 'student@example.com',
      type: 'email'
    },
    {
      key: 'phone',
      label: 'Телефон',
      placeholder: 'Например: 999 123-45-67',
      type: 'phone'
    },
    {
      key: 'address',
      label: 'Адрес',
      placeholder: 'Адрес проживания',
      type: 'textarea'
    },
    {
      key: 'admission_date',
      label: 'Дата поступления',
      placeholder: 'дд.мм.гггг',
      type: 'date'
    },
    {
      key: 'student_card_number',
      label: 'Номер студенческого',
      placeholder: 'Например: ST-0001'
    },
    {
      key: 'social_status',
      label: 'Социальный статус',
      placeholder: 'Например: сирота, льготная категория, общежитие',
      type: 'textarea'
    },
    {
      key: 'public_activity',
      label: 'Общественная / соц. работа',
      placeholder: 'Участие в студсовете, волонтёрстве, мероприятиях',
      type: 'textarea'
    },
    {
      key: 'transfer_info',
      label: 'Информация о переводе',
      placeholder: 'Откуда / куда переведён, основание, приказ',
      type: 'textarea'
    },
    {
      key: 'status_changed_at',
      label: 'Дата изменения статуса',
      placeholder: 'дд.мм.гггг',
      type: 'date'
    },
    {
      key: 'note',
      label: 'Примечание',
      placeholder: 'Дополнительная информация',
      type: 'textarea'
    }
  ]
}

export function createStudentColumns(maps: PeopleColumnMaps): AdminCrudColumnConfig[] {
  return [
    {
      key: 'id',
      label: 'ID'
    },
    {
      key: 'status_id',
      label: 'Статус',
      render: (record) => renderRelation(record.status_id, maps.studentStatusNameById)
    },
    {
      key: 'last_name',
      label: 'Фамилия'
    },
    {
      key: 'first_name',
      label: 'Имя'
    },
    {
      key: 'middle_name',
      label: 'Отчество'
    },
    {
      key: 'birth_date',
      label: 'Дата рождения',
      type: 'date'
    },
    {
      key: 'email',
      label: 'Email'
    },
    {
      key: 'phone',
      label: 'Телефон'
    },
    {
      key: 'student_card_number',
      label: 'Студенческий'
    }
  ]
}

export function createTeacherFields(options: PeopleFieldOptions): AdminCrudFieldConfig[] {
  return [
    {
      key: 'department_id',
      label: 'Кафедра',
      placeholder: 'Выбери кафедру',
      type: 'select',
      valueType: 'number',
      options: options.departmentOptions
    },
    {
      key: 'position_id',
      label: 'Должность',
      placeholder: 'Выбери должность',
      type: 'select',
      valueType: 'number',
      options: options.positionOptions
    },
    {
      key: 'status_id',
      label: 'Статус',
      placeholder: 'Выбери статус преподавателя',
      type: 'select',
      valueType: 'number',
      options: options.teacherStatusOptions
    },
    {
      key: 'last_name',
      label: 'Фамилия',
      placeholder: 'Например: Петров',
      required: true
    },
    {
      key: 'first_name',
      label: 'Имя',
      placeholder: 'Например: Пётр',
      required: true
    },
    {
      key: 'middle_name',
      label: 'Отчество',
      placeholder: 'Например: Петрович'
    },
    {
      key: 'birth_date',
      label: 'Дата рождения',
      placeholder: 'дд.мм.гггг',
      type: 'date'
    },
    {
      key: 'email',
      label: 'Email',
      placeholder: 'teacher@example.com',
      type: 'email'
    },
    {
      key: 'phone',
      label: 'Телефон',
      placeholder: 'Например: 999 123-45-67',
      type: 'phone'
    },
    {
      key: 'address',
      label: 'Адрес',
      placeholder: 'Адрес проживания',
      type: 'textarea'
    },
    {
      key: 'hire_date',
      label: 'Дата приёма',
      placeholder: 'дд.мм.гггг',
      type: 'date'
    },
    {
      key: 'dismissal_date',
      label: 'Дата увольнения',
      placeholder: 'дд.мм.гггг',
      type: 'date'
    },
    {
      key: 'note',
      label: 'Примечание',
      placeholder: 'Дополнительная информация',
      type: 'textarea'
    }
  ]
}

export function createTeacherColumns(maps: PeopleColumnMaps): AdminCrudColumnConfig[] {
  return [
    {
      key: 'id',
      label: 'ID'
    },
    {
      key: 'status_id',
      label: 'Статус',
      render: (record) => renderRelation(record.status_id, maps.teacherStatusNameById)
    },
    {
      key: 'last_name',
      label: 'Фамилия'
    },
    {
      key: 'first_name',
      label: 'Имя'
    },
    {
      key: 'middle_name',
      label: 'Отчество'
    },
    {
      key: 'department_id',
      label: 'Кафедра',
      render: (record) => renderRelation(record.department_id, maps.departmentNameById)
    },
    {
      key: 'position_id',
      label: 'Должность',
      render: (record) => renderRelation(record.position_id, maps.positionNameById)
    },
    {
      key: 'phone',
      label: 'Телефон'
    }
  ]
}

export function createEmployeeFields(options: PeopleFieldOptions): AdminCrudFieldConfig[] {
  return [
    {
      key: 'division_id',
      label: 'Подразделение',
      placeholder: 'Выбери подразделение',
      type: 'select',
      valueType: 'number',
      options: options.divisionOptions
    },
    {
      key: 'position_id',
      label: 'Должность',
      placeholder: 'Выбери должность',
      type: 'select',
      valueType: 'number',
      options: options.positionOptions
    },
    {
      key: 'status_id',
      label: 'Статус',
      placeholder: 'Выбери статус сотрудника',
      type: 'select',
      valueType: 'number',
      options: options.employeeStatusOptions
    },
    {
      key: 'last_name',
      label: 'Фамилия',
      placeholder: 'Например: Сидоров',
      required: true
    },
    {
      key: 'first_name',
      label: 'Имя',
      placeholder: 'Например: Алексей',
      required: true
    },
    {
      key: 'middle_name',
      label: 'Отчество',
      placeholder: 'Например: Сергеевич'
    },
    {
      key: 'birth_date',
      label: 'Дата рождения',
      placeholder: 'дд.мм.гггг',
      type: 'date'
    },
    {
      key: 'email',
      label: 'Email',
      placeholder: 'employee@example.com',
      type: 'email'
    },
    {
      key: 'phone',
      label: 'Телефон',
      placeholder: 'Например: 999 123-45-67',
      type: 'phone'
    },
    {
      key: 'address',
      label: 'Адрес',
      placeholder: 'Адрес проживания',
      type: 'textarea'
    },
    {
      key: 'hire_date',
      label: 'Дата приёма',
      placeholder: 'дд.мм.гггг',
      type: 'date'
    },
    {
      key: 'dismissal_date',
      label: 'Дата увольнения',
      placeholder: 'дд.мм.гггг',
      type: 'date'
    },
    {
      key: 'note',
      label: 'Примечание',
      placeholder: 'Дополнительная информация',
      type: 'textarea'
    }
  ]
}

export function createEmployeeColumns(maps: PeopleColumnMaps): AdminCrudColumnConfig[] {
  return [
    {
      key: 'id',
      label: 'ID'
    },
    {
      key: 'status_id',
      label: 'Статус',
      render: (record) => renderRelation(record.status_id, maps.employeeStatusNameById)
    },
    {
      key: 'last_name',
      label: 'Фамилия'
    },
    {
      key: 'first_name',
      label: 'Имя'
    },
    {
      key: 'middle_name',
      label: 'Отчество'
    },
    {
      key: 'division_id',
      label: 'Подразделение',
      render: (record) => renderRelation(record.division_id, maps.divisionNameById)
    },
    {
      key: 'position_id',
      label: 'Должность',
      render: (record) => renderRelation(record.position_id, maps.positionNameById)
    },
    {
      key: 'phone',
      label: 'Телефон'
    }
  ]
}

export const positionFields: AdminCrudFieldConfig[] = [
  {
    key: 'name',
    label: 'Название должности',
    placeholder: 'Например: Доцент',
    required: true
  },
  {
    key: 'description',
    label: 'Описание',
    placeholder: 'Дополнительная информация',
    type: 'textarea'
  }
]

export const positionColumns: AdminCrudColumnConfig[] = [
  {
    key: 'id',
    label: 'ID'
  },
  {
    key: 'name',
    label: 'Должность'
  },
  {
    key: 'description',
    label: 'Описание'
  }
]

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

export function getRecordName(record: AdminCrudRecord): string {
  if (record.name) {
    return String(record.name)
  }

  return getPersonName(record) || `#${String(record.id)}`
}
