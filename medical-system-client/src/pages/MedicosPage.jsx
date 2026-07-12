import CrudPage from '../components/crud/CrudPage.jsx';
import { Badge, Card, InfoCard, StatCard, Button } from '../components/ui/index.jsx';
import { doctorsService } from '../services/doctors.service.js';
import { specialtiesService } from '../services/specialties.service.js';

const doctorStatusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Activos', value: 'Activo' },
  { label: 'Inactivos', value: 'Inactivo' },
  { label: 'De licencia', value: 'De licencia' }
];

export default function MedicosPage() {
  return (
    <CrudPage
      title="Gestión de Médicos"
      description="Directorio de profesionales y control de disponibilidad clínica."
      entityName="Médico"
      createLabel="Nuevo Médico"
      searchPlaceholder="Buscar médicos, consultorios..."
      service={doctorsService}
      metaLoader={async () => {
        const specialties = await specialtiesService.list({ limit: 200, estado: 'Activo' });
        return {
          specialties: specialties.items || []
        };
      }}
      defaultFilters={{ estado: '', especialidad: '' }}
      filterOptions={[
        {
          key: 'estado',
          type: 'chips',
          options: doctorStatusOptions
        },
        {
          key: 'especialidad',
          type: 'select',
          label: 'Especialidad',
          placeholder: 'Todas las especialidades',
          getOptions: (meta) => (meta.specialties || []).map((item) => ({ label: item.nombre, value: item.id }))
        }
      ]}
      fields={[
        {
          name: 'nombre',
          label: 'Nombre',
          placeholder: 'Ej. Alejandro',
          rules: { required: 'El nombre es obligatorio' }
        },
        {
          name: 'apellido',
          label: 'Apellido',
          placeholder: 'Ej. Méndez',
          rules: { required: 'El apellido es obligatorio' }
        },
        {
          name: 'especialidad',
          label: 'Especialidad',
          type: 'select',
          getOptions: (meta) => (meta.specialties || []).map((item) => ({ label: item.nombre, value: item.id })),
          rules: { required: 'La especialidad es obligatoria' }
        },
        {
          name: 'consultorio',
          label: 'Consultorio',
          placeholder: 'A-102',
          rules: { required: 'El consultorio es obligatorio' }
        },
        {
          name: 'tiempoPromedioConsulta',
          label: 'Tiempo promedio (min)',
          type: 'number',
          placeholder: '20',
          rules: { required: 'El tiempo promedio es obligatorio', min: { value: 5, message: 'Debe ser al menos 5' } }
        },
        {
          name: 'estado',
          label: 'Estado operativo',
          type: 'select',
          options: [
            { label: 'Activo', value: 'Activo' },
            { label: 'Inactivo', value: 'Inactivo' },
            { label: 'De licencia', value: 'De licencia' }
          ],
          rules: { required: 'El estado es obligatorio' }
        }
      ]}
      mapItemToFormValues={(item) => ({
        nombre: item?.nombre || '',
        apellido: item?.apellido || '',
        especialidad: item?.especialidad?.id || item?.especialidad || '',
        consultorio: item?.consultorio || '',
        tiempoPromedioConsulta: item?.tiempoPromedioConsulta || '',
        estado: item?.estado || 'Activo'
      })}
      mapFormToPayload={(values) => ({
        ...values,
        tiempoPromedioConsulta: Number(values.tiempoPromedioConsulta)
      })}
      columns={[
        {
          key: 'nombre',
          label: 'Nombre',
          render: (item) => (
            <div>
              <p className="font-semibold text-foreground">{`${item.nombre} ${item.apellido}`}</p>
              <p className="text-xs text-muted">ID: {item.id}</p>
            </div>
          )
        },
        {
          key: 'especialidad',
          label: 'Especialidad',
          render: (item) => item.especialidad?.nombre || 'Sin especialidad'
        },
        {
          key: 'consultorio',
          label: 'Consultorio',
          render: (item) => item.consultorio
        },
        {
          key: 'tiempoPromedioConsulta',
          label: 'T. Promedio',
          render: (item) => `${item.tiempoPromedioConsulta} min`
        },
        {
          key: 'estado',
          label: 'Estado',
          type: 'badge',
          render: (item) => item.estado
        },
        {
          key: 'acciones',
          label: 'Acciones',
          render: (item, { onEdit, onDelete }) => (
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onEdit(item)}>
                Editar
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => onDelete(item)}>
                Eliminar
              </Button>
            </div>
          ),
          align: 'right'
        }
      ]}
      sidebar={({ items, pagination, meta }) => {
        const activeCount = items.filter((item) => item.estado === 'Activo').length;
        const licenseCount = items.filter((item) => item.estado === 'De licencia').length;

        return (
          <div className="space-y-4">
            <StatCard label="Total médicos" value={pagination.total} helper="Profesionales registrados" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <StatCard label="Activos" value={activeCount} />
              <StatCard label="De licencia" value={licenseCount} />
            </div>
            <Card className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Especialidades activas</p>
              <p className="text-3xl font-bold text-foreground">{meta.specialties?.length || 0}</p>
              <p className="text-sm text-muted">Asigne especialidades activas para mantener consistente el agendamiento de citas.</p>
            </Card>
            <InfoCard
              title="Consejo"
              description="Mantenga consultorios y tiempos promedio coherentes con la operativa real de la clínica."
            />
          </div>
        );
      }}
    />
  );
}
