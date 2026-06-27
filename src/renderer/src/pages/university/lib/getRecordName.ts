import type { AdminCrudRecord } from '../../../features/admin-crud'

export function getRecordName(record: AdminCrudRecord): string {
  if (record.name) {
    return String(record.name)
  }

  if (record.short_name) {
    return String(record.short_name)
  }

  return `#${String(record.id)}`
}
