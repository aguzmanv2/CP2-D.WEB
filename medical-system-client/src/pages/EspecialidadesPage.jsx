import CrudPage from '../components/crud/CrudPage.jsx';
import { Badge, Card, InfoCard, StatCard, Button } from '../components/ui/index.jsx';
import { specialtiesService } from '../services/specialties.service.js';

const specialtyStatusOptions = [
  { label: 'Todas', value: '' },
  { label: 'Activas', value: 'Activo' },
  { label: 'Inactivas', value: 'Inactivo' }
];

export default function EspecialidadesPage() {
  return (
    <CrudPage
      title="Gestión de Especialidades"
      description="Defina y mantenga las especialidades clínicas disponibles para el sistema."
      entityName="Especialidad"
      createLabel="Nueva Especialidad"
      searchPlaceholder="Buscar especialidades..."
      service={specialtiesService}
      defaultFilters={{ estado: '' }}
      filterOptions={[
        {
          key: 'estado',
          type: 'chips',
          options: specialtyStatusOptions
        }
      ]}
      fields={[
        {
          name: 'nombre',
          label: 'Nombre',
          placeholder: 'Ej. Cardiología',
          rules: { required: 'El nombre es obligatorio' }
        },
        {
          name: 'estado',
          label: 'Estado',
          type: 'select',
          options: [
            { label: 'Activo', value: 'Activo' },
            { label: 'Inactivo', value: 'Inactivo' }
          ],
          rules: { required: 'El estado es obligatorio' }
        },
        {
          name: 'descripcion',
          label: 'Descripción',
          type: 'textarea',
          placeholder: 'Describa el alcance clínico de la especialidad...',
          fullWidth: true,
          rules: { required: 'La descripción es obligatoria' }
        }
      ]}
      mapItemToFormValues={(item) => ({
        nombre: item?.nombre || '',
        descripcion: item?.descripcion || '',
        estado: item?.estado || 'Activo'
      })}
      columns={[
        {
          key: 'nombre',
          label: 'Nombre',
          render: (item) => item.nombre
        },
        {
          key: 'descripcion',
          label: 'Descripción',
          render: (item) => item.descripcion
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
      sidebar={({ items, pagination }) => {
        const activeCount = items.filter((item) => item.estado === 'Activo').length;
        const inactiveCount = items.filter((item) => item.estado === 'Inactivo').length;

        return (
          <div className="space-y-4">
            <StatCard label="Total" value={pagination.total} helper="Especialidades registradas" />
            <Card className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Estado actual</p>
              <div className="flex flex-wrap gap-2">
                <Badge tone="primary">Activas: {activeCount}</Badge>
                <Badge tone="secondary">Inactivas: {inactiveCount}</Badge>
              </div>
              <p className="text-sm text-muted">
                Mantenga nombres breves y descripciones claras para facilitar la asignacion de medicos y citas.
              </p>
            </Card>
            <InfoCard
              title="Consejo"
              description="Agrupe las especialidades por area clinica para mantener la navegacion simple y consistente."
            />
          </div>
        );
      }}
    />
  );
}
