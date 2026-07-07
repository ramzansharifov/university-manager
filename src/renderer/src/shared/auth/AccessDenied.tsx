import { useNavigate } from 'react-router-dom'
import { FiShield } from 'react-icons/fi'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui'

interface AccessDeniedProps {
  fallbackPath?: string | null
}

export function AccessDenied({ fallbackPath }: AccessDeniedProps) {
  const navigate = useNavigate()
  const targetPath = fallbackPath ?? '/'

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
            <FiShield className="h-6 w-6" />
          </div>

          <CardTitle>Нет доступа</CardTitle>
          <CardDescription>
            У твоей роли нет прав для просмотра этого раздела. Обратись к администратору, если
            доступ нужен для работы.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button type="button" onClick={() => navigate(targetPath, { replace: true })}>
            Перейти в доступный раздел
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
