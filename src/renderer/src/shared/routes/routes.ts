export const appRoutes = {
  dashboard: '/',
  login: '/login',

  university: '/university',
  people: '/people',
  academicCalendar: '/academic-calendar',
  academicProcess: '/academic-process',
  roomsAndLessons: '/rooms-and-lessons',
  schedule: '/schedule',
  learningJournal: '/learning-journal',
  reports: '/reports',
  administration: '/administration',
  auditLog: '/audit-log',
  settings: '/settings'
} as const

export type AppRouteKey = keyof typeof appRoutes
