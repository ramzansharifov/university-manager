import type { AdminCrudColumnConfig, AdminCrudFieldConfig } from '../../../features/admin-crud'

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

export const studentFields: AdminCrudFieldConfig[] = [
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
    placeholder: 'Например: 2004-05-12'
  },
  {
    key: 'email',
    label: 'Email',
    placeholder: 'student@example.com'
  },
  {
    key: 'phone',
    label: 'Телефон',
    placeholder: '+7...'
  },
  {
    key: 'admission_date',
    label: 'Дата поступления',
    placeholder: 'Например: 2022-09-01'
  },
  {
    key: 'student_card_number',
    label: 'Номер студенческого',
    placeholder: 'Например: ST-0001'
  },
  {
    key: 'note',
    label: 'Примечание',
    placeholder: 'Дополнительная информация'
  }
]

export const studentColumns: AdminCrudColumnConfig[] = [
  {
    key: 'id',
    label: 'ID'
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

export const teacherFields: AdminCrudFieldConfig[] = [
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
    key: 'email',
    label: 'Email',
    placeholder: 'teacher@example.com'
  },
  {
    key: 'phone',
    label: 'Телефон',
    placeholder: '+7...'
  },
  {
    key: 'note',
    label: 'Примечание',
    placeholder: 'Дополнительная информация'
  }
]

export const teacherColumns: AdminCrudColumnConfig[] = [
  {
    key: 'id',
    label: 'ID'
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
    key: 'email',
    label: 'Email'
  },
  {
    key: 'phone',
    label: 'Телефон'
  }
]

export const employeeFields: AdminCrudFieldConfig[] = [
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
    key: 'email',
    label: 'Email',
    placeholder: 'employee@example.com'
  },
  {
    key: 'phone',
    label: 'Телефон',
    placeholder: '+7...'
  },
  {
    key: 'note',
    label: 'Примечание',
    placeholder: 'Дополнительная информация'
  }
]

export const employeeColumns: AdminCrudColumnConfig[] = [
  {
    key: 'id',
    label: 'ID'
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
    key: 'email',
    label: 'Email'
  },
  {
    key: 'phone',
    label: 'Телефон'
  }
]

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
    placeholder: 'Дополнительная информация'
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
