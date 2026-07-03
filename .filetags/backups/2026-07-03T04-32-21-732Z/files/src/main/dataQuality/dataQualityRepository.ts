import type Database from 'better-sqlite3'

export class DataQualityRepository {
  constructor(private readonly database: Database.Database) {}

  countFacultiesWithoutDepartments(): number {
    return this.count(`
      SELECT COUNT(*) as total
      FROM faculties
      WHERE is_archived = 0
        AND NOT EXISTS (
          SELECT 1
          FROM departments
          WHERE departments.faculty_id = faculties.id
            AND departments.is_archived = 0
        )
    `)
  }

  countDepartmentsWithoutSpecialties(): number {
    return this.count(`
      SELECT COUNT(*) as total
      FROM departments
      WHERE is_archived = 0
        AND NOT EXISTS (
          SELECT 1
          FROM specialties
          WHERE specialties.department_id = departments.id
            AND specialties.is_archived = 0
        )
    `)
  }

  countSpecialtiesWithoutGroups(): number {
    return this.count(`
      SELECT COUNT(*) as total
      FROM specialties
      WHERE is_archived = 0
        AND NOT EXISTS (
          SELECT 1
          FROM student_groups
          WHERE student_groups.specialty_id = specialties.id
            AND student_groups.is_archived = 0
        )
    `)
  }

  countGroupsWithoutStudents(): number {
    return this.count(`
      SELECT COUNT(*) as total
      FROM student_groups
      WHERE is_archived = 0
        AND NOT EXISTS (
          SELECT 1
          FROM students
          WHERE students.group_id = student_groups.id
            AND students.is_archived = 0
        )
    `)
  }

  countTeachersWithoutDisciplines(): number {
    return this.count(`
      SELECT COUNT(*) as total
      FROM teachers
      WHERE is_archived = 0
        AND NOT EXISTS (
          SELECT 1
          FROM disciplines
          WHERE disciplines.teacher_id = teachers.id
            AND disciplines.is_archived = 0
        )
    `)
  }

  countDisciplinesWithoutSchedule(): number {
    return this.count(`
      SELECT COUNT(*) as total
      FROM disciplines
      WHERE is_archived = 0
        AND NOT EXISTS (
          SELECT 1
          FROM schedule_items
          WHERE schedule_items.discipline_id = disciplines.id
            AND schedule_items.is_archived = 0
        )
    `)
  }

  countScheduleItemsWithoutSessions(): number {
    return this.count(`
      SELECT COUNT(*) as total
      FROM schedule_items
      WHERE is_archived = 0
        AND NOT EXISTS (
          SELECT 1
          FROM lesson_sessions
          WHERE lesson_sessions.schedule_item_id = schedule_items.id
            AND lesson_sessions.is_archived = 0
        )
    `)
  }

  countLessonSessionsWithoutAttendance(): number {
    return this.count(`
      SELECT COUNT(*) as total
      FROM lesson_sessions
      WHERE is_archived = 0
        AND NOT EXISTS (
          SELECT 1
          FROM attendance_records
          WHERE attendance_records.lesson_session_id = lesson_sessions.id
        )
    `)
  }

  countCurriculumPlansWithoutItems(): number {
    return this.count(`
      SELECT COUNT(*) as total
      FROM curriculum_plans
      WHERE is_archived = 0
        AND NOT EXISTS (
          SELECT 1
          FROM curriculum_items
          WHERE curriculum_items.curriculum_plan_id = curriculum_plans.id
            AND curriculum_items.is_archived = 0
        )
    `)
  }

  countCurriculumItemsWithoutDisciplines(): number {
    return this.count(`
      SELECT COUNT(*) as total
      FROM curriculum_items
      WHERE is_archived = 0
        AND NOT EXISTS (
          SELECT 1
          FROM disciplines
          WHERE disciplines.curriculum_item_id = curriculum_items.id
            AND disciplines.is_archived = 0
        )
    `)
  }

  countGradeItemsWithoutGrades(): number {
    return this.count(`
      SELECT COUNT(*) as total
      FROM grade_items
      WHERE is_archived = 0
        AND NOT EXISTS (
          SELECT 1
          FROM grades
          WHERE grades.grade_item_id = grade_items.id
        )
    `)
  }

  countCustomRolesWithoutPermissions(): number {
    return this.count(`
      SELECT COUNT(*) as total
      FROM roles
      WHERE is_system = 0
        AND is_archived = 0
        AND NOT EXISTS (
          SELECT 1
          FROM role_permissions
          WHERE role_permissions.role_id = roles.id
        )
    `)
  }

  countEmployeesWithoutUsers(): number {
    return this.count(`
      SELECT COUNT(*) as total
      FROM employees
      WHERE is_archived = 0
        AND NOT EXISTS (
          SELECT 1
          FROM app_users
          WHERE app_users.profile_type = 'employee'
            AND app_users.profile_id = employees.id
        )
    `)
  }

  private count(sql: string): number {
    const row = this.database.prepare(sql).get() as { total: number }
    return row.total
  }
}
