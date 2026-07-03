import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
import { Button } from '../../../shared/ui'
import {
  createDepartmentColumns,
  createDepartmentFields,
  createFacultyColumns,
  createFacultyFields,
  createGroupColumns,
  createGroupFields,
  createOptions,
  createOptionsMap,
  getPersonName,
  specialtyColumns,
  specialtyFields
} from '../config/universityCrudConfig'
import { getRecordName } from '../lib/getRecordName'
import { StructureBreadcrumb } from './StructureBreadcrumb'

export function UniversityStructureDrilldown() {
  const [selectedFaculty, setSelectedFaculty] = useState<AdminCrudRecord | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<AdminCrudRecord | null>(null)
  const [selectedSpecialty, setSelectedSpecialty] = useState<AdminCrudRecord | null>(null)

  const [teacherOptions, setTeacherOptions] = useState<AdminCrudSelectOption[]>([])
  const [employeeOptions, setEmployeeOptions] = useState<AdminCrudSelectOption[]>([])

  const loadRelationOptions = useCallback(async () => {
    const [teachers, employees] = await Promise.all([
      window.api.adminCrud.list({
        entity: 'teachers',
        page: 1,
        pageSize: 100,
        orderBy: 'last_name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'employees',
        page: 1,
        pageSize: 100,
        orderBy: 'last_name',
        orderDirection: 'asc'
      })
    ])

    setTeacherOptions(createOptions(teachers.items, getPersonName))
    setEmployeeOptions(createOptions(employees.items, getPersonName))
  }, [])

  useEffect(() => {
    void loadRelationOptions()
  }, [loadRelationOptions])

  const teacherNameById = useMemo(() => createOptionsMap(teacherOptions), [teacherOptions])
  const employeeNameById = useMemo(() => createOptionsMap(employeeOptions), [employeeOptions])

  const facultyFields = useMemo(() => createFacultyFields(employeeOptions), [employeeOptions])
  const facultyColumns = useMemo(() => createFacultyColumns(employeeNameById), [employeeNameById])

  const departmentFields = useMemo(() => createDepartmentFields(teacherOptions), [teacherOptions])
  const departmentColumns = useMemo(
    () => createDepartmentColumns(teacherNameById),
    [teacherNameById]
  )

  const groupFields = useMemo(() => createGroupFields(teacherOptions), [teacherOptions])
  const groupColumns = useMemo(() => createGroupColumns(teacherNameById), [teacherNameById])

  const departmentFilters = useMemo(
    () => (selectedFaculty ? { faculty_id: Number(selectedFaculty.id) } : undefined),
    [selectedFaculty]
  )

  const departmentFixedData = useMemo(
    () => (selectedFaculty ? { faculty_id: Number(selectedFaculty.id) } : undefined),
    [selectedFaculty]
  )

  const specialtyFilters = useMemo(
    () =>
      selectedFaculty && selectedDepartment
        ? {
            faculty_id: Number(selectedFaculty.id),
            department_id: Number(selectedDepartment.id)
          }
        : undefined,
    [selectedDepartment, selectedFaculty]
  )

  const specialtyFixedData = useMemo(
    () =>
      selectedFaculty && selectedDepartment
        ? {
            faculty_id: Number(selectedFaculty.id),
            department_id: Number(selectedDepartment.id)
          }
        : undefined,
    [selectedDepartment, selectedFaculty]
  )

  const groupFilters = useMemo(
    () => (selectedSpecialty ? { specialty_id: Number(selectedSpecialty.id) } : undefined),
    [selectedSpecialty]
  )

  const groupFixedData = useMemo(
    () => (selectedSpecialty ? { specialty_id: Number(selectedSpecialty.id) } : undefined),
    [selectedSpecialty]
  )

  function openFaculty(record: AdminCrudRecord) {
    setSelectedFaculty(record)
    setSelectedDepartment(null)
    setSelectedSpecialty(null)
  }

  function openDepartment(record: AdminCrudRecord) {
    setSelectedDepartment(record)
    setSelectedSpecialty(null)
  }

  function openSpecialty(record: AdminCrudRecord) {
    setSelectedSpecialty(record)
  }

  function backToFaculties() {
    setSelectedFaculty(null)
    setSelectedDepartment(null)
    setSelectedSpecialty(null)
  }

  function backToDepartments() {
    setSelectedDepartment(null)
    setSelectedSpecialty(null)
  }

  function backToSpecialties() {
    setSelectedSpecialty(null)
  }

  return (
    <div className="grid gap-4">
      <StructureBreadcrumb
        faculty={selectedFaculty}
        department={selectedDepartment}
        specialty={selectedSpecialty}
        onFacultiesClick={backToFaculties}
        onDepartmentsClick={selectedFaculty ? backToDepartments : undefined}
        onSpecialtiesClick={selectedDepartment ? backToSpecialties : undefined}
      />

      {!selectedFaculty ? (
        <AdminCrudEntityPanel
          entity="faculties"
          title="Факультеты"
          description="Выбери факультет, чтобы перейти к его кафедрам. Можно кликнуть по строке или нажать «Открыть»."
          createButtonLabel="Добавить факультет"
          fields={facultyFields}
          columns={facultyColumns}
          onAfterMutation={loadRelationOptions}
          onRowClick={openFaculty}
          extraRowActions={(record) => (
            <Button size="sm" variant="primary" onClick={() => openFaculty(record)}>
              Открыть
              <FiArrowRight />
            </Button>
          )}
        />
      ) : null}

      {selectedFaculty && !selectedDepartment ? (
        <AdminCrudEntityPanel
          entity="departments"
          title={`Кафедры: ${getRecordName(selectedFaculty)}`}
          description="Кафедры выбранного факультета. Клик по кафедре откроет список специальностей."
          createButtonLabel="Добавить кафедру"
          fields={departmentFields}
          columns={departmentColumns}
          filters={departmentFilters}
          fixedData={departmentFixedData}
          emptyMessage="У этого факультета пока нет кафедр."
          onAfterMutation={loadRelationOptions}
          onRowClick={openDepartment}
          extraRowActions={(record) => (
            <Button size="sm" variant="primary" onClick={() => openDepartment(record)}>
              Открыть
              <FiArrowRight />
            </Button>
          )}
        />
      ) : null}

      {selectedFaculty && selectedDepartment && !selectedSpecialty ? (
        <AdminCrudEntityPanel
          entity="specialties"
          title={`Специальности: ${getRecordName(selectedDepartment)}`}
          description="Специальности выбранной кафедры. Клик по специальности откроет список групп."
          createButtonLabel="Добавить специальность"
          fields={specialtyFields}
          columns={specialtyColumns}
          filters={specialtyFilters}
          fixedData={specialtyFixedData}
          emptyMessage="У этой кафедры пока нет специальностей."
          onRowClick={openSpecialty}
          extraRowActions={(record) => (
            <Button size="sm" variant="primary" onClick={() => openSpecialty(record)}>
              Открыть
              <FiArrowRight />
            </Button>
          )}
        />
      ) : null}

      {selectedFaculty && selectedDepartment && selectedSpecialty ? (
        <AdminCrudEntityPanel
          entity="student_groups"
          title={`Группы: ${getRecordName(selectedSpecialty)}`}
          description="Учебные группы выбранной специальности."
          createButtonLabel="Добавить группу"
          fields={groupFields}
          columns={groupColumns}
          filters={groupFilters}
          fixedData={groupFixedData}
          emptyMessage="У этой специальности пока нет учебных групп."
          onAfterMutation={loadRelationOptions}
        />
      ) : null}
    </div>
  )
}
