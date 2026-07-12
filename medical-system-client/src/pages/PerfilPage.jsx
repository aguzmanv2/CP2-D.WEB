import { useMemo } from 'react';
import { Badge, Button, Card, StatCard } from '../components/ui/index.jsx';
import PageContainer from '../components/common/PageContainer.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function PerfilPage() {
  const { user, role, logout } = useAuth();

  const profileItems = useMemo(
    () => [
      { label: 'Cédula', value: user?.cedula || '-' },
      { label: 'Nombre', value: `${user?.nombre || '-'} ${user?.apellido || ''}`.trim() },
      { label: 'Correo', value: user?.correo || '-' },
      { label: 'Rol', value: role || '-' },
      { label: 'Estado', value: user?.estado ? 'Activo' : 'Inactivo' }
    ],
    [role, user]
  );

  return (
    <PageContainer className="space-y-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Perfil</h1>
        <p className="max-w-3xl text-sm text-muted sm:text-base">
          Datos básicos de tu cuenta y acceso al sistema.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {profileItems.map((item) => (
              <StatCard key={item.label} label={item.label} value={item.value} />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-3 border-dashed">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Acceso</p>
              <p className="text-sm text-muted">
                Este perfil muestra la información autenticada que el sistema usa para identificar tu sesión.
              </p>
              <Badge tone="primary">{role || 'Sin rol'}</Badge>
            </Card>

            <Card className="space-y-3 border-dashed">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Usuario</p>
              <p className="text-sm text-muted">
                {user ? 'Tu sesión está activa y puedes navegar por los módulos permitidos.' : 'No hay sesión activa.'}
              </p>
              <Badge tone={user?.estado ? 'success' : 'secondary'}>{user?.estado ? 'Activo' : 'Inactivo'}</Badge>
            </Card>
          </div>
        </Card>

        <Card className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Acciones</p>
          <p className="text-sm text-muted">
            Desde aquí puedes cerrar sesión cuando termines tu trabajo.
          </p>
          <Button type="button" className="w-full" onClick={() => logout({ redirect: true })}>
            Cerrar sesión
          </Button>
        </Card>
      </div>
    </PageContainer>
  );
}
