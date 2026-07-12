import CrudPage from '../components/crud/CrudPage.jsx';
import { Badge, Card, InfoCard, StatCard, Button } from '../components/ui/index.jsx';
import PatientCedulaField from '../components/patients/PatientCedulaField.jsx';
import { patientsService } from '../services/patients.service.js';
import { formatDate } from '../utils/date.js';

const patientStatusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Activos', value: 'Activo' },
  { label: 'Inactivos', value: 'Inactivo' }
];

export default function PacientesPage() {
  return (
    <CrudPage
      title="Gestión de Pacientes"
      description="Administre el directorio central de pacientes y su historial clínico."
      entityName="Paciente"
      createLabel="Nuevo Paciente"
      searchPlaceholder="Buscar pacientes, expedientes..."
      service={patientsService}
      defaultFilters={{ estado: '' }}
      filterOptions={[
        {
          key: 'estado',
          type: 'chips',
          options: patientStatusOptions
        }
      ]}
      renderField={({ field, meta, register, errors, setValue, watch, selectedItem }) => {
        if (field.name === 'cedula') {
          return (
            <PatientCedulaField
              field={field}
              meta={meta}
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
              selectedItem={selectedItem}
            />
          );
        }

        return null;
      }}
      fields={[
        {
          name: 'cedula',
          label: 'Cédula',
          placeholder: '0-0000-0000',
          rules: { required: 'La cédula es obligatoria' }
        },
        {
          name: 'nombre',
          label: 'Nombre',
          placeholder: 'Ej. Juan',
          rules: { required: 'El nombre es obligatorio' }
        },
        {
          name: 'apellido',
          label: 'Apellido',
          placeholder: 'Ej. Pérez',
          rules: { required: 'El apellido es obligatorio' }
        },
        {
          name: 'correo',
          label: 'Correo electrónico',
          type: 'email',
          placeholder: 'paciente@ejemplo.com',
          rules: {
            required: 'El correo es obligatorio',
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: 'Ingrese un correo valido'
            }
          }
        },
        {
          name: 'telefono',
          label: 'Teléfono',
          placeholder: '+506 0000-0000',
          rules: { required: 'El teléfono es obligatorio' }
        },
        {
          name: 'fechaNacimiento',
          label: 'Fecha de nacimiento',
          type: 'date',
          rules: { required: 'La fecha de nacimiento es obligatoria' }
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
          name: 'direccion',
          label: 'Dirección',
          type: 'textarea',
          placeholder: 'Provincia, cantón, distrito y otras señas...',
          fullWidth: true,
          rules: { required: 'La dirección es obligatoria' }
        }
      ]}
      mapItemToFormValues={(item) => ({
        cedula: item?.cedula || '',
        nombre: item?.nombre || '',
        apellido: item?.apellido || '',
        correo: item?.correo || '',
        telefono: item?.telefono || '',
        direccion: item?.direccion || '',
        fechaNacimiento: item?.fechaNacimiento ? new Date(item.fechaNacimiento).toISOString().slice(0, 10) : '',
        estado: item?.estado || 'Activo'
      })}
      mapFormToPayload={(values) => ({
        ...values,
        fechaNacimiento: values.fechaNacimiento ? new Date(values.fechaNacimiento).toISOString() : ''
      })}
      columns={[
        {
          key: 'cedula',
          label: 'Cédula',
          render: (item) => item.cedula
        },
        {
          key: 'nombre',
          label: 'Nombre',
          render: (item) => (
            <div>
              <p className="font-semibold text-foreground">{`${item.nombre} ${item.apellido}`}</p>
              <p className="text-xs text-muted">Nacido: {formatDate(item.fechaNacimiento)}</p>
            </div>
          )
        },
        {
          key: 'telefono',
          label: 'Teléfono',
          render: (item) => item.telefono
        },
        {
          key: 'correo',
          label: 'Correo',
          render: (item) => item.correo
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
          render: (item, meta) => (
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => meta.onEdit?.(item)}>
                Editar
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => meta.onDelete?.(item)}>
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
            <StatCard label="Total de pacientes" value={pagination.total} helper="Registros almacenados en el sistema" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <StatCard label="Activos" value={activeCount} />
              <StatCard label="Inactivos" value={inactiveCount} />
            </div>
            <Card className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Acciones rapidas</p>
              <p className="text-sm text-muted">Use el formulario para registrar nuevos pacientes y mantenga la informacion siempre actualizada.</p>
            </Card>
            <InfoCard
              title="Consejo"
              description="Utilice la barra de busqueda y el filtro por estado para ubicar pacientes rapidamente."
            />
          </div>
        );
      }}
    />
  );
}
