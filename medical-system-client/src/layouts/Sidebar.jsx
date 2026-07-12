import { CalendarDays, ClipboardList, LayoutDashboard, LogOut, Stethoscope, Users, UserCircle2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { ROLE_NAVIGATION, ROLES } from '../constants/auth.js';
import { classNames } from '../utils/classNames.js';

const ICONS = {
  Dashboard: LayoutDashboard,
  Pacientes: Users,
  Medicos: Stethoscope,
  Especialidades: ClipboardList,
  Citas: CalendarDays,
  Turnos: CalendarDays,
  Reportes: ClipboardList,
  Perfil: UserCircle2
};

export default function Sidebar({ className }) {
  const { role, logout } = useAuth();
  const navItems = ROLE_NAVIGATION[role] || ROLE_NAVIGATION[ROLES.PACIENTE];

  return (
    <aside className={classNames('app-sidebar', className)}>
      <div className="app-sidebar__brand">
        <p className="app-sidebar__brand-name">Medical System</p>
        <p className="app-sidebar__brand-subtitle">Panel de {role || 'usuario'}</p>
      </div>
      <nav className="app-sidebar__nav">
        <ul className="app-sidebar__list">
          {navItems.map((item) => {
            const Icon = ICONS[item.label] || LayoutDashboard;

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    classNames(
                      'app-sidebar__link',
                      isActive ? 'app-sidebar__link--active' : ''
                    )
                  }
                >
                  <Icon className="icon-sm" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="app-sidebar__footer">
        <button
          type="button"
          className="app-sidebar__logout"
          onClick={() => logout({ redirect: true })}
        >
          <LogOut className="icon-sm" />
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}
