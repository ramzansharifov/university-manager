import type {
  DataQualityCheckResult,
  DataQualityCheckStatus,
  DataQualityReport,
  DataQualitySeverity
} from '../../shared/types/system'
import type { DataQualityRepository } from './dataQualityRepository'

interface CheckDefinition {
  id: string
  module: string
  title: string
  description: string
  severity: DataQualitySeverity
  getCount: () => number
}

export class DataQualityService {
  constructor(private readonly dataQualityRepository: DataQualityRepository) {}

  getReport(): DataQualityReport {
    const checks = this.getCheckDefinitions().map((check) => {
      const count = check.getCount()

      return {
        id: check.id,
        module: check.module,
        title: check.title,
        description: check.description,
        severity: check.severity,
        status: getStatus(check.severity, count),
        count
      }
    })

    const issues = checks.filter((check) => check.status !== 'passed')
    const passedChecks = checks.filter((check) => check.status === 'passed').length
    const warningChecks = checks.filter((check) => check.status === 'warning').length
    const failedChecks = checks.filter((check) => check.status === 'failed').length
    const readinessPercent =
      checks.length === 0 ? 100 : Math.round((passedChecks / checks.length) * 100)

    return {
      generatedAt: new Date().toISOString(),
      readinessPercent,
      summary: {
        totalChecks: checks.length,
        passedChecks,
        warningChecks,
        failedChecks
      },
      checks,
      issues
    }
  }

  private getCheckDefinitions(): CheckDefinition[] {
    return [
      {
        id: 'faculties_without_departments',
        module: 'university',
        title: 'Факультеты без кафедр',
        description: 'У факультета должна быть хотя бы одна кафедра.',
        severity: 'warning',
        getCount: () => this.dataQualityRepository.countFacultiesWithoutDepartments()
      },
      {
        id: 'departments_without_specialties',
        module: 'university',
        title: 'Кафедры без специальностей',
        description: 'Кафедра должна быть связана хотя бы с одной специальностью.',
        severity: 'warning',
        getCount: () => this.dataQualityRepository.countDepartmentsWithoutSpecialties()
      },
      {
        id: 'specialties_without_groups',
        module: 'university',
        title: 'Специальности без групп',
        description: 'У специальности должна быть хотя бы одна учебная группа.',
        severity: 'warning',
        getCount: () => this.dataQualityRepository.countSpecialtiesWithoutGroups()
      },
      {
        id: 'groups_without_students',
        module: 'people',
        title: 'Группы без студентов',
        description: 'Учебная группа должна содержать студентов.',
        severity: 'warning',
        getCount: () => this.dataQualityRepository.countGroupsWithoutStudents()
      },
      {
        id: 'teachers_without_disciplines',
        module: 'academic_process',
        title: 'Преподаватели без дисциплин',
        description: 'Преподаватель должен быть связан хотя бы с одной дисциплиной.',
        severity: 'info',
        getCount: () => this.dataQualityRepository.countTeachersWithoutDisciplines()
      },
      {
        id: 'disciplines_without_schedule',
        module: 'schedule',
        title: 'Дисциплины без расписания',
        description: 'Дисциплина должна быть добавлена в расписание.',
        severity: 'warning',
        getCount: () => this.dataQualityRepository.countDisciplinesWithoutSchedule()
      },
      {
        id: 'schedule_items_without_sessions',
        module: 'learning_journal',
        title: 'Расписание без проведённых занятий',
        description: 'Записи расписания должны превращаться в фактические занятия.',
        severity: 'info',
        getCount: () => this.dataQualityRepository.countScheduleItemsWithoutSessions()
      },
      {
        id: 'lesson_sessions_without_attendance',
        module: 'learning_journal',
        title: 'Занятия без посещаемости',
        description: 'Для проведённых занятий желательно отмечать посещаемость.',
        severity: 'info',
        getCount: () => this.dataQualityRepository.countLessonSessionsWithoutAttendance()
      },
      {
        id: 'curriculum_plans_without_items',
        module: 'academic_process',
        title: 'Учебные планы без пунктов',
        description: 'Учебный план должен содержать пункты учебного плана.',
        severity: 'warning',
        getCount: () => this.dataQualityRepository.countCurriculumPlansWithoutItems()
      },
      {
        id: 'curriculum_items_without_disciplines',
        module: 'academic_process',
        title: 'Пункты учебного плана без дисциплин',
        description: 'Пункт учебного плана должен быть связан с конкретной дисциплиной.',
        severity: 'warning',
        getCount: () => this.dataQualityRepository.countCurriculumItemsWithoutDisciplines()
      },
      {
        id: 'grade_items_without_grades',
        module: 'learning_journal',
        title: 'Оценочные элементы без оценок',
        description: 'Если оценочный элемент создан, по нему должны появляться оценки.',
        severity: 'info',
        getCount: () => this.dataQualityRepository.countGradeItemsWithoutGrades()
      },
      {
        id: 'custom_roles_without_permissions',
        module: 'administration',
        title: 'Пользовательские роли без прав',
        description: 'Пользовательская роль должна иметь хотя бы одно право.',
        severity: 'warning',
        getCount: () => this.dataQualityRepository.countCustomRolesWithoutPermissions()
      },
      {
        id: 'employees_without_users',
        module: 'administration',
        title: 'Сотрудники без пользователей',
        description: 'Сотрудник может получить доступ к системе только через пользователя.',
        severity: 'info',
        getCount: () => this.dataQualityRepository.countEmployeesWithoutUsers()
      }
    ]
  }
}

function getStatus(severity: DataQualitySeverity, count: number): DataQualityCheckStatus {
  if (count === 0) {
    return 'passed'
  }

  return severity === 'error' ? 'failed' : 'warning'
}
