import type { AdminCrudRecord } from '../../../features/admin-crud'
import { Badge, Button, Card, CardContent } from '../../../shared/ui'
import { getRecordName } from '../lib/getRecordName'

interface StructureBreadcrumbProps {
    faculty: AdminCrudRecord | null
    department: AdminCrudRecord | null
    specialty: AdminCrudRecord | null
    onFacultiesClick: () => void
    onDepartmentsClick?: () => void
    onSpecialtiesClick?: () => void
}

export function StructureBreadcrumb({
    faculty,
    department,
    specialty,
    onFacultiesClick,
    onDepartmentsClick,
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
                            variant={department ? 'secondary' : 'primary'}
                            onClick={onDepartmentsClick}
                        >
                            {getRecordName(faculty)}
                        </Button>
                    </>
                ) : null}

                {department ? (
                    <>
                        <BreadcrumbSeparator />
                        <Button
                            size="sm"
                            variant={specialty ? 'secondary' : 'primary'}
                            onClick={onSpecialtiesClick}
                        >
                            {getRecordName(department)}
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