import type { AdminCrudRecord } from '../../../features/admin-crud'

export function getRecordName(record: AdminCrudRecord): string {
  if (record.name) {
    return String(record.name)
  }

  if (record.last_name || record.first_name || record.middle_name) {
    return [record.last_name, record.first_name, record.middle_name]
      .filter(Boolean)
      .map(String)
      .join(' ')
  }

  return `#${String(record.id)}`
}
