# University Manager

**University Manager** — desktop-приложение для управления учебной, организационной и административной жизнью университета.

Проект построен на базе:

- Electron;
- React;
- TypeScript;
- Vite / electron-vite;
- SQLite;
- better-sqlite3;
- IPC между renderer и main-процессом.

Главная идея проекта — не просто сделать набор CRUD-таблиц, а построить масштабируемую локальную систему управления университетом с ролями, связанными сущностями, расписанием, журналом действий, настройками и проверками качества данных.

---

## Текущее состояние backend

На текущем этапе в проекте реализован backend-фундамент приложения.

Backend уже включает:

- подключение SQLite;
- систему миграций;
- стартовое заполнение базы;
- основную схему таблиц;
- универсальный admin CRUD;
- авторизацию;
- пользователей;
- роли;
- права доступа;
- настройки приложения;
- аудит действий;
- health-check;
- проверки качества данных;
- IPC API;
- preload API для renderer-части.

---

## Архитектура backend

Backend находится в `src/main`.

Основные директории:

```txt
src/main/
  admin/
  audit/
  auth/
  database/
  dataQuality/
  health/
  ipc/
  migrations/
  repositories/
  roles/
  security/
  seed/
  services/
  settings/
  index.ts
```

Назначение основных частей:

### `database/`

Отвечает за подключение к SQLite, запуск миграций и seed-данных.

### `migrations/`

Хранит SQL-миграции базы данных.

### `seed/`

Заполняет базу начальными системными данными.

### `repositories/`

Содержит низкоуровневую работу с SQLite.

### `services/`

Содержит бизнес-логику.

### `ipc/`

Регистрирует IPC-методы, которые вызываются из renderer через preload.

### `auth/`

Отвечает за авторизацию, пользователей, сессии и смену пароля.

### `roles/`

Отвечает за системные и пользовательские роли, список прав и матрицу прав.

### `settings/`

Отвечает за настройки приложения: тему, акцентный цвет и язык.

### `audit/`

Отвечает за журналирование действий пользователя.

### `health/`

Отвечает за проверку технического состояния backend и базы данных.

### `dataQuality/`

Отвечает за проверки качества и заполненности данных.

### `security/`

Содержит security-утилиты, например хэширование и проверку паролей.

---

## Подключение базы данных

В проекте используется SQLite через `better-sqlite3`.

База создаётся локально в пользовательской директории приложения:

```txt
app.getPath('userData')/database/university-manager.sqlite
```

При подключении включаются:

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
```

Это даёт:

- локальное хранение данных;
- работу без отдельного backend-сервера;
- поддержку внешних ключей;
- более надёжную работу SQLite через WAL-режим.

---

## Инициализация backend

При старте Electron-приложения выполняется:

```ts
initializeDatabase()

registerAdminCrudIpcHandlers()
registerSettingsIpcHandlers()
registerAuthIpcHandlers()
registerRoleIpcHandlers()
registerSystemIpcHandlers()
```

То есть при запуске приложения:

1. создаётся или открывается SQLite-база;
2. применяются миграции;
3. запускается seed;
4. регистрируются IPC-методы для CRUD;
5. регистрируются IPC-методы авторизации;
6. регистрируются IPC-методы ролей;
7. регистрируются IPC-методы настроек;
8. регистрируются IPC-методы системных проверок.

---

## Миграции

В проекте реализована базовая система миграций.

Таблица:

```sql
schema_migrations
```

хранит список применённых миграций.

Исходные SQL-миграции лежат в:

```txt
src/main/migrations/
```

Актуальная последовательность миграций:

```txt
001_initial_schema.sql
002_required_faculty_teacher_assignments.sql
005_academic_vacations.sql
006_normalize_pass_fail_grade_element_types.sql
007_remove_legacy_faculty_employee_assignments.sql
008_refactor_departments_and_specialties.sql
```

`001` создаёт актуальную структуру новой базы: декан и заместитель декана хранятся в
`faculties.dean_teacher_id` и `faculties.deputy_dean_teacher_id`. Старые
`dean_employee_id` и `deputy_dean_employee_id` приложение больше не читает и не записывает.
В ранее созданной базе эти физические колонки могут сохраниться — это намеренно допустимо,
чтобы обновление не удаляло пользовательские данные.

`008` рефакторит учебную структуру: убирает `departments.faculty_id` и `specialties.department_id`
из активной модели, добавляет `departments.applies_to_all_faculties` и таблицу `department_faculties`
для связи кафедр с факультетами. Миграция идемпотентна и безопасна для существующих данных.

Миграции применяются только один раз. Если миграция уже есть в `schema_migrations`, она не выполняется повторно.
После SQL-миграций запускается безопасный schema repair: он проверяет фактические колонки через
`PRAGMA table_info`, добавляет отсутствующие teacher-поля факультета и восстанавливает таблицу
`academic_vacations`, если она отсутствует. Repair не удаляет таблицы, колонки или записи. Затем
schema validation сверяет все таблицы и колонки из `adminCrudEntities` и выдаёт ошибку с точным
именем отсутствующей таблицы/колонки.

Пропуски номеров `003` и `004` сохранены намеренно. Имена уже применённых миграций являются
частью истории `schema_migrations`, поэтому их переименование привело бы к повторному выполнению
на существующих локальных базах. `002` и `007` оставлены как совместимые исторические маркеры;
необходимое состояние схемы гарантирует идемпотентный repair-слой.

В packaged-сборку каталог SQL копируется как `resources/migrations`. Runner сначала использует
этот каталог, а в dev/build — `src/main/migrations` относительно каталога приложения. Поэтому
поиск миграций не зависит исключительно от текущей рабочей директории процесса.

---

## Запуск и проверка backend

Для разработки и обязательных проверок используются команды:

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
npm run build:unpack
```

При старте `initializeDatabase()` последовательно запускает SQL-миграции, безопасный schema
repair, проверку схемы, идемпотентный seed и повторную проверку схемы. Для быстрой ручной
проверки в dev-сборке можно войти с логином `admin` и паролем `admin`, затем открыть Health и
Data Quality в административной части. После `build:unpack` SQL-файлы должны находиться в
`dist/win-unpacked/resources/migrations`.

---

## Основные таблицы базы данных

### Структура университета

Реализованы таблицы:

```txt
faculties
departments
specialties
student_groups
divisions
```

Они отвечают за:

- факультеты;
- кафедры;
- специальности;
- учебные группы;
- административные подразделения.

Иерархия учебной структуры:

```txt
Факультет
  → Специальности
    → Группы
```

Кафедры существуют отдельно и могут быть привязаны к одному, нескольким или всем факультетам через таблицу `department_faculties`.

Подразделения существуют отдельно от факультетов и используются для административной части университета.

---

### Люди

Реализованы таблицы:

```txt
students
teachers
employees
positions
dictionary_items
```

Они отвечают за:

- студентов;
- преподавателей;
- сотрудников;
- должности;
- статусы;
- справочные значения.

Студенты связаны с группами.

Преподаватели связаны с кафедрами.

Сотрудники связаны с подразделениями.

---

### Учебный календарь

Реализованы таблицы:

```txt
academic_years
semesters
weeks
academic_vacations
lesson_periods
```

Они отвечают за:

- учебные годы;
- семестры;
- учебные недели;
- каникулы;
- пары / временные слоты.

---

### Учебный процесс

Реализованы таблицы:

```txt
subjects
curriculum_plans
curriculum_items
disciplines
```

Они отвечают за:

- предметы;
- учебные планы;
- пункты учебного плана;
- дисциплины.

Дисциплина в системе понимается как конкретное преподавание предмета конкретной группе конкретным преподавателем в конкретном семестре.

---

### Аудитории и занятия

Реализованы таблицы:

```txt
audience_types
buildings
audiences
lesson_sessions
```

Типы аудиторий хранятся в `audience_types`, корпуса — в `buildings`. Типы занятий хранятся
в `dictionary_items` с ключом справочника `lesson_types`.

---

### Расписание

Реализована таблица:

```txt
schedule_items
```

Она связывает:

- семестр;
- день недели;
- пару;
- группу;
- дисциплину;
- преподавателя;
- аудиторию;
- тип занятия.

На уровне базы уже заложены уникальные индексы для предотвращения конфликтов:

- одна группа не может иметь две пары одновременно;
- один преподаватель не может вести две пары одновременно;
- одна аудитория не может быть занята двумя занятиями одновременно.

---

### Проведённые занятия

Реализована таблица:

```txt
lesson_sessions
```

Она хранит фактические занятия на основе расписания.

Расписание — это план.

Проведённое занятие — это факт.

Проведённое занятие содержит:

- ссылку на запись расписания;
- неделю;
- дату;
- тему;
- статус;
- комментарий;
- преподавателя.

---

### Посещаемость

Реализована таблица:

```txt
attendance_records
```

Она связывает:

- проведённое занятие;
- студента;
- статус посещаемости;
- комментарий;
- пользователя, который поставил отметку.

Статусы посещаемости хранятся в `dictionary_items`.

---

### Оценки и успеваемость

Реализованы таблицы:

```txt
grade_items
score_scales
grades
```

Они отвечают за:

- оценочные элементы;
- шкалы оценивания;
- оценки студентов.

Оценка связывает студента и конкретный оценочный элемент.

---

### Выполнение занятий

Реализована таблица:

```txt
lesson_completion_records
```

Она хранит состояние выполнения занятия:

- выполнено;
- не выполнено;
- тема пройдена;
- комментарий;
- пользователь, который внёс изменение.

---

### Пользователи, роли и права

Реализованы таблицы:

```txt
app_users
roles
permissions
role_permissions
user_sessions
```

Они отвечают за:

- пользователей приложения;
- системные роли;
- пользовательские роли;
- права доступа;
- связь ролей и прав;
- пользовательские сессии.

В системе заложены три системные роли:

```txt
super_admin
teacher
student
```

Эти роли являются системными.

---

### Аудит

Реализована таблица:

```txt
audit_logs
```

Она хранит:

- пользователя;
- действие;
- модуль;
- сущность;
- ID записи;
- данные до изменения;
- данные после изменения;
- дату создания записи журнала.

---

### Настройки

Реализована таблица:

```txt
app_settings
```

Она хранит настройки приложения в формате key-value.

Сейчас используются настройки:

```txt
theme.mode
theme.accent
i18n.language
```

---

## Seed-данные

При инициализации базы автоматически создаются стартовые системные данные.

Seed добавляет:

### Системные роли

```txt
super_admin
teacher
student
```

### Права доступа

Для каждого основного модуля создаются права:

```txt
view
create
update
delete
```

Примеры ключей:

```txt
university.view
university.create
university.update
university.delete

people.view
people.create
people.update
people.delete

schedule.view
schedule.create
schedule.update
schedule.delete
```

### Права суперадмина

Роль `super_admin` автоматически получает все доступные permissions.

### Дефолтный пользователь

Создаётся пользователь:

```txt
login: admin
password: admin
```

Это временный dev-доступ. В будущем его нужно заменить экраном первого запуска и принудительной сменой пароля.

### Справочники

Через `dictionary_items` создаются стартовые справочники:

- статусы студентов;
- статусы преподавателей;
- статусы сотрудников;
- формы обучения;
- статусы посещаемости;
- категории оценок;
- типы занятий;

Типы аудиторий пользователь ведёт в отдельной CRUD-таблице `audience_types`.

### Настройки

Создаются настройки по умолчанию:

```txt
theme.mode = light
theme.accent = blue
i18n.language = ru
```

---

## Универсальный Admin CRUD

В проекте реализован универсальный CRUD-слой для административных сущностей.

Слой состоит из:

```txt
src/main/admin/adminCrudEntities.ts
src/main/repositories/adminCrudRepository.ts
src/main/services/adminCrudService.ts
src/main/ipc/adminCrudIpc.ts
src/preload/api/adminCrudApi.ts
src/shared/types/adminCrud.ts
```

Поддерживаемые операции:

```txt
list
getById
create
update
archive
delete
```

Также поддерживаются:

- пагинация;
- поиск;
- фильтры;
- сортировка;
- исключение архивных записей;
- whitelist разрешённых колонок;
- whitelist разрешённых сущностей;
- автоматическое обновление `updated_at`;
- аудит create/update/archive/delete операций.

CRUD работает не напрямую по любой таблице, а только по сущностям, которые описаны в конфигурации `adminCrudEntities`.

Это снижает риск случайного доступа к неразрешённым таблицам и колонкам.

---

## Admin CRUD сущности

В admin CRUD уже зарегистрированы:

```txt
faculties
departments
department_faculties
specialties
student_groups
divisions
positions
dictionary_items
academic_years
semesters
weeks
academic_vacations
lesson_periods
teachers
employees
students
subjects
curriculum_plans
curriculum_items
disciplines
audience_types
buildings
audiences
schedule_items
lesson_sessions
attendance_records
grade_element_types
grade_items
score_scales
grades
lesson_completion_records
roles
permissions
app_users
audit_logs
app_settings
```

Для каждой сущности задано:

- название таблицы;
- primary key;
- список разрешённых колонок;
- searchable columns;
- default order;
- поддержка `updated_at`;
- поддержка архивирования.

---

## Авторизация

В проекте реализован backend авторизации.

Слой авторизации состоит из:

```txt
src/main/auth/authRepository.ts
src/main/auth/authService.ts
src/main/ipc/authIpc.ts
src/preload/api/authApi.ts
src/shared/types/auth.ts
src/main/security/password.ts
```

Реализовано:

```txt
login
getCurrentUser
logout
createUser
changePassword
```

### Хэширование паролей

Пароли не хранятся в открытом виде.

Для хэширования используется `crypto.scrypt`.

Формат хранения:

```txt
scrypt$salt$hash
```

Проверка пароля выполняется через `timingSafeEqual`.

### Сессии

При успешном входе создаётся token.

Token хранится в таблице:

```txt
user_sessions
```

Срок жизни сессии сейчас составляет 7 дней.

Сессия может быть отозвана через logout.

### Текущий пользователь

`getCurrentUser` возвращает пользователя по token, если:

- сессия существует;
- сессия не отозвана;
- срок действия сессии не истёк.

Пользователь возвращается вместе с:

- ID;
- username;
- roleId;
- roleKey;
- roleName;
- profileType;
- profileId;
- isActive;
- permissions.

---

## Роли и права

В проекте реализован отдельный backend для ролей и прав.

Слой ролей состоит из:

```txt
src/main/roles/roleRepository.ts
src/main/roles/roleService.ts
src/main/ipc/roleIpc.ts
src/preload/api/roleApi.ts
src/shared/types/roles.ts
```

Реализовано:

```txt
listRoles
getRoleDetails
listPermissionGroups
createRole
updateRole
setRolePermissions
archiveRole
deleteRole
```

### Системные роли

Системные роли:

```txt
super_admin
teacher
student
```

Системные роли нельзя изменять через `RoleService`.

Для них запрещены:

- update;
- set permissions;
- archive;
- delete.

### Пользовательские роли

Пользовательские роли можно:

- создавать;
- редактировать;
- назначать им permissions;
- архивировать;
- удалять.

Удаление или архивирование запрещается, если роль уже назначена пользователям.

### Матрица прав

Права хранятся в таблицах:

```txt
permissions
role_permissions
```

Права сгруппированы по модулям.

Каждое право имеет:

- module;
- action;
- permission_key;
- name.

Пример:

```txt
schedule.view
schedule.create
schedule.update
schedule.delete
```

---

## Настройки приложения

В проекте реализован backend настроек.

Слой настроек состоит из:

```txt
src/main/settings/settingsRepository.ts
src/main/settings/settingsService.ts
src/main/ipc/settingsIpc.ts
src/preload/api/settingsApi.ts
src/shared/types/settings.ts
```

Реализовано:

```txt
getSettings
updateSettings
```

Сейчас поддерживаются настройки:

```txt
themeMode: light | dark
accentColor: blue | violet
language: ru | en | fr
```

Изменение настроек записывается в audit log.

---

## Аудит действий

В проекте реализован отдельный AuditService.

Слой аудита состоит из:

```txt
src/main/audit/auditRepository.ts
src/main/audit/auditService.ts
src/main/audit/audit.types.ts
```

Аудит используется в:

- admin CRUD;
- auth;
- roles;
- settings.

Журнал фиксирует:

- создание;
- изменение;
- удаление;
- архивирование;
- вход;
- выход;
- изменение прав;
- изменение настроек.

Каждая запись может хранить:

- пользователя;
- действие;
- модуль;
- сущность;
- ID сущности;
- JSON до изменения;
- JSON после изменения.

---

## Health-check

В проекте реализован backend health-check.

Слой health-check состоит из:

```txt
src/main/health/healthRepository.ts
src/main/health/healthService.ts
src/main/ipc/systemIpc.ts
src/preload/api/systemApi.ts
src/shared/types/system.ts
```

Health-check проверяет:

- подключение к базе данных;
- количество применённых миграций;
- последнюю применённую миграцию;
- количество системных ролей;
- количество permissions;
- существование пользователя `admin`.

Возвращаемый статус:

```txt
ok
warning
error
```

---

## Проверки качества данных

В проекте реализован DataQualityService для будущего админ-центра.

Он формирует отчёт о готовности базы.

Проверки включают:

- факультеты без кафедр;
- кафедры без привязки к факультетам;
- специальности без групп;
- группы без студентов;
- преподаватели без дисциплин;
- дисциплины без расписания;
- расписание без проведённых занятий;
- занятия без посещаемости;
- учебные планы без пунктов;
- пункты учебного плана без дисциплин;
- оценочные элементы без оценок;
- пользовательские роли без прав;
- сотрудники без пользователей.

Отчёт содержит:

- дату генерации;
- процент готовности базы;
- общее количество проверок;
- количество успешных проверок;
- количество предупреждений;
- количество ошибок;
- полный список проверок;
- список найденных проблем.

---

## IPC API

Backend взаимодействует с frontend через IPC.

В `main` регистрируются IPC handlers:

```txt
adminCrud:list
adminCrud:getById
adminCrud:create
adminCrud:update
adminCrud:archive
adminCrud:delete

auth:login
auth:getCurrentUser
auth:logout
auth:createUser
auth:changePassword

roles:list
roles:getDetails
roles:listPermissionGroups
roles:create
roles:update
roles:setPermissions
roles:archive
roles:delete

settings:get
settings:update

system:getHealthReport
system:getDataQualityReport
system:exportDatabaseToJson
system:importDatabaseFromJson
system:resetDatabase
```

---

## Preload API

Renderer не обращается напрямую к Node.js, SQLite или Electron main-process.

Через preload наружу отдаётся безопасный объект:

```ts
window.api
```

Сейчас он содержит:

```ts
window.api.adminCrud
window.api.auth
window.api.roles
window.api.settings
window.api.system
```

Это создаёт основной путь данных:

```txt
renderer
  → window.api
  → preload
  → ipc
  → service
  → repository
  → SQLite
```

---

## Backend flow

Общий поток данных:

```txt
React renderer
  ↓
window.api
  ↓
preload API
  ↓
IPC handler
  ↓
service
  ↓
repository
  ↓
SQLite
```

Основной принцип:

- renderer не знает, как устроена SQLite-база;
- preload отдаёт только безопасные методы;
- IPC не содержит сложную бизнес-логику;
- service отвечает за правила и аудит;
- repository отвечает за SQL;
- database слой отвечает за подключение, миграции и seed.

---

## Что backend уже умеет

На текущем этапе backend умеет:

- создавать SQLite-базу;
- применять миграции;
- заполнять стартовые данные;
- хранить структуру университета;
- хранить людей;
- хранить учебный календарь;
- хранить учебный процесс;
- хранить расписание;
- хранить проведённые занятия;
- хранить посещаемость;
- хранить оценки;
- хранить роли и права;
- хранить пользователей;
- создавать сессии;
- выполнять вход и выход;
- менять пароль;
- создавать пользователей;
- создавать пользовательские роли;
- назначать права ролям;
- запрещать изменение системных ролей;
- читать и менять настройки;
- вести журнал действий;
- выполнять универсальный CRUD;
- выполнять поиск, фильтрацию, сортировку и пагинацию в CRUD;
- архивировать поддерживаемые сущности;
- проверять техническое состояние backend;
- считать готовность базы;
- находить логические проблемы в данных.

---

## Что ещё нужно усилить позже

Backend-фундамент уже готов для начала frontend-разработки.

Но перед production-уровнем нужно будет усилить:

### 1. Проверку прав на backend-уровне

Сейчас роли и permissions уже есть, но нужно добавить обязательную проверку прав для операций:

```txt
view
create
update
delete
```

Проверка должна работать не только на frontend, но и в service/IPC слое.

### 2. Domain services

Нужно вынести отдельные бизнес-сервисы для:

- расписания;
- конфликтов расписания;
- посещаемости;
- оценок;
- проведённых занятий;
- выполнения занятий.

Сейчас часть ограничений уже есть на уровне базы, но более понятные ошибки и бизнес-правила лучше реализовать в service-слое.

### 3. Безопасное удаление

Сейчас есть архивирование и внешние ключи, но нужно добавить более удобный механизм:

- проверка зависимостей перед удалением;
- понятное сообщение пользователю;
- предложение архивировать вместо удаления.

### 4. Первый запуск

Сейчас есть dev-пользователь:

```txt
admin / admin
```

Позже нужно сделать:

- экран первого запуска;
- создание первого администратора;
- принудительную смену дефолтного пароля.

### 5. Расширение аудита

Позже можно добавить:

- userId во все операции;
- IP/device info при необходимости;
- просмотр истории конкретной записи;
- фильтры по пользователю, модулю, действию и дате.

---

## Текущий backend-вердикт

Backend-фундамент проекта готов.

На текущем этапе можно переходить к frontend-интеграции:

1. экран входа;
2. сохранение token;
3. получение текущего пользователя;
4. layout приложения;
5. sidebar по роли;
6. dashboard суперадмина;
7. админ-центр через `window.api.system`;
8. первые CRUD-экраны через `window.api.adminCrud`.

Backend уже предоставляет достаточно API, чтобы frontend начал работать не на моках, а на реальных данных SQLite.
