import {
  FiBookOpen,
  FiCalendar,
  FiHome,
  FiSettings,
  FiShield,
  FiUsers
} from 'react-icons/fi'
import { AppProviders } from './app/providers/AppProviders'
import { AppLayout } from './layouts/AppLayout'
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
  DialogTrigger,
  Input,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItemButton,
  SidebarSection,
  SidebarSectionTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from './shared/ui'

function App() {
  const sidebar = (
    <Sidebar>
      <SidebarHeader>
        <p className="text-sm font-semibold text-[var(--color-primary)]">University Manager</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">Административная система</p>
      </SidebarHeader>

      <SidebarContent>
        <SidebarSection>
          <SidebarSectionTitle>Основное</SidebarSectionTitle>
          <SidebarItemButton active icon={<FiHome />}>
            Главная
          </SidebarItemButton>
          <SidebarItemButton icon={<FiBookOpen />}>Университет</SidebarItemButton>
          <SidebarItemButton icon={<FiUsers />}>Люди</SidebarItemButton>
          <SidebarItemButton icon={<FiCalendar />}>Расписание</SidebarItemButton>
        </SidebarSection>

        <SidebarSection>
          <SidebarSectionTitle>Система</SidebarSectionTitle>
          <SidebarItemButton icon={<FiShield />}>Администрирование</SidebarItemButton>
          <SidebarItemButton icon={<FiSettings />}>Настройки</SidebarItemButton>
        </SidebarSection>
      </SidebarContent>

      <SidebarFooter>
        <div className="rounded-xl bg-[var(--color-surface-muted)] p-3">
          <p className="text-sm font-medium text-[var(--color-text)]">admin</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">Суперадмин</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )

  const header = (
    <div className="flex h-full items-center justify-between">
      <div>
        <p className="text-sm font-medium text-[var(--color-text)]">Главная</p>
        <p className="text-xs text-[var(--color-text-muted)]">Проверка UI kit компонентов</p>
      </div>

      <Badge variant="success">Backend ready</Badge>
    </div>
  )

  return (
    <AppProviders>
      <AppLayout sidebar={sidebar} header={header}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>UI kit foundation</CardTitle>
                  <CardDescription>
                    Базовые компоненты интерфейса подключены и готовы к использованию.
                  </CardDescription>
                </div>

                <Badge>v0.1</Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button>Основная кнопка</Button>
                <Button variant="secondary">Вторичная</Button>
                <Button variant="ghost">Прозрачная</Button>
                <Button variant="danger">Удалить</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Компоненты форм и модалок</CardTitle>
              <CardDescription>Input, Dialog и Tabs в одном тестовом экране.</CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="form">
                <TabsList>
                  <TabsTrigger value="form">Форма</TabsTrigger>
                  <TabsTrigger value="modal">Модалка</TabsTrigger>
                  <TabsTrigger value="statuses">Статусы</TabsTrigger>
                </TabsList>

                <TabsContent value="form">
                  <div className="grid max-w-md gap-3">
                    <Input placeholder="Название факультета" />
                    <Input placeholder="Краткое название" />
                    <Button className="w-fit">Сохранить</Button>
                  </div>
                </TabsContent>

                <TabsContent value="modal">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>Открыть модалку</Button>
                    </DialogTrigger>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Добавить факультет</DialogTitle>
                        <DialogDescription>
                          Позже эта форма будет подключена к admin CRUD backend.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="mt-5 grid gap-3">
                        <Input placeholder="Название факультета" />
                        <Input placeholder="Краткое название" />
                      </div>

                      <DialogFooter>
                        <Button variant="secondary">Отмена</Button>
                        <Button>Создать</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TabsContent>

                <TabsContent value="statuses">
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="danger">Danger</Badge>
                    <Badge variant="muted">Muted</Badge>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AppProviders>
  )
}

export default App