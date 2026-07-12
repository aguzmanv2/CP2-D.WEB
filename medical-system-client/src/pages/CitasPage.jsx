import CrudPage from '../components/crud/CrudPage.jsx';
import { Badge, Card, InfoCard, StatCard, Button } from '../components/ui/index.jsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { appointmentsMetaService, appointmentsService } from '../services/appointments.service.js';
import { formatDateTime, toDateInputValue } from '../utils/date.js';
import AppointmentPatientField from '../components/appointments/AppointmentPatientField.jsx';
import { ROLES } from '../constants/auth.js';

const appointmentStatusOptions = [
  { label: 'Todas', value: '' },
  { label: 'Pendientes', value: 'Pendiente' },
  { label: 'Confirmadas', value: 'Confirmada' },
  { label: 'Canceladas', value: 'Cancelada' },
  { label: 'Atendidas', value: 'Atendida' },
  { label: 'No asistió', value: 'No asistio' }
];

export default function CitasPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const canDeleteAppointments = role === ROLES.ADMINISTRADOR || role === ROLES.RECEPCIONISTA;

  return (
    <CrudPage
      title="Agenda de Citas"
      description="Gestión centralizada de la disponibilidad clínica y del flujo de pacientes."
      entityName="Cita"
      createLabel="Nueva Cita"
      searchPlaceholder="Buscar pacientes, médicos o citas..."
      service={appointmentsService}
      metaLoader={appointmentsMetaService.load}
      defaultFilters={{ estado: '', fecha: '' }}
      filterOptions={[
        {
          key: 'estado',
          type: 'chips',
          options: appointmentStatusOptions
        },
        {
          key: 'fecha',
          type: 'select',
          label: 'Fecha',
          inputType: 'date',
          placeholder: 'Filtrar por fecha'
        }
      ]}
      renderField={({ field, meta, register, errors, setValue, watch }) => {
        if (field.name === 'paciente') {
          return (
            <AppointmentPatientField
              field={field}
              meta={meta}
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
            />
          );
        }

        return null;
      }}
      fields={[
        {
          name: 'paciente',
          label: 'Paciente',
          type: 'lookup',
          placeholder: 'Seleccionar paciente',
          searchPlaceholder: 'Buscar por cédula, nombre o correo',
          getOptions: (meta) =>
            (meta.patients || []).map((item) => ({
              label: `${item.cedula} - ${item.nombre} ${item.apellido}`,
              value: item.id,
              searchText: `${item.cedula} ${item.nombre} ${item.apellido} ${item.correo}`
            })),
          rules: { required: 'El paciente es obligatorio' }
        },
        {
          name: 'medico',
          label: 'Médico',
          type: 'select',
          getOptions: (meta) => (meta.doctors || []).map((item) => ({ label: `${item.nombre} ${item.apellido}`, value: item.id })),
          rules: { required: 'El médico es obligatorio' }
        },
        {
          name: 'especialidad',
          label: 'Especialidad',
          type: 'select',
          getOptions: (meta) => (meta.specialties || []).map((item) => ({ label: item.nombre, value: item.id })),
          rules: { required: 'La especialidad es obligatoria' }
        },
        {
          name: 'fecha',
          label: 'Fecha',
          type: 'date',
          rules: { required: 'La fecha es obligatoria' }
        },
        {
          name: 'hora',
          label: 'Hora',
          type: 'time',
          placeholder: '09:00',
          rules: { required: 'La hora es obligatoria' }
        },
        {
          name: 'estado',
          label: 'Estado',
          type: 'select',
          options: [
            { label: 'Pendiente', value: 'Pendiente' },
            { label: 'Confirmada', value: 'Confirmada' },
            { label: 'Cancelada', value: 'Cancelada' },
            { label: 'Atendida', value: 'Atendida' },
            { label: 'No asistió', value: 'No asistio' }
          ],
          rules: { required: 'El estado es obligatorio' }
        }
      ]}
      mapItemToFormValues={(item) => ({
        paciente: item?.pacienteData?.id || item?.paciente?.id || item?.paciente || '',
        medico: item?.medicoData?.id || item?.medico?.id || item?.medico || '',
        especialidad: item?.especialidadData?.id || item?.especialidad?.id || item?.especialidad || '',
        fecha: item?.fecha ? toDateInputValue(item.fecha) : '',
        hora: item?.hora || '',
        estado: item?.estado || 'Pendiente'
      })}
      mapFormToPayload={(values) => ({
        ...values,
        fecha: values.fecha ? new Date(values.fecha).toISOString() : values.fecha
      })}
      columns={[
        {
          key: 'paciente',
          label: 'Paciente',
          render: (item) => (
            <div>
              <p className="font-semibold text-foreground">
                {item.pacienteData?.nombre} {item.pacienteData?.apellido}
              </p>
              <p className="text-xs text-muted">Cédula: {item.pacienteData?.cedula}</p>
            </div>
          )
        },
        {
          key: 'medico',
          label: 'Médico',
          render: (item) => (
            <div>
              <p className="font-medium text-foreground">
                {item.medicoData?.nombre} {item.medicoData?.apellido}
              </p>
              <p className="text-xs text-muted">{item.medicoData?.consultorio}</p>
            </div>
          )
        },
        {
          key: 'especialidad',
          label: 'Especialidad',
          render: (item) => item.especialidadData?.nombre || '-'
        },
        {
          key: 'fechaHora',
          label: 'Fecha y hora',
          render: (item) => formatDateTime(item.fecha, item.hora)
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
              {canDeleteAppointments ? (
                <Button type="button" variant="outline" size="sm" onClick={() => onDelete(item)}>
                  Eliminar
                </Button>
              ) : null}
            </div>
          ),
          align: 'right'
        }
      ]}
      sidebar={({ items, pagination, meta }) => {
        const pendingCount = items.filter((item) => item.estado === 'Pendiente').length;
        const confirmedCount = items.filter((item) => item.estado === 'Confirmada').length;

        return (
          <div className="space-y-4">
            <StatCard label="Total de citas" value={pagination.total} helper="Registros disponibles" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <StatCard label="Pendientes" value={pendingCount} />
              <StatCard label="Confirmadas" value={confirmedCount} />
            </div>
            <Card className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Recursos activos</p>
              <div className="flex flex-wrap gap-2">
                <Badge tone="primary">Pacientes: {meta.patients?.length || 0}</Badge>
                <Badge tone="secondary">Medicos: {meta.doctors?.length || 0}</Badge>
                <Badge tone="success">Especialidades: {meta.specialties?.length || 0}</Badge>
              </div>
              <p className="text-sm text-muted">
                Las citas se relacionan por ObjectId con pacientes, medicos y especialidades para mantener la trazabilidad.
              </p>
            </Card>
            <InfoCard
              title="Flujo"
              description="Las citas pasan por estados de pendiente, confirmada, cancelada, atendida o no asistio."
            />
            <Card className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Paciente no encontrado</p>
              <p className="text-sm text-muted">
                Si la cédula no aparece, puede registrar primero la cuenta del paciente para que luego pueda ingresar al sistema.
              </p>
              <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/register')}>
                Registrar paciente
              </Button>
            </Card>
          </div>
        );
      }}
    />
  );
}
