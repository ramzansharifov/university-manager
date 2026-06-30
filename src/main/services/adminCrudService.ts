import type {
  AdminCrudArchiveParams,
  AdminCrudCreateParams,
  AdminCrudDeleteParams,
  AdminCrudGetByIdParams,
  AdminCrudListParams,
  AdminCrudListResult,
  AdminCrudOperationResult,
  AdminCrudRecord,
  AdminCrudUpdateParams
} from '../../shared/types/adminCrud'
import type { AuditService } from '../audit/auditService'
import { getAdminCrudEntityConfig } from '../admin/adminCrudEntities'
import type { AdminCrudRepository } from '../repositories/adminCrudRepository'

export class AdminCrudService {
  constructor(
    private readonly repository: AdminCrudRepository,
    private readonly auditService: AuditService
  ) {}

  list(params: AdminCrudListParams): AdminCrudListResult {
    const config = getAdminCrudEntityConfig(params.entity)

    return this.repository.list(config, params)
  }

  getById(params: AdminCrudGetByIdParams): AdminCrudRecord | null {
    const config = getAdminCrudEntityConfig(params.entity)

    return this.repository.getById(config, params.id)
  }

  create(params: AdminCrudCreateParams): AdminCrudOperationResult {
    const config = getAdminCrudEntityConfig(params.entity)
    const preparedData = this.prepareDataForSave(params.entity, params.data)
    const created = this.repository.create(config, preparedData)
    const finalItem = this.afterDataSaved(params.entity, created)

    this.auditService.write({
      action: 'create',
      module: 'admin_crud',
      entityName: params.entity,
      entityId: Number(finalItem.id),
      before: null,
      after: finalItem
    })

    return {
      success: true,
      item: finalItem
    }
  }

  update(params: AdminCrudUpdateParams): AdminCrudOperationResult {
    const config = getAdminCrudEntityConfig(params.entity)
    const before = this.repository.getById(config, params.id)

    if (!before) {
      throw new Error('Record not found')
    }

    const preparedData = this.prepareDataForSave(params.entity, params.data, before)
    const updated = this.repository.update(config, params.id, preparedData)
    const finalItem = this.afterDataSaved(params.entity, updated)

    this.auditService.write({
      action: 'update',
      module: 'admin_crud',
      entityName: params.entity,
      entityId: params.id,
      before,
      after: finalItem
    })

    return {
      success: true,
      item: finalItem
    }
  }

  archive(params: AdminCrudArchiveParams): AdminCrudOperationResult {
    const config = getAdminCrudEntityConfig(params.entity)
    const before = this.repository.getById(config, params.id)

    if (!before) {
      throw new Error('Record not found')
    }

    const archived = this.repository.archive(config, params.id)
    const finalItem =
      params.entity === 'lesson_periods'
        ? this.renumberLessonPeriods(Number(archived.id))
        : archived

    this.auditService.write({
      action: 'archive',
      module: 'admin_crud',
      entityName: params.entity,
      entityId: params.id,
      before,
      after: finalItem
    })

    return {
      success: true,
      item: finalItem
    }
  }

  delete(params: AdminCrudDeleteParams): AdminCrudOperationResult {
    const config = getAdminCrudEntityConfig(params.entity)
    const before = this.repository.getById(config, params.id)

    if (!before) {
      throw new Error('Record not found')
    }

    this.repository.delete(config, params.id)

    this.auditService.write({
      action: 'delete',
      module: 'admin_crud',
      entityName: params.entity,
      entityId: params.id,
      before,
      after: null
    })

    return {
      success: true
    }
  }

  private prepareDataForSave(
    entity: string,
    data: AdminCrudRecord,
    before?: AdminCrudRecord
  ): AdminCrudRecord {
    if (entity === 'employees') {
      this.validateEmployeePosition(data, before)

      return data
    }

    if (entity === 'audiences') {
      return this.prepareAudienceData(data, before)
    }

    if (entity === 'lesson_periods') {
      return this.prepareLessonPeriodData(data, before)
    }

    if (entity === 'schedule_items') {
      return this.prepareScheduleItemData(data, before)
    }

    return data
  }

  private afterDataSaved(entity: string, savedRecord: AdminCrudRecord): AdminCrudRecord {
    if (entity === 'lesson_periods') {
      return this.renumberLessonPeriods(Number(savedRecord.id))
    }

    return savedRecord
  }

  private prepareLessonPeriodData(
    data: AdminCrudRecord,
    before?: AdminCrudRecord
  ): AdminCrudRecord {
    const startsAt = normalizeLessonPeriodTime(
      String(data.starts_at ?? before?.starts_at ?? ''),
      'начала'
    )
    const endsAt = normalizeLessonPeriodTime(
      String(data.ends_at ?? before?.ends_at ?? ''),
      'окончания'
    )

    if (timeToMinutes(endsAt) <= timeToMinutes(startsAt)) {
      throw new Error('Время окончания пары должно быть позже времени начала')
    }

    return {
      ...data,
      starts_at: startsAt,
      ends_at: endsAt,
      number: normalizeNullableNumber(before?.number) ?? this.getNextLessonPeriodNumber(),
      name: before?.name ? String(before.name) : 'Пара'
    }
  }

  private getNextLessonPeriodNumber(): number {
    const config = getAdminCrudEntityConfig('lesson_periods')
    const periods = this.repository.list(config, {
      entity: 'lesson_periods',
      page: 1,
      pageSize: 1000,
      includeArchived: true,
      orderBy: 'number',
      orderDirection: 'asc'
    })

    const numbers = periods.items
      .map((period) => Number(period.number))
      .filter((number) => Number.isFinite(number))

    return numbers.length > 0 ? Math.max(...numbers) + 1 : 1
  }

  private renumberLessonPeriods(savedRecordId: number): AdminCrudRecord {
    const config = getAdminCrudEntityConfig('lesson_periods')
    const periods = this.repository.list(config, {
      entity: 'lesson_periods',
      page: 1,
      pageSize: 1000,
      includeArchived: true,
      orderBy: 'id',
      orderDirection: 'asc'
    })

    const normalizedPeriods = periods.items.map((period) => {
      const periodId = normalizeNullableNumber(period.id)

      if (periodId === null) {
        throw new Error('У пары отсутствует идентификатор')
      }

      const startsAt = normalizeLessonPeriodTime(String(period.starts_at ?? ''), 'начала')
      const endsAt = normalizeLessonPeriodTime(String(period.ends_at ?? ''), 'окончания')
      const isArchived = Number(period.is_archived) === 1

      return {
        id: periodId,
        starts_at: startsAt,
        ends_at: endsAt,
        is_archived: isArchived,
        startMinutes: timeToMinutes(startsAt)
      }
    })

    normalizedPeriods.forEach((period) => {
      this.repository.update(config, period.id, {
        number: 100000 + period.id,
        name: `Временная пара ${period.id}`,
        starts_at: period.starts_at,
        ends_at: period.ends_at
      })
    })

    const activePeriods = normalizedPeriods
      .filter((period) => !period.is_archived)
      .sort((firstPeriod, secondPeriod) => {
        const timeDiff = firstPeriod.startMinutes - secondPeriod.startMinutes

        if (timeDiff !== 0) {
          return timeDiff
        }

        return firstPeriod.id - secondPeriod.id
      })

    activePeriods.forEach((period, index) => {
      const periodNumber = index + 1

      this.repository.update(config, period.id, {
        number: periodNumber,
        name: `${periodNumber} пара`,
        starts_at: period.starts_at,
        ends_at: period.ends_at
      })
    })

    return this.repository.getById(config, savedRecordId) ?? activePeriods[0]
  }
  private prepareAudienceData(data: AdminCrudRecord, before?: AdminCrudRecord): AdminCrudRecord {
    const nextData = { ...data }
    const nextName = String(nextData.name ?? before?.name ?? '').trim()

    nextData.floor = deriveAudienceFloor(nextName)

    return nextData
  }

  private prepareScheduleItemData(
    data: AdminCrudRecord,
    before?: AdminCrudRecord
  ): AdminCrudRecord {
    const nextData = { ...data }

    const disciplineId = normalizeNullableNumber(nextData.discipline_id ?? before?.discipline_id)
    const weekId = normalizeNullableNumber(nextData.week_id ?? before?.week_id)

    if (disciplineId === null) {
      throw new Error('Выбери дисциплину группы')
    }

    if (weekId === null) {
      throw new Error('Выбери неделю семестра')
    }

    const disciplineConfig = getAdminCrudEntityConfig('disciplines')
    const weekConfig = getAdminCrudEntityConfig('weeks')

    const discipline = this.repository.getById(disciplineConfig, disciplineId)
    const week = this.repository.getById(weekConfig, weekId)

    if (!discipline) {
      throw new Error('Выбранная дисциплина не найдена')
    }

    if (!week) {
      throw new Error('Выбранная неделя не найдена')
    }

    const disciplineSemesterId = normalizeNullableNumber(discipline.semester_id)
    const disciplineTeacherId = normalizeNullableNumber(discipline.teacher_id)
    const weekSemesterId = normalizeNullableNumber(week.semester_id)

    if (disciplineSemesterId === null) {
      throw new Error('У выбранной дисциплины не указан семестр')
    }

    if (disciplineTeacherId === null) {
      throw new Error('У выбранной дисциплины не указан преподаватель')
    }

    if (weekSemesterId === null) {
      throw new Error('У выбранной недели не указан семестр')
    }

    if (disciplineSemesterId !== weekSemesterId) {
      throw new Error('Выбранная неделя не относится к семестру выбранной дисциплины')
    }

    if (!week.starts_at || !week.ends_at) {
      throw new Error('У выбранной недели не указаны даты начала и окончания')
    }

    return {
      ...nextData,
      discipline_id: disciplineId,
      week_id: weekId,
      semester_id: disciplineSemesterId,
      teacher_id: disciplineTeacherId,
      starts_on: String(week.starts_at),
      ends_on: String(week.ends_at)
    }
  }

  private validateEmployeePosition(data: AdminCrudRecord, before?: AdminCrudRecord): void {
    const nextDivisionId = normalizeNullableNumber(data.division_id ?? before?.division_id)
    const nextPositionId = normalizeNullableNumber(data.position_id ?? before?.position_id)

    if (nextPositionId === null) {
      return
    }

    if (nextDivisionId === null) {
      throw new Error('Для выбора должности сначала укажи подразделение сотрудника')
    }

    const positionConfig = getAdminCrudEntityConfig('positions')
    const position = this.repository.getById(positionConfig, nextPositionId)

    if (!position) {
      throw new Error('Выбранная должность не найдена')
    }

    const positionDivisionId = normalizeNullableNumber(position.division_id)

    if (positionDivisionId === null) {
      throw new Error('У выбранной должности не указано подразделение')
    }

    if (positionDivisionId !== nextDivisionId) {
      throw new Error('Выбранная должность не относится к выбранному подразделению')
    }
  }
}

function normalizeNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

function deriveAudienceFloor(name: string): number | null {
  const firstDigit = name.trim().match(/^\d/)?.[0]

  if (!firstDigit) {
    return null
  }

  const floor = Number(firstDigit)

  return Number.isFinite(floor) ? floor : null
}

function normalizeLessonPeriodTime(value: string, label: string): string {
  const trimmedValue = value.trim()
  const match = trimmedValue.match(/^(\d{1,2}):(\d{2})$/)

  if (!match) {
    throw new Error(`Укажи время ${label} пары в формате ЧЧ:ММ`)
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 23 || minutes > 59) {
    throw new Error(`Некорректное время ${label} пары`)
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)

  return hours * 60 + minutes
}
