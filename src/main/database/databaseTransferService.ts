import { app, dialog } from 'electron'
import type Database from 'better-sqlite3'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { seedDatabase } from '../seed/seedDatabase'
import type { DatabaseMaintenanceResult } from '../../shared/types/system'

interface DatabaseJsonTable {
  name: string
  rows: Record<string, unknown>[]
}

interface DatabaseJsonExport {
  app: 'university-manager'
  version: 1 | 2
  exportedAt: string
  tables: DatabaseJsonTable[]
}

interface TableInfoRow {
  name: string
}

const excludedTables = new Set(['schema_migrations'])

const exportFormatVersion = 2

const resetTableOrder = [
  'user_sessions',
  'audit_logs',
  'role_permissions',

  'lesson_completion_records',
  'attendance_records',
  'grades',
  'grade_items',
  'score_scales',
  'grade_element_types',

  'lesson_sessions',
  'schedule_items',

  'disciplines',
  'curriculum_items',
  'curriculum_plans',
  'subjects',

  'students',
  'student_groups',

  'employees',
  'teachers',
  'positions',
  'divisions',

  'audiences',
  'audience_types',
  'buildings',

  'lesson_periods',
  'weeks',
  'semesters',
  'academic_vacations',
  'academic_years',

  'specialties',
  'department_faculties',
  'departments',
  'faculties',

  'app_users',
  'permissions',
  'roles',
  'dictionary_items',
  'app_settings'
]

export class DatabaseTransferService {
  constructor(private readonly database: Database.Database) {}

  async exportToJson(): Promise<DatabaseMaintenanceResult> {
    this.normalizeDerivedAcademicCalendar()
    const tableNames = this.getTransferTableNames()

    const tables = tableNames.map((tableName) => {
      const rows = this.database
        .prepare(`SELECT * FROM ${quoteIdentifier(tableName)}`)
        .all() as Record<string, unknown>[]

      return {
        name: tableName,
        rows
      }
    })

    const payload: DatabaseJsonExport = {
      app: 'university-manager',
      version: exportFormatVersion,
      exportedAt: new Date().toISOString(),
      tables
    }

    const rowsCount = tables.reduce((sum, table) => sum + table.rows.length, 0)

    const result = await dialog.showSaveDialog({
      title: 'Экспорт данных',
      defaultPath: join(app.getPath('documents'), createExportFileName()),
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })

    if (result.canceled || !result.filePath) {
      return {
        success: false,
        canceled: true,
        message: 'Экспорт отменён'
      }
    }

    writeFileSync(result.filePath, JSON.stringify(payload, null, 2), 'utf-8')

    return {
      success: true,
      filePath: result.filePath,
      tablesCount: tables.length,
      rowsCount,
      message: `Экспортировано таблиц: ${tables.length}, строк: ${rowsCount}`
    }
  }

  async importFromJson(): Promise<DatabaseMaintenanceResult> {
    const result = await dialog.showOpenDialog({
      title: 'Импорт данных',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })

    if (result.canceled || result.filePaths.length === 0) {
      return {
        success: false,
        canceled: true,
        message: 'Импорт отменён'
      }
    }

    const filePath = result.filePaths[0]
    const payload = this.parseImportFile(readFileSync(filePath, 'utf-8'))

    const tableNames = this.getTransferTableNames()
    const existingTables = new Set(tableNames)
    const importedTables = payload.tables.filter((table) => existingTables.has(table.name))

    if (importedTables.length === 0) {
      throw new Error('В файле импорта нет таблиц, подходящих для текущей базы')
    }

    const rowsCount = importedTables.reduce((sum, table) => sum + table.rows.length, 0)

    this.withForeignKeysDisabled(() => {
      const transaction = this.database.transaction(() => {
        this.clearTables(tableNames)

        importedTables.forEach((table) => {
          this.insertRows(table.name, table.rows)
        })

        seedDatabase(this.database)
        this.normalizeDerivedAcademicCalendar()

        const violations = this.database.prepare('PRAGMA foreign_key_check').all()

        if (violations.length > 0) {
          throw new Error('Импорт нарушает связи между таблицами')
        }
      })

      transaction()
    })

    return {
      success: true,
      filePath,
      tablesCount: importedTables.length,
      rowsCount,
      message: `Импортировано таблиц: ${importedTables.length}, строк: ${rowsCount}. Учебный календарь пересчитан.`
    }
  }

  resetDatabase(): DatabaseMaintenanceResult {
    const tableNames = this.getResetTableNames()

    this.withForeignKeysDisabled(() => {
      const transaction = this.database.transaction(() => {
        this.clearTables(tableNames)
      })

      transaction()
    })

    seedDatabase(this.database)

    return {
      success: true,
      tablesCount: tableNames.length,
      rowsCount: 0,
      message: 'База очищена. Системные роли, права, словари и admin/admin созданы заново.'
    }
  }

  private normalizeDerivedAcademicCalendar(): void {
    if (
      !this.tableExists('academic_years') ||
      !this.tableExists('semesters') ||
      !this.tableExists('weeks')
    ) {
      return
    }

    const academicYears = this.database
      .prepare(
        `
          SELECT *
          FROM academic_years
          WHERE COALESCE(is_archived, 0) = 0
          ORDER BY id
        `
      )
      .all() as Record<string, unknown>[]

    academicYears.forEach((academicYear) => {
      this.syncAcademicYearStructure(academicYear)
    })
  }

  private syncAcademicYearStructure(academicYear: Record<string, unknown>): void {
    const academicYearId = normalizeNullableNumber(academicYear.id)
    const startsAt = normalizeIsoDate(academicYear.starts_at)

    if (academicYearId === null || !startsAt) {
      return
    }

    const startDate = parseIsoDate(startsAt)
    const endDate = addDays(addYears(startDate, 1), -1)
    const endsAt = formatIsoDate(endDate)
    const name = `${startDate.getUTCFullYear()}-${endDate.getUTCFullYear()}`

    this.database
      .prepare(
        `
          UPDATE academic_years
          SET name = ?,
              starts_at = ?,
              ends_at = ?,
              status = COALESCE(NULLIF(TRIM(status), ''), 'active'),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `
      )
      .run(name, startsAt, endsAt, academicYearId)

    const normalizedAcademicYear = {
      ...academicYear,
      id: academicYearId,
      name,
      starts_at: startsAt,
      ends_at: endsAt
    }
    const vacations = this.normalizeAcademicVacations(academicYearId, startsAt, endsAt)
    const semesterRanges = resolveAcademicYearSemesterRanges(normalizedAcademicYear, vacations)
    const firstSemester = this.upsertSemester(academicYearId, 1, semesterRanges.first)
    const secondSemester = this.upsertSemester(academicYearId, 2, semesterRanges.second)

    this.syncWeeksForSemester(Number(firstSemester.id), semesterRanges.first)
    this.syncWeeksForSemester(Number(secondSemester.id), semesterRanges.second)
  }

  private normalizeAcademicVacations(
    academicYearId: number,
    academicYearStartsAt: string,
    academicYearEndsAt: string
  ): Record<string, unknown>[] {
    if (!this.tableExists('academic_vacations')) {
      return []
    }

    const vacations = this.database
      .prepare(
        `
          SELECT *
          FROM academic_vacations
          WHERE academic_year_id = ?
            AND COALESCE(is_archived, 0) = 0
          ORDER BY starts_at, id
        `
      )
      .all(academicYearId) as Record<string, unknown>[]

    vacations.forEach((vacation) => {
      const vacationId = normalizeNullableNumber(vacation.id)
      const vacationType = normalizeVacationType(vacation.vacation_type)
      const startsAt = normalizeIsoDate(vacation.starts_at)

      if (vacationId === null || !vacationType || !startsAt) {
        return
      }

      const rawEndsAt = normalizeIsoDate(vacation.ends_at)
      const endsAt = vacationType === 'after_course' ? academicYearEndsAt : rawEndsAt

      if (!endsAt) {
        return
      }

      const normalizedStartsAt = clampIsoDate(startsAt, academicYearStartsAt, academicYearEndsAt)
      const normalizedEndsAt = clampIsoDate(endsAt, normalizedStartsAt, academicYearEndsAt)

      this.database
        .prepare(
          `
            UPDATE academic_vacations
            SET vacation_type = ?,
                name = ?,
                starts_at = ?,
                ends_at = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `
        )
        .run(
          vacationType,
          getVacationTypeLabel(vacationType),
          normalizedStartsAt,
          normalizedEndsAt,
          vacationId
        )
    })

    return this.database
      .prepare(
        `
          SELECT *
          FROM academic_vacations
          WHERE academic_year_id = ?
            AND COALESCE(is_archived, 0) = 0
          ORDER BY starts_at, id
        `
      )
      .all(academicYearId) as Record<string, unknown>[]
  }

  private upsertSemester(
    academicYearId: number,
    semesterNumber: number,
    range: { startsAt: string; endsAt: string }
  ): Record<string, unknown> {
    const existingSemester = this.database
      .prepare(
        `
          SELECT *
          FROM semesters
          WHERE academic_year_id = ?
            AND number = ?
            AND COALESCE(is_archived, 0) = 0
          LIMIT 1
        `
      )
      .get(academicYearId, semesterNumber) as Record<string, unknown> | undefined

    const payload = {
      academic_year_id: academicYearId,
      number: semesterNumber,
      name: `${semesterNumber} семестр`,
      starts_at: range.startsAt,
      ends_at: range.endsAt,
      status: 'active'
    }

    if (existingSemester?.id) {
      this.database
        .prepare(
          `
            UPDATE semesters
            SET academic_year_id = ?,
                number = ?,
                name = ?,
                starts_at = ?,
                ends_at = ?,
                status = ?,
                is_archived = 0,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `
        )
        .run(
          payload.academic_year_id,
          payload.number,
          payload.name,
          payload.starts_at,
          payload.ends_at,
          payload.status,
          existingSemester.id
        )

      return {
        ...existingSemester,
        ...payload
      }
    }

    const insertResult = this.database
      .prepare(
        `
          INSERT INTO semesters (academic_year_id, number, name, starts_at, ends_at, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        payload.academic_year_id,
        payload.number,
        payload.name,
        payload.starts_at,
        payload.ends_at,
        payload.status
      )

    return {
      id: Number(insertResult.lastInsertRowid),
      ...payload
    }
  }

  private syncWeeksForSemester(
    semesterId: number,
    range: { startsAt: string; endsAt: string }
  ): void {
    const existingWeeks = this.database
      .prepare(
        `
          SELECT *
          FROM weeks
          WHERE semester_id = ?
            AND COALESCE(is_archived, 0) = 0
          ORDER BY number
        `
      )
      .all(semesterId) as Record<string, unknown>[]
    const weekPayloads = buildWeekPayloadsForRange(semesterId, range.startsAt, range.endsAt)
    const activeWeekNumbers = new Set<number>()

    weekPayloads.forEach((weekPayload) => {
      activeWeekNumbers.add(weekPayload.number)

      const existingWeek = existingWeeks.find((week) => {
        return normalizeNullableNumber(week.number) === weekPayload.number
      })

      if (existingWeek?.id) {
        this.database
          .prepare(
            `
              UPDATE weeks
              SET semester_id = ?,
                  number = ?,
                  starts_at = ?,
                  ends_at = ?,
                  week_type = ?,
                  status = ?,
                  is_archived = 0,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `
          )
          .run(
            weekPayload.semester_id,
            weekPayload.number,
            weekPayload.starts_at,
            weekPayload.ends_at,
            weekPayload.week_type,
            weekPayload.status,
            existingWeek.id
          )
        return
      }

      this.database
        .prepare(
          `
            INSERT INTO weeks (semester_id, number, starts_at, ends_at, week_type, status)
            VALUES (?, ?, ?, ?, ?, ?)
          `
        )
        .run(
          weekPayload.semester_id,
          weekPayload.number,
          weekPayload.starts_at,
          weekPayload.ends_at,
          weekPayload.week_type,
          weekPayload.status
        )
    })

    existingWeeks.forEach((week) => {
      const weekId = normalizeNullableNumber(week.id)
      const weekNumber = normalizeNullableNumber(week.number)

      if (weekId === null || (weekNumber !== null && activeWeekNumbers.has(weekNumber))) {
        return
      }

      this.database
        .prepare(
          `
            UPDATE weeks
            SET is_archived = 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `
        )
        .run(weekId)
    })
  }
  private getTransferTableNames(): string[] {
    const rows = this.database
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'table'
            AND name NOT LIKE 'sqlite_%'
          ORDER BY name
        `
      )
      .all() as Array<{ name: string }>

    return rows.map((row) => row.name).filter((tableName) => !excludedTables.has(tableName))
  }

  private getResetTableNames(): string[] {
    const existingTableNames = new Set(this.getTransferTableNames())
    const orderedTables = resetTableOrder.filter((tableName) => existingTableNames.has(tableName))
    const orderedTableSet = new Set(orderedTables)
    const remainingTables = [...existingTableNames].filter(
      (tableName) => !orderedTableSet.has(tableName)
    )

    return [...remainingTables, ...orderedTables]
  }

  private clearTables(tableNames: string[]): void {
    tableNames.forEach((tableName) => {
      this.database.prepare(`DELETE FROM ${quoteIdentifier(tableName)}`).run()
    })

    if (this.tableExists('sqlite_sequence')) {
      tableNames.forEach((tableName) => {
        this.database.prepare('DELETE FROM sqlite_sequence WHERE name = ?').run(tableName)
      })
    }
  }

  private insertRows(tableName: string, rows: Record<string, unknown>[]): void {
    if (rows.length === 0) {
      return
    }

    const columns = this.getTableColumns(tableName)

    rows.forEach((row) => {
      const rowColumns = Object.keys(row).filter((column) => columns.has(column))

      if (rowColumns.length === 0) {
        return
      }

      const statement = this.database.prepare(`
        INSERT INTO ${quoteIdentifier(tableName)} (${rowColumns.map(quoteIdentifier).join(', ')})
        VALUES (${rowColumns.map(() => '?').join(', ')})
      `)

      statement.run(...rowColumns.map((column) => row[column] ?? null))
    })
  }

  private getTableColumns(tableName: string): Set<string> {
    const rows = this.database
      .prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`)
      .all() as TableInfoRow[]

    return new Set(rows.map((row) => row.name))
  }

  private tableExists(tableName: string): boolean {
    const row = this.database
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE name = ?
          LIMIT 1
        `
      )
      .get(tableName)

    return Boolean(row)
  }

  private parseImportFile(content: string): DatabaseJsonExport {
    const parsed = JSON.parse(content) as Partial<DatabaseJsonExport>

    if (
      parsed.app !== 'university-manager' ||
      (parsed.version !== 1 && parsed.version !== 2) ||
      !Array.isArray(parsed.tables)
    ) {
      throw new Error('Файл не похож на экспорт University Manager')
    }

    return parsed as DatabaseJsonExport
  }

  private withForeignKeysDisabled<T>(operation: () => T): T {
    const previousValue = Number(this.database.pragma('foreign_keys', { simple: true }))

    this.database.pragma('foreign_keys = OFF')

    try {
      return operation()
    } finally {
      this.database.pragma(previousValue === 1 ? 'foreign_keys = ON' : 'foreign_keys = OFF')
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

function normalizeIsoDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const stringValue = String(value)

  return /^\d{4}-\d{2}-\d{2}$/.test(stringValue) ? stringValue : null
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)

  return new Date(Date.UTC(year, month - 1, day))
}

function formatIsoDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function addYears(date: Date, years: number): Date {
  const nextDate = new Date(date.getTime())

  nextDate.setUTCFullYear(nextDate.getUTCFullYear() + years)

  return nextDate
}

function differenceInDays(startDate: Date, endDate: Date): number {
  return Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
}

function clampDate(date: Date, minDate: Date, maxDate: Date): Date {
  if (date.getTime() < minDate.getTime()) {
    return minDate
  }

  if (date.getTime() > maxDate.getTime()) {
    return maxDate
  }

  return date
}

function clampIsoDate(value: string, minValue: string, maxValue: string): string {
  return formatIsoDate(
    clampDate(parseIsoDate(value), parseIsoDate(minValue), parseIsoDate(maxValue))
  )
}

function normalizeVacationType(value: unknown): string | null {
  const type = String(value ?? '').trim()

  if (type === 'intermediate' || type === 'after_course') {
    return type
  }

  return null
}

function getVacationTypeLabel(type: string): string {
  if (type === 'intermediate') {
    return 'Промежуточные каникулы'
  }

  if (type === 'after_course') {
    return 'Послекурсовые каникулы'
  }

  return 'Каникулы'
}

function resolveAcademicYearSemesterRanges(
  academicYear: Record<string, unknown>,
  vacations: Record<string, unknown>[]
): {
  first: { startsAt: string; endsAt: string }
  second: { startsAt: string; endsAt: string }
} {
  const startsAt = normalizeIsoDate(academicYear.starts_at)
  const endsAt = normalizeIsoDate(academicYear.ends_at)

  if (!startsAt || !endsAt) {
    return {
      first: { startsAt: '1970-01-01', endsAt: '1970-01-01' },
      second: { startsAt: '1970-01-01', endsAt: '1970-01-01' }
    }
  }

  const yearStartDate = parseIsoDate(startsAt)
  const yearEndDate = parseIsoDate(endsAt)
  const yearDayCount = Math.max(1, differenceInDays(yearStartDate, yearEndDate) + 1)
  const fallbackFirstSemesterEndDate = addDays(
    yearStartDate,
    Math.max(0, Math.floor(yearDayCount / 2) - 1)
  )

  const intermediateVacation = vacations.find(
    (vacation) => String(vacation.vacation_type) === 'intermediate'
  )
  const afterCourseVacation = vacations.find(
    (vacation) => String(vacation.vacation_type) === 'after_course'
  )

  const intermediateStartsAt = normalizeIsoDate(intermediateVacation?.starts_at)
  const intermediateEndsAt = normalizeIsoDate(intermediateVacation?.ends_at)
  const afterCourseStartsAt = normalizeIsoDate(afterCourseVacation?.starts_at)

  const firstSemesterEndDate = intermediateStartsAt
    ? addDays(parseIsoDate(intermediateStartsAt), -1)
    : fallbackFirstSemesterEndDate
  const secondSemesterStartDate =
    intermediateEndsAt !== null
      ? addDays(parseIsoDate(intermediateEndsAt), 1)
      : addDays(firstSemesterEndDate, 1)
  const secondSemesterEndDate = afterCourseStartsAt
    ? addDays(parseIsoDate(afterCourseStartsAt), -1)
    : yearEndDate

  const normalizedFirstEndDate = clampDate(firstSemesterEndDate, yearStartDate, yearEndDate)
  const normalizedSecondStartDate = clampDate(secondSemesterStartDate, yearStartDate, yearEndDate)
  const normalizedSecondEndDate = clampDate(
    secondSemesterEndDate,
    normalizedSecondStartDate,
    yearEndDate
  )

  return {
    first: {
      startsAt,
      endsAt: formatIsoDate(normalizedFirstEndDate)
    },
    second: {
      startsAt: formatIsoDate(normalizedSecondStartDate),
      endsAt: formatIsoDate(normalizedSecondEndDate)
    }
  }
}

function buildWeekPayloadsForRange(
  semesterId: number,
  startsAt: string,
  endsAt: string
): Array<{
  semester_id: number
  number: number
  starts_at: string
  ends_at: string
  week_type: string
  status: string
}> {
  const payloads: Array<{
    semester_id: number
    number: number
    starts_at: string
    ends_at: string
    week_type: string
    status: string
  }> = []
  const semesterStartDate = parseIsoDate(startsAt)
  const semesterEndDate = parseIsoDate(endsAt)
  let weekNumber = 1
  let currentWeekStartDate = semesterStartDate

  while (currentWeekStartDate.getTime() <= semesterEndDate.getTime()) {
    const calendarWeekEndDate = getCalendarWeekEndDate(currentWeekStartDate)
    const currentWeekEndDate = clampDate(calendarWeekEndDate, currentWeekStartDate, semesterEndDate)

    payloads.push({
      semester_id: semesterId,
      number: weekNumber,
      starts_at: formatIsoDate(currentWeekStartDate),
      ends_at: formatIsoDate(currentWeekEndDate),
      week_type: weekNumber % 2 === 1 ? 'odd' : 'even',
      status: 'active'
    })

    currentWeekStartDate = addDays(currentWeekEndDate, 1)
    weekNumber += 1
  }

  return payloads
}

function getCalendarWeekEndDate(date: Date): Date {
  return addDays(date, 7 - getIsoWeekday(date))
}

function getIsoWeekday(date: Date): number {
  const day = date.getUTCDay()

  return day === 0 ? 7 : day
}
function quoteIdentifier(value: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Некорректное имя SQL-идентификатора: ${value}`)
  }

  return `"${value}"`
}

function createExportFileName(): string {
  const date = new Date().toISOString().slice(0, 10)

  return `university-manager-export-${date}.json`
}
