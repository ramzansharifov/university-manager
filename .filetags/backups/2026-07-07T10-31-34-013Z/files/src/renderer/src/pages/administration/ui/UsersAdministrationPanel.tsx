import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiEdit2, FiRefreshCw, FiSave, FiTrash2, FiUserPlus } from 'react-icons/fi'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

type UserDialogMode = 'create' | 'edit'

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

  const [dialogMode, setDialogMode] = useState<UserDialogMode | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [formUsername, setFormUsername] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRoleId, setFormRoleId] = useState('0')
  const [formProfileType, setFormProfileType] = useState<UserProfileType>('system')
  const [formProfileId, setFormProfileId] = useState('0')
  const [formIsActive, setFormIsActive] = useState(true)

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users]
  )

  const formProfileOptions = useMemo(
    () => getProfileOptionsForType(profileOptions, formProfileType),
    [formProfileType, profileOptions]
  )

  const userDialogIsOpen = dialogMode !== null
  const selectedUserIsProtectedAdmin = Boolean(
    selectedUser?.username === 'admin' && selectedUser.roleKey === 'super_admin'
  )

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

  function resetForm() {
    setFormUsername('')
    setFormPassword('')
    setFormRoleId('0')
    setFormProfileType('system')
    setFormProfileId('0')
    setFormIsActive(true)
  }

  function openCreateDialog() {
    setDialogMode('create')
    setSelectedUserId(null)
    resetForm()
    setStatusMessage(null)
    setErrorMessage(null)
  }

  function openEditDialog(user: AuthUserListItem) {
    setDialogMode('edit')
    setSelectedUserId(user.id)
    setFormUsername(user.username)
    setFormPassword('')
    setFormRoleId(String(user.roleId))
    setFormProfileType(user.profileType)
    setFormProfileId(String(user.profileId))
    setFormIsActive(user.isActive)
    setStatusMessage(null)
    setErrorMessage(null)
  }

  function closeDialog() {
    setDialogMode(null)
    setErrorMessage(null)
  }

  function changeProfileType(nextProfileType: UserProfileType) {
    setFormProfileType(nextProfileType)
    setFormProfileId('0')
  }

  async function saveUser() {
    const trimmedUsername = formUsername.trim()

    if (!dialogMode) {
      return
    }

    if (!trimmedUsername) {
      setErrorMessage('Укажи логин пользователя')
      return
    }

    if (formRoleId === '0') {
      setErrorMessage('Выбери роль пользователя')
      return
    }

    if (formProfileType !== 'system' && formProfileId === '0') {
      setErrorMessage(`Выбери профиль: ${profileTypeLabels[formProfileType].toLowerCase()}`)
      return
    }

    if (dialogMode === 'create' && formPassword.length < 4) {
      setErrorMessage('Пароль должен содержать не менее 4 символов')
      return
    }

    if (dialogMode === 'edit' && formPassword.length > 0 && formPassword.length < 4) {
      setErrorMessage('Новый пароль должен содержать не менее 4 символов')
      return
    }

    setIsSaving(true)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      if (dialogMode === 'create') {
        const result = await window.api.auth.createUser({
          username: trimmedUsername,
          password: formPassword,
          roleId: Number(formRoleId),
          profileType: formProfileType,
          profileId: formProfileType === 'system' ? 0 : Number(formProfileId),
          isActive: formIsActive
        })

        setSelectedUserId(result.user.id)
        await loadUsersData()
        setStatusMessage('Пользователь создан')
        closeDialog()
        return
      }

      if (!selectedUser) {
        return
      }

      const result = await window.api.auth.updateUser({
        userId: selectedUser.id,
        username: trimmedUsername,
        roleId: Number(formRoleId),
        profileType: formProfileType,
        profileId: formProfileType === 'system' ? 0 : Number(formProfileId),
        isActive: formIsActive
      })

      if (formPassword.length > 0) {
        await window.api.auth.changePassword({
          userId: selectedUser.id,
          newPassword: formPassword
        })
      }

      setSelectedUserId(result.user.id)
      await loadUsersData()
      setStatusMessage(
        formPassword.length > 0 ? 'Пользователь и пароль обновлены' : 'Пользователь обновлён'
      )
      closeDialog()
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

  async function deleteUser(user: AuthUserListItem) {
    if (user.username === 'admin' && user.roleKey === 'super_admin') {
      setErrorMessage('Нельзя удалить основного администратора')
      return
    }

    const confirmed = window.confirm(`Полностью удалить пользователя «${user.username}»?`)

    if (!confirmed) {
      return
    }

    setIsSaving(true)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      await window.api.auth.deleteUser({ userId: user.id })

      if (selectedUserId === user.id) {
        setSelectedUserId(null)
      }

      await loadUsersData()
      setStatusMessage('Пользователь удалён')
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid gap-4">
      {statusMessage ? (
        <div className="rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-4 py-3 text-sm text-[var(--color-success)]">
          {statusMessage}
        </div>
      ) : null}

      {errorMessage && !userDialogIsOpen ? (
        <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          {errorMessage}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Пользователи</CardTitle>
              <CardDescription>
                Управление аккаунтами, ролями, привязками и паролями без отображения хэшей.
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isLoading}
                onClick={loadUsersData}
              >
                <FiRefreshCw />
                Обновить
              </Button>

              <Button type="button" onClick={openCreateDialog}>
                <FiUserPlus />
                Новый пользователь
              </Button>
            </div>
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

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => openEditDialog(user)}
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

                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  disabled={
                    isSaving || (user.username === 'admin' && user.roleKey === 'super_admin')
                  }
                  onClick={() => void deleteUser(user)}
                >
                  <FiTrash2 />
                  Удалить
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={userDialogIsOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent
          className="max-h-[90vh] max-w-3xl overflow-y-auto"
          onPointerDownOutside={preventDialogCloseFromRadixSelect}
          onFocusOutside={preventDialogCloseFromRadixSelect}
          onInteractOutside={preventDialogCloseFromRadixSelect}
        >
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Новый пользователь' : 'Редактирование пользователя'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create'
                ? 'Создай логин, пароль, выбери роль и привязку к профилю.'
                : 'Измени роль, привязку, активность или задай новый пароль.'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 grid gap-4">
            {errorMessage ? (
              <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
                {errorMessage}
              </div>
            ) : null}

            {selectedUserIsProtectedAdmin ? (
              <div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-4 py-3 text-sm text-[var(--color-warning)]">
                Основного администратора нельзя отключить, удалить или перевести на другую роль.
              </div>
            ) : null}

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--color-text)]">Логин</span>
              <Input
                value={formUsername}
                autoComplete="off"
                placeholder="Например: ivanov"
                onChange={(event) => setFormUsername(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--color-text)]">
                {dialogMode === 'create' ? 'Пароль' : 'Новый пароль'}
              </span>
              <Input
                value={formPassword}
                type="password"
                autoComplete="new-password"
                placeholder={
                  dialogMode === 'create'
                    ? 'Минимум 4 символа'
                    : 'Оставь пустым, если пароль менять не нужно'
                }
                onChange={(event) => setFormPassword(event.target.value)}
              />
            </label>

            <RoleSelect
              value={formRoleId}
              roles={roles}
              disabled={selectedUserIsProtectedAdmin}
              onValueChange={setFormRoleId}
            />

            <ProfileTypeSelect value={formProfileType} onValueChange={changeProfileType} />

            {formProfileType !== 'system' ? (
              <ProfileSelect
                value={formProfileId}
                options={formProfileOptions}
                onValueChange={setFormProfileId}
              />
            ) : null}

            <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm">
              <span>
                <span className="block font-medium text-[var(--color-text)]">Аккаунт активен</span>
                <span className="block text-xs text-[var(--color-text-muted)]">
                  Неактивный пользователь не сможет войти в приложение.
                </span>
              </span>

              <Switch
                checked={formIsActive}
                disabled={selectedUserIsProtectedAdmin}
                onCheckedChange={setFormIsActive}
              />
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" disabled={isSaving} onClick={closeDialog}>
              Отмена
            </Button>

            <Button type="button" disabled={isSaving} onClick={() => void saveUser()}>
              {dialogMode === 'create' ? <FiUserPlus /> : <FiSave />}
              {dialogMode === 'create' ? 'Создать' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface DialogOutsideEvent {
  target: EventTarget | null
  detail?: {
    originalEvent?: Event
  }
  preventDefault(): void
}

function preventDialogCloseFromRadixSelect(event: DialogOutsideEvent): void {
  const originalTarget = event.detail?.originalEvent?.target

  if (
    targetIsInsideRadixSelectPortal(event.target) ||
    targetIsInsideRadixSelectPortal(originalTarget) ||
    document.querySelector('[data-university-manager-select-content]')
  ) {
    event.preventDefault()
  }
}

function targetIsInsideRadixSelectPortal(target: EventTarget | null | undefined): boolean {
  const element =
    target instanceof Element ? target : target instanceof Node ? target.parentElement : null

  if (!element) {
    return false
  }

  return Boolean(
    element.closest('[data-university-manager-select-content]') ||
    element.querySelector('[data-university-manager-select-content]')
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
