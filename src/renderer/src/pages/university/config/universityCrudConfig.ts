import type { AdminCrudColumnConfig, AdminCrudFieldConfig } from '../../../features/admin-crud'

export const organizationFields: AdminCrudFieldConfig[] = [
  {
    key: 'name',
    label: 'Название',
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
    placeholder: 'Дополнительная информация'
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

export const departmentFields: AdminCrudFieldConfig[] = [
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
    placeholder: 'Дополнительная информация'
  }
]

export const departmentColumns: AdminCrudColumnConfig[] = [
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
    label: 'Краткое название'
  },
  {
    key: 'description',
    label: 'Описание'
  }
]

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
    key: 'description',
    label: 'Описание',
    placeholder: 'Дополнительная информация'
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
    key: 'description',
    label: 'Описание'
  }
]

export const groupFields: AdminCrudFieldConfig[] = [
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
    type: 'number'
  },
  {
    key: 'description',
    label: 'Описание',
    placeholder: 'Дополнительная информация'
  }
]

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
