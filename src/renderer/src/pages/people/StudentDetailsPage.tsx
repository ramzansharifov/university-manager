import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiRefreshCcw } from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import type { AdminCrudRecord } from '../../features/admin-crud'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../shared/ui'

type StudentRelatedData = {
  group: AdminCrudRecord | null
  status: AdminCrudRecord | null
}

export function StudentDetailsPage() {
  const { studentId } = useParams()
  const navigate = useNavigate()

  const [student, setStudent] = useState<AdminCrudRecord | null>(null)
  const [relatedData, setRelatedData] = useState<StudentRelatedData>({
    group: null,
    status: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const numericStudentId = useMemo(() => Number(studentId), [studentId])

  const loadStudent = useCallback(async () => {
    if (!Number.isFinite(numericStudentId)) {
      setError('Некорректный идентификатор студента')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const studentRecord = await window.api.adminCrud.getById({
        entity: 'students',
        id: numericStudentId
      })

      if (!studentRecord) {
        setStudent(null)
        setRelatedData({
          group: null,
          status: null
        })
        setError('Студент не найден')
        return
      }

      const [groupRecord, statusRecord] = await Promise.all([
        studentRecord.group_id
          ? window.api.adminCrud.getById({
              entity: 'student_groups',
              id: Number(studentRecord.group_id)
            })
          : Promise.resolve(null),
        studentRecord.status_id
          ? window.api.adminCrud.getById({
              entity: 'dictionary_items',
              id: Number(studentRecord.status_id)
            })
          : Promise.resolve(null)
      ])

      setStudent(studentRecord)
      setRelatedData({
        group: groupRecord,
        status: statusRecord
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить студента')
    } finally {
      setIsLoading(false)
    }
  }, [numericStudentId])

  useEffect(() => {
    void loadStudent()
  }, [loadStudent])

  const studentName = student ? getPersonName(student) : 'Студент'

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate('/people')}>
            <FiArrowLeft />
            Назад к людям
          </Button>

          <h1 className="mt-4 text-2xl font-bold tracking-tight">{studentName}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Личная карточка студента, контактные данные, статус и учебная информация.
          </p>
        </div>

        <Button variant="secondary" onClick={() => void loadStudent()} disabled={isLoading}>
          <FiRefreshCcw />
          Обновить
        </Button>
      </div>

      {error ? (
        <Card className="border-[var(--color-danger)]/40">
          <CardContent>
            <p className="text-sm font-medium text-[var(--color-danger)]">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent>
            <p className="text-sm text-[var(--color-text-muted)]">Загрузка студента...</p>
          </CardContent>
        </Card>
      ) : null}

      {student ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>{studentName}</CardTitle>
                  <CardDescription>
                    {relatedData.group
                      ? `Группа: ${getRecordName(relatedData.group)}`
                      : 'Группа не указана'}
                  </CardDescription>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge>
                    {relatedData.status ? getRecordName(relatedData.status) : 'Статус не указан'}
                  </Badge>
                  {student.student_card_number ? (
                    <Badge variant="muted">№ {String(student.student_card_number)}</Badge>
                  ) : null}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <InfoItem label="Фамилия" value={student.last_name} />
                <InfoItem label="Имя" value={student.first_name} />
                <InfoItem label="Отчество" value={student.middle_name} />
                <InfoItem label="Дата рождения" value={formatDate(student.birth_date)} />
                <InfoItem label="Email" value={student.email} />
                <InfoItem label="Телефон" value={student.phone} />
                <InfoItem label="Дата поступления" value={formatDate(student.admission_date)} />
                <InfoItem
                  label="Дата изменения статуса"
                  value={formatDate(student.status_changed_at)}
                />
                <InfoItem label="Студенческий билет" value={student.student_card_number} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <DetailsCard title="Адрес" value={student.address} />
            <DetailsCard title="Социальный статус" value={student.social_status} />
            <DetailsCard title="Общественная / соц. работа" value={student.public_activity} />
            <DetailsCard title="Информация о переводе" value={student.transfer_info} />
          </div>

          <DetailsCard title="Примечание" value={student.note} />
        </>
      ) : null}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[var(--color-text)]">{formatValue(value)}</p>
    </div>
  )
}

function DetailsCard({ title, value }: { title: string; value: unknown }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
          {formatValue(value)}
        </p>
      </CardContent>
    </Card>
  )
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return String(value)
}

function formatDate(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  const [year, month, day] = String(value).split('-')

  if (!year || !month || !day) {
    return String(value)
  }

  return `${day}.${month}.${year}`
}

function getPersonName(record: AdminCrudRecord): string {
  return [record.last_name, record.first_name, record.middle_name]
    .filter(Boolean)
    .map(String)
    .join(' ')
}

function getRecordName(record: AdminCrudRecord): string {
  if (record.name) {
    return String(record.name)
  }

  return getPersonName(record) || `#${String(record.id)}`
}
