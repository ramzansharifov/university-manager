import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiEdit2, FiPlus, FiRefreshCw, FiSave, FiTrash2 } from 'react-icons/fi'
import type { PermissionGroup, RoleDetails } from '../../../../../shared/types/roles'
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
  Switch
} from '../../../shared/ui'

type RoleDialogMode = 'create' | 'edit' | 'view'

const moduleLabels: Record<string, string> = {
  university: 'Университет',
  people: 'Люди',
  academic_calendar: 'Академический календарь',
  academic_process: 'Учебный процесс',
  rooms_and_lessons: 'Аудитории и занятия',
  schedule: 'Расписание',
  learning_journal: 'Журнал обучения',
  reports: 'Отчёты',
  administration: 'Администрирование',
  audit_log: 'Журнал действий',
  settings: 'Настройки'
}

const actionLabels: Record<string, string> = {
  view: 'Просмотр',
  create: 'Создание',
  update: 'Редактирование',
  delete: 'Удаление'
}

const systemRoleDescriptions: Record<string, string[]> = {
  super_admin: [
    'Полный доступ ко всей системе.',
    'Может видеть, создавать, редактировать и удалять данные во всех разделах.',
    'Эта роль системная и не редактируется через интерфейс.'
  ],
  teacher: [
    'Фиксированная роль преподавателя.',
    'Будет видеть свои дисциплины, группы, расписание и журнал обучения.',
    'В следующих этапах ограничим изменения только своими дисциплинами и занятиями.'
  ],
  student: [
    'Фиксированная роль студента.',
    'Будет видеть свою группу, учебный план, оценки, посещаемость и личные отчёты.',
    'В следующих этапах ограничим просмотр только собственными учебными данными.'
  ]
}

export function RolesAdministrationPanel() {
  const [roles, setRoles] = useState<RoleDetails[]>([])
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([])
  const [dialogMode, setDialogMode] = useState<RoleDialogMode | null>(null)
  const [activeRole, setActiveRole] = useState<RoleDetails | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftPermissionKeys, setDraftPermissionKeys] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const permissionKeySet = useMemo(() => new Set(draftPermissionKeys), [draftPermissionKeys])
  const dialogIsOpen = dialogMode !== null
  const canEditCurrentRole = dialogMode === 'create' || dialogMode === 'edit'
  const isSystemRole = activeRole?.isSystem === true

  const loadRoles = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [rolesResult, permissionGroupsResult] = await Promise.all([
        window.api.roles.list(),
        window.api.roles.listPermissionGroups()
      ])

      const roleDetails = await Promise.all(
        rolesResult.map(async (role) => {
          const details = await window.api.roles.getDetails(role.id)

          if (!details) {
            throw new Error(`Роль #${role.id} не найдена`)
          }

          return details
        })
      )

      setRoles(roleDetails)
      setPermissionGroups(permissionGroupsResult)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRoles()
  }, [loadRoles])

  function openCreateDialog() {
    setDialogMode('create')
    setActiveRole(null)
    setDraftName('')
    setDraftDescription('')
    setDraftPermissionKeys([])
    setStatusMessage(null)
    setErrorMessage(null)
  }

  function openRoleDialog(role: RoleDetails) {
    setDialogMode(role.isSystem ? 'view' : 'edit')
    setActiveRole(role)
    setDraftName(role.name)
    setDraftDescription(role.description ?? '')
    setDraftPermissionKeys(role.permissions.map((permission) => permission.permissionKey))
    setStatusMessage(null)
    setErrorMessage(null)
  }

  function closeDialog() {
    setDialogMode(null)
    setActiveRole(null)
    setErrorMessage(null)
  }

  function togglePermission(permissionKey: string) {
    if (!canEditCurrentRole) {
      return
    }

    setDraftPermissionKeys((currentKeys) => {
      if (currentKeys.includes(permissionKey)) {
        return currentKeys.filter((key) => key !== permissionKey)
      }

      return [...currentKeys, permissionKey]
    })
  }

  function togglePermissionGroup(group: PermissionGroup) {
    if (!canEditCurrentRole) {
      return
    }

    const groupPermissionKeys = group.permissions.map((permission) => permission.permissionKey)
    const groupIsSelected = groupPermissionKeys.every((permissionKey) =>
      permissionKeySet.has(permissionKey)
    )

    setDraftPermissionKeys((currentKeys) => {
      if (groupIsSelected) {
        return currentKeys.filter((permissionKey) => !groupPermissionKeys.includes(permissionKey))
      }

      return Array.from(new Set([...currentKeys, ...groupPermissionKeys]))
    })
  }

  async function saveRole() {
    const name = draftName.trim()

    if (!name) {
      setErrorMessage('Укажи название роли')
      return
    }

    setIsSaving(true)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      if (dialogMode === 'create') {
        await window.api.roles.create({
          name,
          description: draftDescription.trim() || null,
          permissionKeys: draftPermissionKeys
        })

        await loadRoles()
        setStatusMessage('Роль создана')
        closeDialog()
        return
      }

      if (!activeRole || activeRole.isSystem) {
        return
      }

      await window.api.roles.update({
        roleId: activeRole.id,
        name,
        description: draftDescription.trim() || null
      })

      await window.api.roles.setPermissions({
        roleId: activeRole.id,
        permissionKeys: draftPermissionKeys
      })

      await loadRoles()
      setStatusMessage('Роль обновлена')
      closeDialog()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteRole(role: RoleDetails) {
    if (role.isSystem) {
      return
    }

    const confirmed = window.confirm(`Удалить роль «${role.name}»?`)

    if (!confirmed) {
      return
    }

    setIsSaving(true)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      await window.api.roles.delete({ roleId: role.id })
      await loadRoles()
      setStatusMessage('Роль удалена')
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

      {errorMessage && !dialogIsOpen ? (
        <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          {errorMessage}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Роли</CardTitle>
              <CardDescription>
                Системные роли и кастомные роли администрирования с матрицей прав.
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled={isLoading} onClick={loadRoles}>
                <FiRefreshCw />
                Обновить
              </Button>

              <Button type="button" onClick={openCreateDialog}>
                <FiPlus />
                Новая роль
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[var(--color-text)]">{role.name}</p>
                    <Badge variant={role.isSystem ? 'success' : 'muted'}>
                      {role.isSystem ? 'Системная' : 'Кастомная'}
                    </Badge>
                  </div>

                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">{role.roleKey}</p>
                  {role.description ? (
                    <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                      {role.description}
                    </p>
                  ) : null}
                </div>

                <Badge variant="default">{role.permissions.length} прав</Badge>
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => openRoleDialog(role)}
                >
                  <FiEdit2 />
                  {role.isSystem ? 'Открыть' : 'Редактировать'}
                </Button>

                {!role.isSystem ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    disabled={isSaving}
                    onClick={() => void deleteRole(role)}
                  >
                    <FiTrash2 />
                    Удалить
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={dialogIsOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create'
                ? 'Новая роль'
                : isSystemRole
                  ? activeRole?.name
                  : 'Редактирование роли'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create'
                ? 'Создай кастомную роль и выбери права доступа.'
                : isSystemRole
                  ? 'Системная роль защищена от ручного изменения.'
                  : 'Измени название, описание и права кастомной роли.'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 grid gap-5">
            {errorMessage ? (
              <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
                {errorMessage}
              </div>
            ) : null}

            {isSystemRole && activeRole ? <SystemRoleHint role={activeRole} /> : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[var(--color-text)]">Название</span>
                <Input
                  value={draftName}
                  disabled={isSystemRole}
                  placeholder="Например: Методист"
                  onChange={(event) => setDraftName(event.target.value)}
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[var(--color-text)]">Описание</span>
                <Input
                  value={draftDescription}
                  disabled={isSystemRole}
                  placeholder="Кратко опиши назначение роли"
                  onChange={(event) => setDraftDescription(event.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text)]">Права доступа</h3>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Для кастомных ролей права сохраняются в базе. Для студента и преподавателя
                  специальные ограничения подключаются кодом.
                </p>
              </div>

              <div className="grid gap-3">
                {permissionGroups.map((group) => {
                  const groupPermissionKeys = group.permissions.map(
                    (permission) => permission.permissionKey
                  )
                  const groupIsSelected = groupPermissionKeys.every((permissionKey) =>
                    permissionKeySet.has(permissionKey)
                  )

                  return (
                    <div
                      key={group.module}
                      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--color-text)]">
                            {moduleLabels[group.module] ?? group.module}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">{group.module}</p>
                        </div>

                        <label className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                          <Switch
                            checked={groupIsSelected}
                            disabled={!canEditCurrentRole}
                            aria-label={`Переключить весь модуль ${moduleLabels[group.module] ?? group.module}`}
                            onCheckedChange={() => togglePermissionGroup(group)}
                          />
                          Весь модуль
                        </label>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {group.permissions.map((permission) => (
                          <label
                            key={permission.permissionKey}
                            className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                          >
                            <Switch
                              checked={permissionKeySet.has(permission.permissionKey)}
                              disabled={!canEditCurrentRole}
                              aria-label={`Переключить право ${permission.permissionKey}`}
                              onCheckedChange={() => togglePermission(permission.permissionKey)}
                            />

                            <span>
                              <span className="block font-medium text-[var(--color-text)]">
                                {actionLabels[permission.action] ?? permission.action}
                              </span>
                              <span className="block text-xs text-[var(--color-text-muted)]">
                                {permission.permissionKey}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" disabled={isSaving} onClick={closeDialog}>
              Закрыть
            </Button>

            {canEditCurrentRole ? (
              <Button type="button" disabled={isSaving} onClick={() => void saveRole()}>
                {dialogMode === 'create' ? <FiPlus /> : <FiSave />}
                {dialogMode === 'create' ? 'Создать роль' : 'Сохранить'}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SystemRoleHint({ role }: { role: RoleDetails }) {
  const lines = systemRoleDescriptions[role.roleKey] ?? [
    'Это системная роль.',
    'Она защищена от изменения через интерфейс.'
  ]

  return (
    <div className="rounded-2xl border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/10 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success">Системная роль</Badge>
        <span className="text-sm font-medium text-[var(--color-text)]">{role.roleKey}</span>
      </div>

      <ul className="mt-3 grid gap-1 text-sm text-[var(--color-text-muted)]">
        {lines.map((line) => (
          <li key={line}>• {line}</li>
        ))}
      </ul>
    </div>
  )
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Неизвестная ошибка'
}
