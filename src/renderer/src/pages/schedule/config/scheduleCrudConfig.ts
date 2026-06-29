import type {
  AdminCrudColumnConfig,
  AdminCrudFieldConfig,
  AdminCrudRecord,
  AdminCrudSelectOption
} from '../../../features/admin-crud'

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
    key: 'use_duration',
    label: 'Рассчитать конец',
    placeholder: 'Рассчитать конец пары по длительности',
    type: 'checkbox',
    virtual: true
  },
  {
    key: 'duration_minutes',
    label: 'Длительность пары',
    placeholder: 'Например: 90',
    type: 'number',
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
      durationKey: 'duration_minutes',
      enabledKey: 'use_duration'
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
