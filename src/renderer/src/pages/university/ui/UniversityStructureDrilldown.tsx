import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
import { Button } from '../../../shared/ui'
import {
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
  const [selectedSpecialty, setSelectedSpecialty] = useState<AdminCrudRecord | null>(null)

  const [teacherOptions, setTeacherOptions] = useState<AdminCrudSelectOption[]>([])
  const [academicYearOptions, setAcademicYearOptions] = useState<AdminCrudSelectOption[]>([])

  const loadRelationOptions = useCallback(async () => {
    const [teachers, academicYears] = await Promise.all([
      window.api.adminCrud.list({
        entity: 'teachers',
        page: 1,
        pageSize: 500,
        orderBy: 'last_name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'academic_years',
        page: 1,
        pageSize: 500,
        orderBy: 'starts_at',
        orderDirection: 'desc'
      })
    ])

    setTeacherOptions(createOptions(teachers.items, getPersonName))
    setAcademicYearOptions(createOptions(academicYears.items, getRecordName))
  }, [])

  useEffect(() => {
    void loadRelationOptions()
  }, [loadRelationOptions])

  const teacherNameById = useMemo(() => createOptionsMap(teacherOptions), [teacherOptions])
  const academicYearNameById = useMemo(
    () => createOptionsMap(academicYearOptions),
    [academicYearOptions]
  )

  const facultyFields = useMemo(() => createFacultyFields(), [])
  const facultyColumns = useMemo(() => createFacultyColumns(teacherNameById), [teacherNameById])

  const groupFields = useMemo(() => createGroupFields(academicYearOptions), [academicYearOptions])
  const groupColumns = useMemo(
    () => createGroupColumns(teacherNameById, academicYearNameById),
    [academicYearNameById, teacherNameById]
  )

  const specialtyFilters = useMemo(
    () => (selectedFaculty ? { faculty_id: Number(selectedFaculty.id) } : undefined),
    [selectedFaculty]
  )

  const specialtyFixedData = useMemo(
    () => (selectedFaculty ? { faculty_id: Number(selectedFaculty.id) } : undefined),
    [selectedFaculty]
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
    setSelectedSpecialty(null)
  }

  function openSpecialty(record: AdminCrudRecord) {
    setSelectedSpecialty(record)
  }

  function backToFaculties() {
    setSelectedFaculty(null)
    setSelectedSpecialty(null)
  }

  function backToSpecialties() {
    setSelectedSpecialty(null)
  }

  return (
    <div className="grid gap-4">
      <StructureBreadcrumb
        faculty={selectedFaculty}
        specialty={selectedSpecialty}
        onFacultiesClick={backToFaculties}
        onSpecialtiesClick={selectedFaculty ? backToSpecialties : undefined}
      />

      {!selectedFaculty ? (
        <AdminCrudEntityPanel
          entity="faculties"
          title="Факультеты"
          description="Выбери факультет, чтобы перейти к его специальностям. Можно кликнуть по строке или нажать «Открыть»."
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

      {selectedFaculty && !selectedSpecialty ? (
        <AdminCrudEntityPanel
          entity="specialties"
          title={`Специальности: ${getRecordName(selectedFaculty)}`}
          description="Специальности выбранного факультета. Клик по специальности откроет список групп."
          createButtonLabel="Добавить специальность"
          fields={specialtyFields}
          columns={specialtyColumns}
          filters={specialtyFilters}
          fixedData={specialtyFixedData}
          emptyMessage="У этого факультета пока нет специальностей."
          onRowClick={openSpecialty}
          extraRowActions={(record) => (
            <Button size="sm" variant="primary" onClick={() => openSpecialty(record)}>
              Открыть
              <FiArrowRight />
            </Button>
          )}
        />
      ) : null}

      {selectedFaculty && selectedSpecialty ? (
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
