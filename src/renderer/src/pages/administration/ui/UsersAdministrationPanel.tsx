import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiEdit2, FiKey, FiRefreshCw, FiSave, FiUserPlus } from 'react-icons/fi'
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

  const [createUsername, setCreateUsername] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createRoleId, setCreateRoleId] = useState('0')
  const [createProfileType, setCreateProfileType] = useState<UserProfileType>('system')
  const [createProfileId, setCreateProfileId] = useState('0')
  const [createIsActive, setCreateIsActive] = useState(true)

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [editUsername, setEditUsername] = useState('')
  const [editRoleId, setEditRoleId] = useState('0')
  const [editProfileType, setEditProfileType] = useState<UserProfileType>('system')
  const [editProfileId, setEditProfileId] = useState('0')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editPassword, setEditPassword] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users]
  )

  const createProfileOptions = useMemo(
    () => getProfileOptionsForType(profileOptions, createProfileType),
    [createProfileType, profileOptions]
  )

  const editProfileOptions = useMemo(
    () => getProfileOptionsForType(profileOptions, editProfileType),
    [editProfileType, profileOptions]
  )

  const selectedUserIsProtectedAdmin =
    selectedUser?.username === 'admin' && selectedUser.roleKey === 'super_admin'

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

  useEffect(() => {
    if (!selectedUser) {
      return
    }

    setEditUsername(selectedUser.username)
    setEditRoleId(String(selectedUser.roleId))
    setEditProfileType(selectedUser.profileType)
    setEditProfileId(String(selectedUser.profileId))
    setEditIsActive(selectedUser.isActive)
    setEditPassword('')
  }, [selectedUser])

  function changeCreateProfileType(nextProfileType: UserProfileType) {
    setCreateProfileType(nextProfileType)
    setCreateProfileId('0')
  }

  function changeEditProfileType(nextProfileType: UserProfileType) {
    setEditProfileType(nextProfileType)
    setEditProfileId('0')
  }

  function selectUser(userId: number) {
    setSelectedUserId(userId)
    setStatusMessage(null)
    setErrorMessage(null)
  }

  async function createUser() {
    const trimmedUsername = createUsername.trim()

    if (!trimmedUsername) {
      setErrorMessage('Укажи логин пользователя')
      return
    }

    if (createPassword.length < 4) {
      setErrorMessage('Пароль должен содержать не менее 4 символов')
      return
    }

    if (createRoleId === '0') {
      setErrorMessage('Выбери роль пользователя')
      return
    }

    if (createProfileType !== 'system' && createProfileId === '0') {
      setErrorMessage(`Выбери профиль: ${profileTypeLabels[createProfileType].toLowerCase()}`)
      return
    }

    setIsSaving(true)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      const result = await window.api.auth.createUser({
        username: trimmedUsername,
        password: createPassword,
        roleId: Number(createRoleId),
        profileType: createProfileType,
        profileId: createProfileType === 'system' ? 0 : Number(createProfileId),
        isActive: createIsActive
      })

      setCreateUsername('')
      setCreatePassword('')
      setCreateRoleId('0')
      setCreateProfileType('system')
      setCreateProfileId('0')
      setCreateIsActive(true)
      setSelectedUserId(result.user.id)
      await loadUsersData()
      setStatusMessage('Пользователь создан')
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function saveSelectedUser() {
    if (!selectedUser) {
      return
    }

    const trimmedUsername = editUsername.trim()

    if (!trimmedUsername) {
      setErrorMessage('Укажи логин пользователя')
      return
    }

    if (editRoleId === '0') {
      setErrorMessage('Выбери роль пользователя')
      return
    }

    if (editProfileType !== 'system' && editProfileId === '0') {
      setErrorMessage(`Выбери профиль: ${profileTypeLabels[editProfileType].toLowerCase()}`)
      return
    }

    setIsSaving(true)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      const result = await window.api.auth.updateUser({
        userId: selectedUser.id,
        username: trimmedUsername,
        roleId: Number(editRoleId),
        profileType: editProfileType,
        profileId: editProfileType === 'system' ? 0 : Number(editProfileId),
        isActive: editIsActive
      })

      setSelectedUserId(result.user.id)
      await loadUsersData()
      setStatusMessage('Пользователь обновлён')
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function changeSelectedUserPassword() {
    if (!selectedUser) {
      return
    }

    if (editPassword.length < 4) {
      setErrorMessage('Новый пароль должен содержать не менее 4 символов')
      return
    }

    setIsSaving(true)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      await window.api.auth.changePassword({
        userId: selectedUser.id,
        newPassword: editPassword
      })

      setEditPassword('')
      setStatusMessage('Пароль изменён')
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleUserActive(user: AuthUserListItem) {
    if (user.username === 'admin' && user.roleKey === 'super_admin') {
      setErrorMessage('Нельзя отключить основного администратора')
      return
    }

    setIsSaving(true)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      await window.api.auth.setUserActive({
        userId: user.id,
        isActive: !user.isActive
      })

      await loadUsersData()
      setStatusMessage(user.isActive ? 'Пользователь отключён' : 'Пользователь включён')
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
      <div className="grid gap-4">
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
                value={createUsername}
                autoComplete="off"
                placeholder="Например: ivanov"
                onChange={(event) => setCreateUsername(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--color-text)]">Пароль</span>
              <Input
                value={createPassword}
                type="password"
                autoComplete="new-password"
                placeholder="Минимум 4 символа"
                onChange={(event) => setCreatePassword(event.target.value)}
              />
            </label>

            <RoleSelect value={createRoleId} roles={roles} onValueChange={setCreateRoleId} />

            <ProfileTypeSelect value={createProfileType} onValueChange={changeCreateProfileType} />

            {createProfileType !== 'system' ? (
              <ProfileSelect
                value={createProfileId}
                options={createProfileOptions}
                onValueChange={setCreateProfileId}
              />
            ) : null}

            <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm">
              <span>
                <span className="block font-medium text-[var(--color-text)]">Аккаунт активен</span>
                <span className="block text-xs text-[var(--color-text-muted)]">
                  Неактивный пользователь не сможет войти в приложение.
                </span>
              </span>

              <Switch checked={createIsActive} onCheckedChange={setCreateIsActive} />
            </label>

            <Button disabled={isSaving} onClick={createUser}>
              <FiUserPlus />
              Создать пользователя
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Редактирование</CardTitle>
            <CardDescription>
              Выбери пользователя из списка, чтобы изменить роль, привязку, активность или пароль.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            {!selectedUser ? (
              <div className="rounded-2xl border border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)]">
                Пользователь не выбран.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] p-4">
                  <div>
                    <p className="font-semibold text-[var(--color-text)]">
                      {selectedUser.username}
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {selectedUser.roleName} · {profileTypeLabels[selectedUser.profileType]}
                    </p>
                  </div>

                  <Badge variant={selectedUser.isActive ? 'success' : 'muted'}>
                    {selectedUser.isActive ? 'Активен' : 'Отключён'}
                  </Badge>
                </div>

                {selectedUserIsProtectedAdmin ? (
                  <div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-4 py-3 text-sm text-[var(--color-warning)]">
                    Основного администратора нельзя отключить или перевести на другую роль.
                  </div>
                ) : null}

                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-[var(--color-text)]">Логин</span>
                  <Input
                    value={editUsername}
                    autoComplete="off"
                    onChange={(event) => setEditUsername(event.target.value)}
                  />
                </label>

                <RoleSelect
                  value={editRoleId}
                  roles={roles}
                  disabled={selectedUserIsProtectedAdmin}
                  onValueChange={setEditRoleId}
                />

                <ProfileTypeSelect value={editProfileType} onValueChange={changeEditProfileType} />

                {editProfileType !== 'system' ? (
                  <ProfileSelect
                    value={editProfileId}
                    options={editProfileOptions}
                    onValueChange={setEditProfileId}
                  />
                ) : null}

                <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm">
                  <span>
                    <span className="block font-medium text-[var(--color-text)]">
                      Аккаунт активен
                    </span>
                    <span className="block text-xs text-[var(--color-text-muted)]">
                      Отключённый пользователь не сможет войти.
                    </span>
                  </span>

                  <Switch
                    checked={editIsActive}
                    disabled={selectedUserIsProtectedAdmin}
                    onCheckedChange={setEditIsActive}
                  />
                </label>

                <Button disabled={isSaving} onClick={saveSelectedUser}>
                  <FiSave />
                  Сохранить пользователя
                </Button>

                <div className="grid gap-2 border-t border-[var(--color-border)] pt-4">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-[var(--color-text)]">Новый пароль</span>
                    <Input
                      value={editPassword}
                      type="password"
                      autoComplete="new-password"
                      placeholder="Минимум 4 символа"
                      onChange={(event) => setEditPassword(event.target.value)}
                    />
                  </label>

                  <Button
                    variant="secondary"
                    disabled={isSaving || editPassword.length === 0}
                    onClick={changeSelectedUserPassword}
                  >
                    <FiKey />
                    Сменить пароль
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

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
              className={[
                'rounded-2xl border bg-[var(--color-surface)] p-4',
                selectedUserId === user.id
                  ? 'border-[var(--color-primary)]'
                  : 'border-[var(--color-border)]'
              ].join(' ')}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button type="button" className="text-left" onClick={() => selectUser(user.id)}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[var(--color-text)]">{user.username}</p>
                    <Badge variant={user.isActive ? 'success' : 'muted'}>
                      {user.isActive ? 'Активен' : 'Отключён'}
                    </Badge>
                  </div>

                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {user.roleName} · {profileTypeLabels[user.profileType]}
                  </p>
                </button>

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

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => selectUser(user.id)}
                >
                  <FiEdit2 />
                  Редактировать
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant={user.isActive ? 'danger' : 'secondary'}
                  disabled={
                    isSaving || (user.username === 'admin' && user.roleKey === 'super_admin')
                  }
                  onClick={() => void toggleUserActive(user)}
                >
                  {user.isActive ? 'Отключить' : 'Включить'}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function RoleSelect({
  value,
  roles,
  disabled,
  onValueChange
}: {
  value: string
  roles: Role[]
  disabled?: boolean
  onValueChange: (value: string) => void
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-[var(--color-text)]">Роль</span>
      <Select value={value} disabled={disabled} onValueChange={onValueChange}>
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
  )
}

function ProfileTypeSelect({
  value,
  onValueChange
}: {
  value: UserProfileType
  onValueChange: (value: UserProfileType) => void
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-[var(--color-text)]">Тип профиля</span>
      <Select
        value={value}
        onValueChange={(nextValue) => onValueChange(nextValue as UserProfileType)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Выбери тип профиля" />
        </SelectTrigger>

        <SelectContent>
          {Object.entries(profileTypeLabels).map(([profileType, label]) => (
            <SelectItem key={profileType} value={profileType}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-xs text-[var(--color-text-muted)]">
        {profileTypeDescriptions[value]}
      </span>
    </label>
  )
}

function ProfileSelect({
  value,
  options,
  onValueChange
}: {
  value: string
  options: ProfileOption[]
  onValueChange: (value: string) => void
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-[var(--color-text)]">Профиль</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Выбери профиль" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="0">Выбери профиль</SelectItem>
          {options.map((profile) => (
            <SelectItem key={profile.id} value={String(profile.id)}>
              {profile.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {options.length === 0 ? (
        <span className="text-xs text-[var(--color-warning)]">
          В базе пока нет подходящих записей для этого типа профиля.
        </span>
      ) : null}
    </label>
  )
}

function getProfileOptionsForType(
  options: Record<Exclude<UserProfileType, 'system'>, ProfileOption[]>,
  profileType: UserProfileType
): ProfileOption[] {
  if (profileType === 'system') {
    return []
  }

  return options[profileType]
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
