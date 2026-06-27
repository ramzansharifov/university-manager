import { AppProviders } from './app/providers/AppProviders'
import { t } from './shared/i18n'
import { Button } from './shared/ui/button'

function App() {
  return (
    <AppProviders>
      <main className="min-h-screen bg-[var(--color-background)] p-8 text-[var(--color-text)]">
        <section className="mx-auto max-w-5xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
          <p className="text-sm font-medium text-[var(--color-primary)]">{t('app.name')}</p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Архитектурный фундамент подключён
          </h1>

          <p className="mt-4 max-w-2xl text-[var(--color-text-muted)]">
            Добавлены базовые слои: UI kit, темы, i18n, маршруты, permissions и React Query
            provider.
          </p>

          <div className="mt-6 flex gap-3">
            <Button>{t('common.create')}</Button>
            <Button variant="secondary">{t('common.edit')}</Button>
            <Button variant="ghost">{t('common.cancel')}</Button>
          </div>
        </section>
      </main>
    </AppProviders>
  )
}

export default App