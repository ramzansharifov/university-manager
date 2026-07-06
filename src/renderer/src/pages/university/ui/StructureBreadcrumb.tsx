import type { AdminCrudRecord } from '../../../features/admin-crud'
import { Badge, Button, Card, CardContent } from '../../../shared/ui'
import { getRecordName } from '../lib/getRecordName'

interface StructureBreadcrumbProps {
  faculty: AdminCrudRecord | null
  specialty: AdminCrudRecord | null
  onFacultiesClick: () => void
  onSpecialtiesClick?: () => void
}

export function StructureBreadcrumb({
  faculty,
  specialty,
  onFacultiesClick,
  onSpecialtiesClick
}: StructureBreadcrumbProps) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={faculty ? 'secondary' : 'primary'} onClick={onFacultiesClick}>
          Факультеты
        </Button>

        {faculty ? (
          <>
            <BreadcrumbSeparator />
            <Button
              size="sm"
              variant={specialty ? 'secondary' : 'primary'}
              onClick={onSpecialtiesClick}
            >
              {getRecordName(faculty)}
            </Button>
          </>
        ) : null}

        {specialty ? (
          <>
            <BreadcrumbSeparator />
            <Badge>{getRecordName(specialty)}</Badge>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

function BreadcrumbSeparator() {
  return <span className="text-sm text-[var(--color-text-muted)]">/</span>
}
