import CrudPage from '../components/crud/CrudPage.jsx';
import { Badge, Button, Card, InfoCard, StatCard } from '../components/ui/index.jsx';
import { ROLES } from '../constants/auth.js';
import { usersService } from '../services/users.service.js';

const roleOptions = [
  { label: 'Administrador', value: ROLES.ADMINISTRADOR },
  { label: 'Recepcionista', value: ROLES.RECEPCIONISTA },
  { label: 'Medico', value: ROLES.MEDICO },
  { label: 'Paciente', value: ROLES.PACIENTE }
];

const userStatusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Activos', value: 'Activo' },
  { label: 'Inactivos', value: 'Inactivo' }
];

const roleToneMap = {
  [ROLES.ADMINISTRADOR]: 'primary',
  [ROLES.RECEPCIONISTA]: 'secondary',
  [ROLES.MEDICO]: 'success',
  [ROLES.PACIENTE]: 'warning'
};

export default function ControlUsuariosPage() {
  return (
    <CrudPage
      title="Control de Usuarios"
      description="Listado centralizado de usuarios registrados y asignacion de roles para administracion interna."
      entityName="Usuario"
      createLabel="Nuevo Usuario"
      allowCreate={false}
      allowDelete={false}
      searchPlaceholder="Buscar por cedula, nombre, correo o rol..."
      service={usersService}
      defaultFilters={{ rol: '', estado: '' }}
      filterOptions={[
        {
          key: 'rol',
          type: 'select',
          label: 'Rol',
          placeholder: 'Todos los roles',
          getOptions: () => roleOptions
        },
        {
          key: 'estado',
          type: 'chips',
          options: userStatusOptions
        }
      ]}
      fields={[
        {
          name: 'rol',
          label: 'Rol',
          type: 'select',
          getOptions: () => roleOptions,
          rules: { required: 'El rol es obligatorio' }
        }
      ]}
      mapItemToFormValues={(item) => ({
        rol: item?.rol || ROLES.PACIENTE
      })}
      mapFormToPayload={(values) => ({
        rol: values.rol
      })}
      columns={[
        {
          key: 'cedula',
          label: 'Cedula',
          render: (item) => item.cedula
        },
        {
          key: 'nombre',
          label: 'Nombre',
          render: (item) => (
            <div>
              <p className="font-semibold text-foreground">{`${item.nombre} ${item.apellido}`}</p>
              <p className="text-xs text-muted">{item.correo}</p>
            </div>
          )
        },
        {
          key: 'rol',
          label: 'Rol',
          type: 'badge',
          render: (item) => item.rol
        },
        {
          key: 'estado',
          label: 'Estado',
          type: 'badge',
          render: (item) => (item.estado ? 'Activo' : 'Inactivo')
        },
        {
          key: 'createdAt',
          label: 'Registro',
          render: (item) => (item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-CR') : '-')
        },
        {
          key: 'acciones',
          label: 'Acciones',
          align: 'right',
          render: (item, { onEdit }) => (
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(item)}
              >
                Asignar rol
              </Button>
            </div>
          )
        }
      ]}
      statusToneMap={{
        Activo: 'success',
        Inactivo: 'secondary',
        [ROLES.ADMINISTRADOR]: roleToneMap[ROLES.ADMINISTRADOR],
        [ROLES.RECEPCIONISTA]: roleToneMap[ROLES.RECEPCIONISTA],
        [ROLES.MEDICO]: roleToneMap[ROLES.MEDICO],
        [ROLES.PACIENTE]: roleToneMap[ROLES.PACIENTE]
      }}
      sidebar={({ items, pagination }) => {
        const totalsByRole = roleOptions.map((option) => ({
          label: option.label,
          value: items.filter((item) => item.rol === option.value).length
        }));

        return (
          <div className="space-y-4">
            <StatCard label="Total usuarios" value={pagination.total} helper="Usuarios registrados en el sistema" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              {totalsByRole.map((item) => (
                <StatCard key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
            <Card className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Alcance</p>
              <p className="text-sm text-muted">
                Este modulo permite administrar roles sin tocar credenciales ni la autenticacion existente.
              </p>
              <div className="flex flex-wrap gap-2">
                {roleOptions.map((option) => (
                  <Badge key={option.value} tone={roleToneMap[option.value] || 'secondary'}>
                    {option.label}
                  </Badge>
                ))}
              </div>
            </Card>
            <InfoCard
              title="Sugerencia"
              description="Use este panel para reasignar roles a usuarios ya registrados y mantener control de acceso centralizado."
            />
          </div>
        );
      }}
    />
  );
}
