import type {
  AdminCrudArchiveParams,
  AdminCrudCreateParams,
  AdminCrudDeleteParams,
  AdminCrudGetByIdParams,
  AdminCrudListParams,
  AdminCrudListResult,
  AdminCrudOperationResult,
  AdminCrudRecord,
  AdminCrudUpdateParams,
  AdminEntityKey
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
    if (entity === 'faculties') {
      return this.prepareFacultyData(data, before)
    }

    if (entity === 'departments') {
      return this.prepareDepartmentData(data, before)
    }

    if (entity === 'student_groups') {
      return this.prepareStudentGroupData(data, before)
    }

    if (entity === 'specialties') {
      return this.prepareSpecialtyData(data, before)
    }

    if (entity === 'curriculum_plans') {
      return this.prepareCurriculumPlanData(data, before)
    }
    if (entity === 'academic_years') {
      return this.prepareAcademicYearData(data, before)
    }

    if (entity === 'academic_vacations') {
      return this.prepareAcademicVacationData(data, before)
    }

    if (entity === 'dictionary_items') {
      return this.prepareDictionaryItemData(data, before)
    }

    if (entity === 'students') {
      this.validateUniquePeopleContacts(entity, data, before)

      return data
    }

    if (entity === 'teachers') {
      this.validateUniquePeopleContacts(entity, data, before)

      return data
    }

    if (entity === 'employees') {
      this.validateUniquePeopleContacts(entity, data, before)
      this.validateEmployeePosition(data, before)

      return data
    }

    if (entity === 'audiences') {
      return this.prepareAudienceData(data, before)
    }

    if (entity === 'lesson_periods') {
      return this.prepareLessonPeriodData(data, before)
    }

    if (entity === 'disciplines') {
      return this.prepareDisciplineData(data, before)
    }
    if (entity === 'schedule_items') {
      return this.prepareScheduleItemData(data, before)
    }

    if (entity === 'grade_element_types') {
      return this.prepareGradeElementTypeData(data, before)
    }

    if (entity === 'grade_items') {
      return this.prepareGradeItemData(data, before)
    }

    return data
  }

  private prepareFacultyData(data: AdminCrudRecord, before?: AdminCrudRecord): AdminCrudRecord {
    const nextData = { ...data }
    const facultyId = normalizeNullableNumber(before?.id)
    const deanTeacherId = normalizeNullableNumber(
      pickNextValue(nextData, before, 'dean_teacher_id')
    )
    const deputyDeanTeacherId = normalizeNullableNumber(
      pickNextValue(nextData, before, 'deputy_dean_teacher_id')
    )

    if (
      deanTeacherId !== null &&
      deputyDeanTeacherId !== null &&
      deanTeacherId === deputyDeanTeacherId
    ) {
      throw new Error('Декан и заместитель декана должны быть разными преподавателями')
    }

    if (deanTeacherId !== null) {
      const deanTeacher = this.ensureActiveRelatedRecord(
        'teachers',
        deanTeacherId,
        'Выбранный декан не найден или архивирован'
      )

      if (facultyId !== null) {
        this.ensureTeacherBelongsToFaculty(deanTeacher, facultyId, 'Декан')
      }
      this.ensureTeacherHasNoConflictingLeadershipRole(deanTeacherId, {
        entity: 'faculties',
        recordId: facultyId,
        field: 'dean_teacher_id',
        roleTitle: 'Декан'
      })
    }

    if (deputyDeanTeacherId !== null) {
      const deputyDeanTeacher = this.ensureActiveRelatedRecord(
        'teachers',
        deputyDeanTeacherId,
        'Выбранный заместитель декана не найден или архивирован'
      )

      if (facultyId !== null) {
        this.ensureTeacherBelongsToFaculty(deputyDeanTeacher, facultyId, 'Заместитель декана')
      }
      this.ensureTeacherHasNoConflictingLeadershipRole(deputyDeanTeacherId, {
        entity: 'faculties',
        recordId: facultyId,
        field: 'deputy_dean_teacher_id',
        roleTitle: 'Заместитель декана'
      })
    }

    return {
      ...nextData,
      dean_teacher_id: deanTeacherId,
      deputy_dean_teacher_id: deputyDeanTeacherId
    }
  }

  private prepareDepartmentData(data: AdminCrudRecord, before?: AdminCrudRecord): AdminCrudRecord {
    const nextData = { ...data }
    const departmentId = normalizeNullableNumber(before?.id)
    const headTeacherId = normalizeNullableNumber(
      pickNextValue(nextData, before, 'head_teacher_id')
    )
    const deputyHeadTeacherId = normalizeNullableNumber(
      pickNextValue(nextData, before, 'deputy_head_teacher_id')
    )

    if (
      headTeacherId !== null &&
      deputyHeadTeacherId !== null &&
      headTeacherId === deputyHeadTeacherId
    ) {
      throw new Error(
        'Заведующий кафедрой и заместитель заведующего должны быть разными преподавателями'
      )
    }

    if (headTeacherId !== null) {
      const headTeacher = this.ensureActiveRelatedRecord(
        'teachers',
        headTeacherId,
        'Выбранный заведующий кафедрой не найден или архивирован'
      )

      if (departmentId !== null) {
        this.ensureTeacherBelongsToDepartment(headTeacher, departmentId, 'Заведующий кафедрой')
      }
      this.ensureTeacherHasNoConflictingLeadershipRole(headTeacherId, {
        entity: 'departments',
        recordId: departmentId,
        field: 'head_teacher_id',
        roleTitle: 'Заведующий кафедрой'
      })
    }

    if (deputyHeadTeacherId !== null) {
      const deputyHeadTeacher = this.ensureActiveRelatedRecord(
        'teachers',
        deputyHeadTeacherId,
        'Выбранный заместитель заведующего кафедрой не найден или архивирован'
      )

      if (departmentId !== null) {
        this.ensureTeacherBelongsToDepartment(
          deputyHeadTeacher,
          departmentId,
          'Заместитель заведующего кафедрой'
        )
      }
      this.ensureTeacherHasNoConflictingLeadershipRole(deputyHeadTeacherId, {
        entity: 'departments',
        recordId: departmentId,
        field: 'deputy_head_teacher_id',
        roleTitle: 'Заместитель заведующего кафедрой'
      })
    }

    return {
      ...nextData,
      head_teacher_id: headTeacherId,
      deputy_head_teacher_id: deputyHeadTeacherId
    }
  }

  private prepareStudentGroupData(
    data: AdminCrudRecord,
    before?: AdminCrudRecord
  ): AdminCrudRecord {
    const nextData = { ...data }
    const curatorTeacherId = normalizeNullableNumber(
      pickNextValue(nextData, before, 'curator_teacher_id')
    )
    const specialtyId = normalizeNullableNumber(pickNextValue(nextData, before, 'specialty_id'))

    if (curatorTeacherId === null) {
      return {
        ...nextData,
        curator_teacher_id: null
      }
    }

    if (specialtyId === null) {
      throw new Error('Для назначения куратора группа должна быть связана со специальностью')
    }

    const specialty = this.ensureActiveRelatedRecord(
      'specialties',
      specialtyId,
      'Специальность группы не найдена или архивирована'
    )
    const specialtyDepartmentId = normalizeNullableNumber(specialty.department_id)

    if (specialtyDepartmentId === null) {
      throw new Error('У специальности группы не указана кафедра')
    }

    const curatorTeacher = this.ensureActiveRelatedRecord(
      'teachers',
      curatorTeacherId,
      'Выбранный куратор группы не найден или архивирован'
    )

    this.ensureTeacherBelongsToDepartment(curatorTeacher, specialtyDepartmentId, 'Куратор группы')

    return {
      ...nextData,
      curator_teacher_id: curatorTeacherId
    }
  }

  private ensureTeacherHasNoConflictingLeadershipRole(
    teacherId: number,
    currentAssignment: {
      entity: AdminEntityKey
      recordId: number | null
      field: string
      roleTitle: string
    }
  ): void {
    const conflict = this.getRequiredLeadershipAssignments().find((assignment) => {
      if (assignment.teacherId !== teacherId) {
        return false
      }

      return !this.isSameLeadershipAssignment(assignment, currentAssignment)
    })

    if (!conflict) {
      return
    }

    throw new Error(
      `${currentAssignment.roleTitle} уже назначен как ${conflict.roleTitle} в записи "${conflict.recordName}". Один преподаватель не может одновременно занимать руководящие обязательные должности деканата факультета и руководства кафедры. Кураторство при этом разрешено.`
    )
  }

  private getRequiredLeadershipAssignments(): Array<{
    entity: AdminEntityKey
    recordId: number
    field: string
    roleTitle: string
    recordName: string
    teacherId: number
  }> {
    const assignments: Array<{
      entity: AdminEntityKey
      recordId: number
      field: string
      roleTitle: string
      recordName: string
      teacherId: number
    }> = []

    this.listAllActiveRecords('faculties').forEach((faculty) => {
      const facultyId = normalizeNullableNumber(faculty.id)

      if (facultyId === null) {
        return
      }

      const recordName = String(faculty.name ?? faculty.short_name ?? `#${facultyId}`)
      const deanTeacherId = normalizeNullableNumber(faculty.dean_teacher_id)
      const deputyDeanTeacherId = normalizeNullableNumber(faculty.deputy_dean_teacher_id)

      if (deanTeacherId !== null) {
        assignments.push({
          entity: 'faculties',
          recordId: facultyId,
          field: 'dean_teacher_id',
          roleTitle: 'декан факультета',
          recordName,
          teacherId: deanTeacherId
        })
      }

      if (deputyDeanTeacherId !== null) {
        assignments.push({
          entity: 'faculties',
          recordId: facultyId,
          field: 'deputy_dean_teacher_id',
          roleTitle: 'заместитель декана факультета',
          recordName,
          teacherId: deputyDeanTeacherId
        })
      }
    })

    this.listAllActiveRecords('departments').forEach((department) => {
      const departmentId = normalizeNullableNumber(department.id)

      if (departmentId === null) {
        return
      }

      const recordName = String(department.name ?? department.short_name ?? `#${departmentId}`)
      const headTeacherId = normalizeNullableNumber(department.head_teacher_id)
      const deputyHeadTeacherId = normalizeNullableNumber(department.deputy_head_teacher_id)

      if (headTeacherId !== null) {
        assignments.push({
          entity: 'departments',
          recordId: departmentId,
          field: 'head_teacher_id',
          roleTitle: 'заведующий кафедрой',
          recordName,
          teacherId: headTeacherId
        })
      }

      if (deputyHeadTeacherId !== null) {
        assignments.push({
          entity: 'departments',
          recordId: departmentId,
          field: 'deputy_head_teacher_id',
          roleTitle: 'заместитель заведующего кафедрой',
          recordName,
          teacherId: deputyHeadTeacherId
        })
      }
    })

    return assignments
  }

  private listAllActiveRecords(entity: AdminEntityKey): AdminCrudRecord[] {
    const config = getAdminCrudEntityConfig(entity)
    const items: AdminCrudRecord[] = []
    let page = 1

    while (true) {
      const result = this.repository.list(config, {
        entity,
        page,
        pageSize: 100,
        orderBy: 'id',
        orderDirection: 'asc'
      })

      items.push(...result.items)

      if (page >= result.totalPages || result.items.length === 0) {
        break
      }

      page += 1
    }

    return items
  }

  private isSameLeadershipAssignment(
    assignment: {
      entity: AdminEntityKey
      recordId: number
      field: string
    },
    currentAssignment: {
      entity: AdminEntityKey
      recordId: number | null
      field: string
    }
  ): boolean {
    return (
      assignment.entity === currentAssignment.entity &&
      assignment.recordId === currentAssignment.recordId &&
      assignment.field === currentAssignment.field
    )
  }
  private validateUniquePeopleContacts(
    entity: AdminEntityKey,
    data: AdminCrudRecord,
    before?: AdminCrudRecord
  ): void {
    const currentRecordId = normalizeNullableNumber(before?.id)
    const nextEmail = normalizeEmailForUniqueness(pickNextValue(data, before, 'email'))
    const nextPhone = normalizePhoneForUniqueness(pickNextValue(data, before, 'phone'))

    if (!nextEmail && !nextPhone) {
      return
    }

    const peopleEntities: AdminEntityKey[] = ['students', 'teachers', 'employees']

    for (const peopleEntity of peopleEntities) {
      const records = this.listAllActiveRecords(peopleEntity)

      for (const record of records) {
        const recordId = normalizeNullableNumber(record.id)

        if (
          peopleEntity === entity &&
          currentRecordId !== null &&
          recordId !== null &&
          recordId === currentRecordId
        ) {
          continue
        }

        const recordEmail = normalizeEmailForUniqueness(record.email)
        const recordPhone = normalizePhoneForUniqueness(record.phone)
        const personLabel = this.getPersonContactLabel(peopleEntity, record)

        if (nextEmail && recordEmail && nextEmail === recordEmail) {
          throw new Error(
            `Email "${String(pickNextValue(data, before, 'email')).trim()}" уже используется в карточке ${personLabel}. Email должен быть уникальным для студентов, преподавателей и сотрудников.`
          )
        }

        if (nextPhone && recordPhone && nextPhone === recordPhone) {
          throw new Error(
            `Телефон "${String(pickNextValue(data, before, 'phone')).trim()}" уже используется в карточке ${personLabel}. Телефон должен быть уникальным для студентов, преподавателей и сотрудников.`
          )
        }
      }
    }
  }

  private getPersonContactLabel(entity: AdminEntityKey, record: AdminCrudRecord): string {
    const personName = [record.last_name, record.first_name, record.middle_name]
      .filter(Boolean)
      .map(String)
      .join(' ')
    const entityLabel = getPeopleEntityLabel(entity)
    const recordId = record.id === null || record.id === undefined ? '' : ` #${String(record.id)}`

    return `${entityLabel}${recordId}${personName ? ` (${personName})` : ''}`
  }
  private ensureActiveRelatedRecord(
    entity: AdminEntityKey,
    id: number,
    errorMessage: string
  ): AdminCrudRecord {
    const config = getAdminCrudEntityConfig(entity)
    const record = this.repository.getById(config, id)

    if (!record || Number(record.is_archived) === 1) {
      throw new Error(errorMessage)
    }

    return record
  }

  private ensureTeacherBelongsToDepartment(
    teacher: AdminCrudRecord,
    departmentId: number,
    roleTitle: string
  ): void {
    const teacherDepartmentId = normalizeNullableNumber(teacher.department_id)

    if (teacherDepartmentId !== departmentId) {
      throw new Error(`${roleTitle} должен относиться к выбранной кафедре`)
    }
  }
  private ensureTeacherBelongsToFaculty(
    teacher: AdminCrudRecord,
    facultyId: number,
    roleTitle: string
  ): void {
    const teacherDepartmentId = normalizeNullableNumber(teacher.department_id)

    if (teacherDepartmentId === null) {
      throw new Error(`${roleTitle} должен быть привязан к кафедре факультета`)
    }

    const departmentConfig = getAdminCrudEntityConfig('departments')
    const department = this.repository.getById(departmentConfig, teacherDepartmentId)

    if (!department || Number(department.is_archived) === 1) {
      throw new Error(`${roleTitle} привязан к несуществующей или архивированной кафедре`)
    }

    const departmentFacultyId = normalizeNullableNumber(department.faculty_id)

    if (departmentFacultyId !== facultyId) {
      throw new Error(`${roleTitle} должен относиться к кафедре выбранного факультета`)
    }
  }
  private prepareDictionaryItemData(
    data: AdminCrudRecord,
    before?: AdminCrudRecord
  ): AdminCrudRecord {
    const nextData = { ...data }
    const dictionaryKey = String(nextData.dictionary_key ?? before?.dictionary_key ?? '').trim()
    const name = String(nextData.name ?? before?.name ?? '').trim()
    const itemKey = String(nextData.item_key ?? before?.item_key ?? '').trim()

    if (!dictionaryKey) {
      throw new Error('Не указан ключ справочника')
    }

    if (!name) {
      throw new Error('Укажи название элемента справочника')
    }

    return {
      ...nextData,
      dictionary_key: dictionaryKey,
      name,
      item_key: itemKey || createDictionaryItemKey(name),
      sort_order: normalizeNullableNumber(nextData.sort_order ?? before?.sort_order) ?? 100
    }
  }

  private afterDataSaved(entity: string, savedRecord: AdminCrudRecord): AdminCrudRecord {
    if (entity === 'academic_years') {
      return this.syncAcademicYearStructure(Number(savedRecord.id))
    }

    if (entity === 'academic_vacations') {
      const academicYearId = normalizeNullableNumber(savedRecord.academic_year_id)

      if (academicYearId !== null) {
        this.syncAcademicYearStructure(academicYearId)
      }

      return savedRecord
    }

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

  private prepareDisciplineData(data: AdminCrudRecord, before?: AdminCrudRecord): AdminCrudRecord {
    const nextData = { ...data }

    const curriculumItemId = normalizeNullableNumber(
      pickNextValue(nextData, before, 'curriculum_item_id')
    )
    const teacherId = normalizeNullableNumber(pickNextValue(nextData, before, 'teacher_id'))

    if (curriculumItemId === null) {
      throw new Error('Выбери пункт учебного плана')
    }

    if (teacherId === null) {
      throw new Error('Выбери преподавателя')
    }

    const curriculumItem = this.ensureActiveRelatedRecord(
      'curriculum_items',
      curriculumItemId,
      'Выбранный пункт учебного плана не найден или архивирован'
    )

    const subjectId = normalizeNullableNumber(curriculumItem.subject_id)
    const semesterId = normalizeNullableNumber(curriculumItem.semester_id)

    if (subjectId === null) {
      throw new Error('У выбранного пункта учебного плана не указан предмет')
    }

    if (semesterId === null) {
      throw new Error('У выбранного пункта учебного плана не указан семестр')
    }

    const subject = this.ensureActiveRelatedRecord(
      'subjects',
      subjectId,
      'Предмет выбранного пункта учебного плана не найден или архивирован'
    )
    const teacher = this.ensureActiveRelatedRecord(
      'teachers',
      teacherId,
      'Выбранный преподаватель не найден или архивирован'
    )

    const subjectDepartmentId = normalizeNullableNumber(subject.department_id)
    const teacherDepartmentId = normalizeNullableNumber(teacher.department_id)

    if (subjectDepartmentId === null) {
      throw new Error('У выбранного предмета не указана кафедра')
    }

    if (teacherDepartmentId !== subjectDepartmentId) {
      throw new Error('Преподаватель должен относиться к кафедре выбранного предмета')
    }

    if (!teacherTeachesSubject(teacher.teaching_subjects, subject.name)) {
      throw new Error(
        `Преподаватель ${formatPersonName(teacher)} не преподаёт предмет "${String(
          subject.name ?? ''
        )}". Выбери преподавателя, у которого этот предмет указан в поле «Преподаёт».`
      )
    }

    const subjectName = String(subject.name ?? '').trim()

    return {
      ...nextData,
      curriculum_item_id: curriculumItemId,
      subject_id: subjectId,
      semester_id: semesterId,
      teacher_id: teacherId,
      name: String(nextData.name ?? before?.name ?? subjectName).trim() || subjectName
    }
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

  private prepareGradeElementTypeData(
    data: AdminCrudRecord,
    before?: AdminCrudRecord
  ): AdminCrudRecord {
    const nextData = { ...data }

    const gradingMode = String(nextData.grading_mode ?? before?.grading_mode ?? 'score')
    const minScore = normalizeNullableNumber(nextData.min_score ?? before?.min_score)
    const maxScore = normalizeNullableNumber(nextData.max_score ?? before?.max_score)
    const passingScore = normalizeNullableNumber(nextData.passing_score ?? before?.passing_score)
    const isIntermediate = normalizeBooleanNumber(
      nextData.is_intermediate ?? before?.is_intermediate
    )
    const isFinal = normalizeBooleanNumber(nextData.is_final ?? before?.is_final)

    if (!['score', 'pass_fail'].includes(gradingMode)) {
      throw new Error('Некорректный тип оценивания')
    }

    if (!isIntermediate && !isFinal) {
      throw new Error('Укажи тип элемента: промежуточный или итоговый')
    }

    if (isIntermediate && isFinal) {
      throw new Error('Оценочный элемент не может быть одновременно промежуточным и итоговым')
    }

    if (gradingMode === 'score') {
      if (minScore === null || maxScore === null) {
        throw new Error('Для балльного элемента укажи минимальный и максимальный балл')
      }

      if (maxScore < minScore) {
        throw new Error('Максимальный балл не может быть меньше минимального')
      }

      if (passingScore !== null && (passingScore < minScore || passingScore > maxScore)) {
        throw new Error(
          'Проходной балл должен быть внутри диапазона минимального и максимального балла'
        )
      }

      return {
        ...nextData,
        grading_mode: gradingMode,
        min_score: minScore,
        max_score: maxScore,
        passing_score: passingScore,
        is_intermediate: isIntermediate,
        is_final: isFinal
      }
    }

    return {
      ...nextData,
      grading_mode: gradingMode,
      min_score: null,
      max_score: null,
      passing_score: null,
      is_intermediate: isIntermediate,
      is_final: isFinal
    }
  }

  private prepareGradeItemData(data: AdminCrudRecord, before?: AdminCrudRecord): AdminCrudRecord {
    const nextData = { ...data }

    const weekId = normalizeNullableNumber(nextData.week_id ?? before?.week_id)
    const dayOfWeek = normalizeNullableNumber(nextData.day_of_week ?? before?.day_of_week)

    if (weekId === null && dayOfWeek === null) {
      return nextData
    }

    if (weekId === null || dayOfWeek === null) {
      throw new Error('Для оценочной колонки укажи неделю и день недели')
    }

    if (dayOfWeek < 1 || dayOfWeek > 7) {
      throw new Error('День недели должен быть от 1 до 7')
    }

    const weekConfig = getAdminCrudEntityConfig('weeks')
    const week = this.repository.getById(weekConfig, weekId)

    if (!week) {
      throw new Error('Выбранная неделя не найдена')
    }

    if (!week.starts_at) {
      throw new Error('У выбранной недели не указана дата начала')
    }

    return {
      ...nextData,
      week_id: weekId,
      day_of_week: dayOfWeek,
      grade_date: formatIsoDate(addDays(parseIsoDate(String(week.starts_at)), dayOfWeek - 1))
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

  private prepareAcademicYearData(
    data: AdminCrudRecord,
    before?: AdminCrudRecord
  ): AdminCrudRecord {
    const startsAt = normalizeIsoDate(pickNextValue(data, before, 'starts_at'))

    if (!startsAt) {
      throw new Error('Укажи дату начала учебного года')
    }

    const startDate = parseIsoDate(startsAt)
    const endDate = addDays(addYears(startDate, 1), -1)
    const endsAt = formatIsoDate(endDate)
    const name = `${startDate.getUTCFullYear()}-${endDate.getUTCFullYear()}`
    const status = String(pickNextValue(data, before, 'status') ?? 'active').trim() || 'active'

    return {
      ...data,
      name,
      starts_at: startsAt,
      ends_at: endsAt,
      status
    }
  }

  private prepareAcademicVacationData(
    data: AdminCrudRecord,
    before?: AdminCrudRecord
  ): AdminCrudRecord {
    const nextData = { ...data }
    const academicYearId = normalizeNullableNumber(
      pickNextValue(nextData, before, 'academic_year_id')
    )
    const vacationType = normalizeVacationType(pickNextValue(nextData, before, 'vacation_type'))
    const startsAt = normalizeIsoDate(pickNextValue(nextData, before, 'starts_at'))
    const endsAt = normalizeIsoDate(pickNextValue(nextData, before, 'ends_at'))

    if (academicYearId === null) {
      throw new Error('Выбери учебный год для каникул')
    }

    if (!vacationType) {
      throw new Error('Выбери тип каникул')
    }

    if (!startsAt || !endsAt) {
      throw new Error('Укажи дату начала и дату окончания каникул')
    }

    const academicYear = this.ensureActiveRelatedRecord(
      'academic_years',
      academicYearId,
      'Учебный год для каникул не найден или архивирован'
    )
    const academicYearStartsAt = normalizeIsoDate(academicYear.starts_at)
    const academicYearEndsAt = normalizeIsoDate(academicYear.ends_at)

    if (!academicYearStartsAt || !academicYearEndsAt) {
      throw new Error('У выбранного учебного года не указаны даты начала и окончания')
    }

    if (parseIsoDate(endsAt).getTime() < parseIsoDate(startsAt).getTime()) {
      throw new Error('Дата окончания каникул должна быть позже даты начала')
    }

    if (
      parseIsoDate(startsAt).getTime() < parseIsoDate(academicYearStartsAt).getTime() ||
      parseIsoDate(endsAt).getTime() > parseIsoDate(academicYearEndsAt).getTime()
    ) {
      throw new Error('Каникулы должны находиться внутри выбранного учебного года')
    }

    const currentId = normalizeNullableNumber(before?.id)
    const duplicateVacation = this.listAllActiveRecords('academic_vacations').find((vacation) => {
      const vacationId = normalizeNullableNumber(vacation.id)

      return (
        normalizeNullableNumber(vacation.academic_year_id) === academicYearId &&
        String(vacation.vacation_type) === vacationType &&
        vacationId !== currentId
      )
    })

    if (duplicateVacation) {
      throw new Error(
        `Для выбранного учебного года уже есть каникулы типа «${getVacationTypeLabel(vacationType)}»`
      )
    }

    return {
      ...nextData,
      academic_year_id: academicYearId,
      vacation_type: vacationType,
      name: getVacationTypeLabel(vacationType),
      starts_at: startsAt,
      ends_at: endsAt
    }
  }

  private syncAcademicYearStructure(academicYearId: number): AdminCrudRecord {
    const academicYearConfig = getAdminCrudEntityConfig('academic_years')
    const academicYear = this.repository.getById(academicYearConfig, academicYearId)

    if (!academicYear) {
      throw new Error('Учебный год не найден')
    }

    const semesterRanges = this.resolveAcademicYearSemesterRanges(academicYear)
    const firstSemester = this.upsertSemester(academicYearId, 1, semesterRanges.first)
    const secondSemester = this.upsertSemester(academicYearId, 2, semesterRanges.second)

    this.syncWeeksForSemester(Number(firstSemester.id), semesterRanges.first)
    this.syncWeeksForSemester(Number(secondSemester.id), semesterRanges.second)

    return this.repository.getById(academicYearConfig, academicYearId) ?? academicYear
  }

  private resolveAcademicYearSemesterRanges(academicYear: AdminCrudRecord): {
    first: { startsAt: string; endsAt: string }
    second: { startsAt: string; endsAt: string }
  } {
    const startsAt = normalizeIsoDate(academicYear.starts_at)
    const endsAt = normalizeIsoDate(academicYear.ends_at)
    const academicYearId = normalizeNullableNumber(academicYear.id)

    if (!startsAt || !endsAt || academicYearId === null) {
      throw new Error('У учебного года не указаны корректные даты')
    }

    const yearStartDate = parseIsoDate(startsAt)
    const yearEndDate = parseIsoDate(endsAt)
    const yearDayCount = Math.max(1, differenceInDays(yearStartDate, yearEndDate) + 1)
    const fallbackFirstSemesterEndDate = addDays(
      yearStartDate,
      Math.max(0, Math.floor(yearDayCount / 2) - 1)
    )

    const vacations = this.listAllActiveRecords('academic_vacations').filter((vacation) => {
      return normalizeNullableNumber(vacation.academic_year_id) === academicYearId
    })

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

  private upsertSemester(
    academicYearId: number,
    semesterNumber: number,
    range: { startsAt: string; endsAt: string }
  ): AdminCrudRecord {
    const semesterConfig = getAdminCrudEntityConfig('semesters')
    const existingSemester = this.listAllActiveRecords('semesters').find((semester) => {
      return (
        normalizeNullableNumber(semester.academic_year_id) === academicYearId &&
        normalizeNullableNumber(semester.number) === semesterNumber
      )
    })
    const payload = {
      academic_year_id: academicYearId,
      number: semesterNumber,
      name: `${semesterNumber} семестр`,
      starts_at: range.startsAt,
      ends_at: range.endsAt,
      status: 'active'
    }

    if (existingSemester?.id) {
      return this.repository.update(semesterConfig, Number(existingSemester.id), payload)
    }

    return this.repository.create(semesterConfig, payload)
  }

  private syncWeeksForSemester(
    semesterId: number,
    range: { startsAt: string; endsAt: string }
  ): void {
    const weekConfig = getAdminCrudEntityConfig('weeks')
    const existingWeeks = this.listAllActiveRecords('weeks').filter((week) => {
      return normalizeNullableNumber(week.semester_id) === semesterId
    })
    const weekPayloads = buildWeekPayloadsForRange(semesterId, range.startsAt, range.endsAt)

    weekPayloads.forEach((weekPayload) => {
      const existingWeek = existingWeeks.find((week) => {
        return normalizeNullableNumber(week.number) === weekPayload.number
      })

      if (existingWeek?.id) {
        this.repository.update(weekConfig, Number(existingWeek.id), weekPayload)
        return
      }

      this.repository.create(weekConfig, weekPayload)
    })
  }
  private prepareSpecialtyData(data: AdminCrudRecord, before?: AdminCrudRecord): AdminCrudRecord {
    const nextData = { ...data }
    const duration = normalizeNullableNumber(
      nextData.study_duration_years ?? before?.study_duration_years
    )

    if (duration === null || duration < 1 || duration > 10) {
      throw new Error('Длительность обучения должна быть числом от 1 до 10 лет')
    }

    return {
      ...nextData,
      study_duration_years: Math.floor(duration)
    }
  }

  private prepareCurriculumPlanData(
    data: AdminCrudRecord,
    before?: AdminCrudRecord
  ): AdminCrudRecord {
    const nextData = { ...data }

    const specialtyId = normalizeNullableNumber(nextData.specialty_id ?? before?.specialty_id)
    const course = normalizeNullableNumber(nextData.course ?? before?.course)

    if (specialtyId === null) {
      throw new Error('Для учебного плана выбери специальность')
    }

    if (course === null || course < 1) {
      throw new Error('Курс учебного плана должен быть положительным числом')
    }

    const specialtyConfig = getAdminCrudEntityConfig('specialties')
    const specialty = this.repository.getById(specialtyConfig, specialtyId)

    if (!specialty) {
      throw new Error('Выбранная специальность не найдена')
    }

    const studyDurationYears = normalizeNullableNumber(specialty.study_duration_years) ?? 4
    const normalizedCourse = Math.floor(course)

    if (normalizedCourse > studyDurationYears) {
      throw new Error(
        `Для этой специальности можно создать учебный план только с 1 по ${studyDurationYears} курс`
      )
    }

    return {
      ...nextData,
      specialty_id: specialtyId,
      course: normalizedCourse
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

function buildWeekPayloadsForRange(
  semesterId: number,
  startsAt: string,
  endsAt: string
): AdminCrudRecord[] {
  const payloads: AdminCrudRecord[] = []
  let weekNumber = 1
  let currentDate = parseIsoDate(startsAt)
  const endDate = parseIsoDate(endsAt)

  while (currentDate.getTime() <= endDate.getTime()) {
    const weekEndDate = addDays(currentDate, 6)

    payloads.push({
      semester_id: semesterId,
      number: weekNumber,
      starts_at: formatIsoDate(currentDate),
      ends_at: formatIsoDate(clampDate(weekEndDate, currentDate, endDate)),
      week_type: weekNumber % 2 === 1 ? 'odd' : 'even',
      status: 'active'
    })

    currentDate = addDays(weekEndDate, 1)
    weekNumber += 1
  }

  return payloads
}
function pickNextValue(
  data: AdminCrudRecord,
  before: AdminCrudRecord | undefined,
  key: string
): unknown {
  return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : before?.[key]
}
function normalizeEmailForUniqueness(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function normalizePhoneForUniqueness(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '')
}

function getPeopleEntityLabel(entity: AdminEntityKey): string {
  if (entity === 'students') {
    return 'студента'
  }

  if (entity === 'teachers') {
    return 'преподавателя'
  }

  if (entity === 'employees') {
    return 'сотрудника'
  }

  return 'человека'
}
function teacherTeachesSubject(teachingSubjects: unknown, subjectName: unknown): boolean {
  const normalizedSubjectName = normalizeSubjectNameForMatch(subjectName)

  if (!normalizedSubjectName) {
    return false
  }

  return String(teachingSubjects ?? '')
    .split(/[\n,;]+/)
    .map((item) => normalizeSubjectNameForMatch(item))
    .filter(Boolean)
    .includes(normalizedSubjectName)
}

function normalizeSubjectNameForMatch(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function formatPersonName(record: AdminCrudRecord): string {
  const fullName = [record.last_name, record.first_name, record.middle_name]
    .filter(Boolean)
    .map(String)
    .join(' ')

  return fullName || `#${String(record.id ?? '')}`
}

function createDictionaryItemKey(value: string): string {
  const transliterated = transliterateCyrillic(value)
  const key = transliterated
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return key || `item_${Date.now()}`
}

function transliterateCyrillic(value: string): string {
  const map: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'c',
    ч: 'ch',
    ш: 'sh',
    щ: 'sch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya'
  }

  return value
    .split('')
    .map((char) => {
      const lowerChar = char.toLowerCase()
      const replacement = map[lowerChar]

      if (replacement === undefined) {
        return char
      }

      return char === lowerChar ? replacement : replacement.toUpperCase()
    })
    .join('')
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

function normalizeBooleanNumber(value: unknown): number {
  return value === true || value === 'true' || value === '1' || value === 1 ? 1 : 0
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)

  return hours * 60 + minutes
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)

  return new Date(Date.UTC(year, month - 1, day))
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function formatDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
