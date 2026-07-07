import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiPlus, FiRefreshCw, FiUserPlus } from 'react-icons/fi'
import type { AuthUserListItem, UserProfileType } from '../../../../../shared/types/auth'
import type { AdminCrudRecord } from '../../../../../shared/types/adminCrud'
import type { Role } from '../../../../../shared/types/roles'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch
} from '../../../shared/ui'

interface ProfileOption {
  id: number
  label: string
  description: string
}

const profileTypeLabels: Record<UserProfileType, string> = {
  system: 'Системный',
  student: 'Студент',
  teacher: 'Преподаватель',
  employee: 'Сотрудник'
}

const profileTypeDescriptions: Record<UserProfileType, string> = {
  system: 'Без привязки к человеку',
  student: 'Привязка к карточке студента',
  teacher: 'Привязка к карточке преподавателя',
  employee: 'Привязка к карточке сотрудника'
}

export function UsersAdministrationPanel() {
  const [users, setUsers] = useState<AuthUserListItem[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [profileOptions, setProfileOptions] = useState<
    Record<Exclude<UserProfileType, 'system'>, ProfileOption[]>
  >({
    student: [],
    teacher: [],
    employee: []
  })
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState('0')
  const [profileType, setProfileType] = useState<UserProfileType>('system')
  const [profileId, setProfileId] = useState('0')
  const [isActive, setIsActive] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const availableProfileOptions = useMemo(() => {
    if (profileType === 'system') {
      return []
    }

    return profileOptions[profileType]
  }, [profileOptions, profileType])

  const loadUsersData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [usersResult, rolesResult, studentsResult, teachersResult, employeesResult] =
        await Promise.all([
          window.api.auth.listUsers(),
          window.api.roles.list(),
          window.api.adminCrud.list({
            entity: 'students',
            page: 1,
            pageSize: 1000,
            orderBy: 'last_name',
            orderDirection: 'asc'
          }),
          window.api.adminCrud.list({
            entity: 'teachers',
            page: 1,
            pageSize: 1000,
            orderBy: 'last_name',
            orderDirection: 'asc'
          }),
          window.api.adminCrud.list({
            entity: 'employees',
            page: 1,
            pageSize: 1000,
            orderBy: 'last_name',
            orderDirection: 'asc'
          })
        ])

      setUsers(usersResult)
      setRoles(rolesResult)
      setProfileOptions({
        student: studentsResult.items.map(mapPersonRecordToProfileOption),
        teacher: teachersResult.items.map(mapPersonRecordToProfileOption),
        employee: employeesResult.items.map(mapPersonRecordToProfileOption)
      })
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsersData()
  }, [loadUsersData])

  function changeProfileType(nextProfileType: UserProfileType) {
    setProfileType(nextProfileType)
    setProfileId('0')
  }

  async function createUser() {
    const trimmedUsername = username.trim()

    if (!trimmedUsername) {
      setErrorMessage('Укажи логин пользователя')
      return
    }

    if (password.length < 4) {
      setErrorMessage('Пароль должен содержать не менее 4 символов')
      return
    }

    if (roleId === '0') {
      setErrorMessage('Выбери роль пользователя')
      return
    }

    if (profileType !== 'system' && profileId === '0') {
      setErrorMessage(`Выбери профиль: ${profileTypeLabels[profileType].toLowerCase()}`)
      return
    }

    setIsSaving(true)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      await window.api.auth.createUser({
        username: trimmedUsername,
        password,
        roleId: Number(roleId),
        profileType,
        profileId: profileType === 'system' ? 0 : Number(profileId),
        isActive
      })

      setUsername('')
      setPassword('')
      setRoleId('0')
      setProfileType('system')
      setProfileId('0')
      setIsActive(true)
      await loadUsersData()
      setStatusMessage('Пользователь создан')
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Новый пользователь</CardTitle>
          <CardDescription>
            Создай логин, пароль, выбери роль и привяжи аккаунт к студенту, преподавателю или
            сотруднику.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          {statusMessage ? (
            <div className="rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-4 py-3 text-sm text-[var(--color-success)]">
              {statusMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
              {errorMessage}
            </div>
          ) : null}

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-[var(--color-text)]">Логин</span>
            <Input
              value={username}
              autoComplete="off"
              placeholder="Например: ivanov"
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-[var(--color-text)]">Пароль</span>
            <Input
              value={password}
              type="password"
              autoComplete="new-password"
              placeholder="Минимум 4 символа"
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-[var(--color-text)]">Роль</span>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Выбери роль" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="0">Выбери роль</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-[var(--color-text)]">Тип профиля</span>
            <Select
              value={profileType}
              onValueChange={(value) => changeProfileType(value as UserProfileType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выбери тип профиля" />
              </SelectTrigger>

              <SelectContent>
                {Object.entries(profileTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-xs text-[var(--color-text-muted)]">
              {profileTypeDescriptions[profileType]}
            </span>
          </label>

          {profileType !== 'system' ? (
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--color-text)]">Профиль</span>
              <Select value={profileId} onValueChange={setProfileId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выбери профиль" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="0">Выбери профиль</SelectItem>
                  {availableProfileOptions.map((profile) => (
                    <SelectItem key={profile.id} value={String(profile.id)}>
                      {profile.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {availableProfileOptions.length === 0 ? (
                <span className="text-xs text-[var(--color-warning)]">
                  В базе пока нет подходящих записей для этого типа профиля.
                </span>
              ) : null}
            </label>
          ) : null}

          <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm">
            <span>
              <span className="block font-medium text-[var(--color-text)]">Аккаунт активен</span>
              <span className="block text-xs text-[var(--color-text-muted)]">
                Неактивный пользователь не сможет войти в приложение.
              </span>
            </span>

            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </label>

          <Button disabled={isSaving} onClick={createUser}>
            <FiUserPlus />
            Создать пользователя
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Пользователи</CardTitle>
              <CardDescription>Список аккаунтов без отображения хэшей паролей.</CardDescription>
            </div>

            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isLoading}
              onClick={loadUsersData}
            >
              <FiRefreshCw />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="grid gap-3">
          {users.length === 0 ? (
            <div className="rounded-2xl border border-[var(--color-border)] p-6 text-sm text-[var(--color-text-muted)]">
              Пользователей пока нет.
            </div>
          ) : null}

          {users.map((user) => (
            <div
              key={user.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[var(--color-text)]">{user.username}</p>
                    <Badge variant={user.isActive ? 'success' : 'muted'}>
                      {user.isActive ? 'Активен' : 'Отключён'}
                    </Badge>
                  </div>

                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {user.roleName} · {profileTypeLabels[user.profileType]}
                  </p>
                </div>

                <Badge variant={user.roleKey === 'super_admin' ? 'success' : 'default'}>
                  {user.roleKey}
                </Badge>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-[var(--color-text-muted)] md:grid-cols-2">
                <div>
                  <span className="font-medium text-[var(--color-text)]">Профиль: </span>
                  {user.profileName ?? 'Не найден'}
                </div>

                <div>
                  <span className="font-medium text-[var(--color-text)]">ID профиля: </span>
                  {user.profileId}
                </div>

                <div>
                  <span className="font-medium text-[var(--color-text)]">Последний вход: </span>
                  {formatDateTime(user.lastLoginAt)}
                </div>

                <div>
                  <span className="font-medium text-[var(--color-text)]">Создан: </span>
                  {formatDateTime(user.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function mapPersonRecordToProfileOption(record: AdminCrudRecord): ProfileOption {
  const id = getNumber(record, 'id')
  const lastName = getString(record, 'last_name')
  const firstName = getString(record, 'first_name')
  const middleName = getString(record, 'middle_name')
  const email = getString(record, 'email')
  const phone = getString(record, 'phone')
  const label = [lastName, firstName, middleName].filter(Boolean).join(' ').trim()

  return {
    id,
    label: label || `Запись #${id}`,
    description: [email, phone].filter(Boolean).join(' · ')
  }
}

function getString(record: AdminCrudRecord, key: string): string {
  const value = record[key]

  return typeof value === 'string' ? value : ''
}

function getNumber(record: AdminCrudRecord, key: string): number {
  const value = record[key]

  return typeof value === 'number' ? value : Number(value) || 0
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('ru-RU')
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Неизвестная ошибка'
}
