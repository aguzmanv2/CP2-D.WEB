export const ROLES = Object.freeze({
  ADMINISTRADOR: 'Administrador',
  RECEPCIONISTA: 'Recepcionista',
  MEDICO: 'Medico',
  PACIENTE: 'Paciente'
});

export const ROLE_VALUES = Object.values(ROLES);

export const ROLE_NAVIGATION = {
  [ROLES.ADMINISTRADOR]: [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Control de Usuarios', to: '/usuarios' },
    { label: 'Pacientes', to: '/pacientes' },
    { label: 'Medicos', to: '/medicos' },
    { label: 'Especialidades', to: '/especialidades' },
    { label: 'Citas', to: '/citas' },
    { label: 'Turnos', to: '/turnos' },
    { label: 'Reportes', to: '/reportes' },
    { label: 'Perfil', to: '/perfil' }
  ],
  [ROLES.RECEPCIONISTA]: [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Pacientes', to: '/pacientes' },
    { label: 'Citas', to: '/citas' },
    { label: 'Turnos', to: '/turnos' },
    { label: 'Perfil', to: '/perfil' }
  ],
  [ROLES.MEDICO]: [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Citas', to: '/citas' },
    { label: 'Turnos', to: '/turnos' },
    { label: 'Perfil', to: '/perfil' }
  ],
  [ROLES.PACIENTE]: [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Turnos', to: '/turnos' },
    { label: 'Perfil', to: '/perfil' }
  ]
};
