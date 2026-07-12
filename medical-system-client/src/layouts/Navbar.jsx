import { Bell, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, Dropdown } from '../components/ui/index.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { classNames } from '../utils/classNames.js';

export default function Navbar({ className }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className={classNames('app-topbar', className)}>
      <div className="app-topbar__left">
        <Button type="button" variant="ghost" size="sm" className="app-topbar__menu-button">
          <Menu className="icon-sm" />
        </Button>
        <div className="app-topbar__brand">
          <p className="app-topbar__brand-name">Medical System</p>
          <p className="app-topbar__brand-subtitle">Gestion de citas y turnos en tiempo real</p>
        </div>
      </div>

      <div className="app-topbar__actions">
        <Button type="button" variant="ghost" size="sm">
          <Bell className="icon-sm" />
        </Button>
        <Badge tone="secondary">{role || 'Sin rol'}</Badge>
        <Dropdown
          trigger={
            <div className="app-user-chip">
              <Avatar name={user?.nombre || 'U'} />
              <div className="app-user-chip__meta">
                <p className="app-user-chip__name">{user ? `${user.nombre} ${user.apellido}` : 'Usuario'}</p>
                <p className="app-user-chip__id">{user?.cedula || user?.correo || 'Sesion activa'}</p>
              </div>
            </div>
          }
        >
          <button type="button" className="app-dropdown__item" onClick={() => navigate('/perfil')}>
            Perfil
          </button>
          <button type="button" className="app-dropdown__item" onClick={() => logout({ redirect: true })}>
            Cerrar sesion
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
