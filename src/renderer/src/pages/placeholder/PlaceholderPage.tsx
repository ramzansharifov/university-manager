import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui'

interface PlaceholderPageProps {
    title: string
    description: string
    items: string[]
}

export function PlaceholderPage({ title, description, items }: PlaceholderPageProps) {
    return (
        <div className="grid gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle>Модуль в разработке</CardTitle>
                            <CardDescription>
                                Страница уже подключена к роутингу. Следующим шагом сюда будет добавлена реальная
                                логика и работа с backend.
                            </CardDescription>
                        </div>

                        <Badge variant="warning">draft</Badge>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {items.map((item) => (
                            <div
                                key={item}
                                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                            >
                                <p className="text-sm font-medium text-[var(--color-text)]">{item}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}