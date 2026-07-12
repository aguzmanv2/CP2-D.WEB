import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarClock,
  CalendarDays,
  Filter as FilterIcon,
  Stethoscope,
  Users
} from 'lucide-react';
import PageContainer from '../components/common/PageContainer.jsx';
import {
  Alert,
  Badge,
  Button,
  Card,
  Filter,
  InfoCard,
  Input,
  SearchBar,
  Select,
  StatCard,
  Table,
  TurnCard
} from '../components/ui/index.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useSocket } from '../hooks/useSocket.js';
import { useToast } from '../hooks/useToast.js';
import { appointmentsService } from '../services/appointments.service.js';
import { doctorsService } from '../services/doctors.service.js';
import { patientsService } from '../services/patients.service.js';
import { specialtiesService } from '../services/specialties.service.js';
import { turnosService } from '../services/turnos.service.js';
import { formatDate, formatDateTime } from '../utils/date.js';
import { getApiErrorMessage } from '../utils/errors.js';
import { ROLES } from '../constants/auth.js';

const statusTone = {
  Esperando: 'warning',
  'En Atencion': 'primary',
  Finalizado: 'success',
  Pendiente: 'warning',
  Confirmada: 'primary',
  Cancelada: 'error',
  Atendida: 'success',
  'No asistio': 'secondary'
};

const getItemId = (item) => item?.id || item?._id || '';
const todayKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
const average = (values) => {
  const list = values.filter((value) => Number.isFinite(Number(value)));
  if (list.length === 0) return 0;
  return Math.round(list.reduce((sum, value) => sum + Number(value), 0) / list.length);
};

function DashboardTitle({ title, description, right }) {
  return (
    <div className="dashboard-title">
      <div className="dashboard-title__content">
        <h1 className="ui-page-title">{title}</h1>
        {description ? <p className="ui-page-description">{description}</p> : null}
      </div>
      {right ? <div className="dashboard-title__right">{right}</div> : null}
    </div>
  );
}

const MetricStrip = memo(function MetricStrip({ items }) {
  return (
    <div className="dashboard-metric-grid">
      {items.map((item) => (
        <StatCard key={item.label} label={item.label} value={item.value} helper={item.helper} />
      ))}
    </div>
  );
});

const TurnTable = memo(function TurnTable({ turns, emptyMessage, actionLabel, onAction, actionDisabled }) {
  return (
    <Table>
      <div className="overflow-x-auto">
        <table className="dashboard-table">
          <thead className="dashboard-table__head">
            <tr>
              <th className="dashboard-table__head-cell">Turno</th>
              <th className="dashboard-table__head-cell">Paciente</th>
              <th className="dashboard-table__head-cell">Hora llegada</th>
              <th className="dashboard-table__head-cell">Estado</th>
              <th className="dashboard-table__head-cell">Tiempo estimado</th>
              {onAction ? <th className="dashboard-table__head-cell dashboard-table__head-cell--right">Accion</th> : null}
            </tr>
          </thead>
          <tbody>
            {turns.length === 0 ? (
              <tr>
                <td colSpan={onAction ? 6 : 5} className="dashboard-table__empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              turns.map((turn) => (
                <tr key={getItemId(turn)} className="dashboard-table__row">
                  <td className="dashboard-table__cell dashboard-table__cell--strong">{turn.numeroTurno}</td>
                  <td className="dashboard-table__cell">
                    <div>
                      <p className="font-semibold">
                        {turn.paciente?.nombre} {turn.paciente?.apellido}
                      </p>
                      <p className="dashboard-table__meta">{turn.especialidad?.nombre || turn.medico?.consultorio || '-'}</p>
                    </div>
                  </td>
                  <td className="dashboard-table__cell dashboard-table__cell--muted">{turn.horaLlegada ? formatDateTime(turn.horaLlegada) : '-'}</td>
                  <td className="dashboard-table__cell">
                    <Badge tone={statusTone[turn.estado] || 'primary'}>{turn.estado}</Badge>
                  </td>
                  <td className="dashboard-table__cell dashboard-table__cell--muted">{turn.tiempoEstimado ? `${turn.tiempoEstimado} min` : '-'}</td>
                  {onAction ? (
                    <td className="dashboard-table__cell dashboard-table__cell--right">
                      <Button
                        type="button"
                        size="sm"
                        disabled={actionDisabled ? actionDisabled(turn) : false}
                        onClick={() => onAction(turn)}
                      >
                        {actionLabel}
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Table>
  );
});

const AppointmentList = memo(function AppointmentList({ appointments, emptyMessage, onSelect, selectedId }) {
  return (
    <div className="dashboard-list">
      {appointments.length === 0 ? (
        <Alert type="info" title="Sin citas" description={emptyMessage} />
      ) : (
        appointments.map((item) => {
          const id = getItemId(item);

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect?.(item)}
            className={`dashboard-list__item ${selectedId === id ? 'dashboard-list__item--active' : ''}`}
            >
              <div className="dashboard-list__content">
                <p className="dashboard-list__title">
                  {item.pacienteData?.nombre} {item.pacienteData?.apellido}
                </p>
                <p className="dashboard-list__meta">
                  {formatDate(item.fecha)} - {item.hora}
                </p>
                <p className="dashboard-list__meta">
                  {item.medicoData?.nombre} {item.medicoData?.apellido} | {item.especialidadData?.nombre}
                </p>
              </div>
              <Badge tone={statusTone[item.estado] || 'primary'}>{item.estado}</Badge>
            </button>
          );
        })
      )}
    </div>
  );
});

const HistoryTable = memo(function HistoryTable({ items, emptyMessage }) {
  return (
    <Table>
      <div className="overflow-x-auto">
        <table className="dashboard-table">
          <thead className="dashboard-table__head">
            <tr>
              <th className="dashboard-table__head-cell">Fecha</th>
              <th className="dashboard-table__head-cell">Turno</th>
              <th className="dashboard-table__head-cell">Paciente</th>
              <th className="dashboard-table__head-cell">Medico</th>
              <th className="dashboard-table__head-cell">Estado</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="dashboard-table__empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={getItemId(item)} className="dashboard-table__row">
                  <td className="dashboard-table__cell dashboard-table__cell--muted">{formatDateTime(item.createdAt || item.fecha)}</td>
                  <td className="dashboard-table__cell dashboard-table__cell--strong">{item.numeroTurno}</td>
                  <td className="dashboard-table__cell">
                    {item.paciente?.nombre} {item.paciente?.apellido}
                  </td>
                  <td className="dashboard-table__cell dashboard-table__cell--muted">
                    {item.medico?.nombre} {item.medico?.apellido}
                  </td>
                  <td className="dashboard-table__cell">
                    <Badge tone={statusTone[item.estado] || 'primary'}>{item.estado}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Table>
  );
});

function SummaryCard({ icon: Icon, label, value, helper, accent = 'primary' }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="dashboard-summary">
        <div>
          <p className="dashboard-summary__label">{label}</p>
          <p className="dashboard-summary__value">{value}</p>
          {helper ? <p className="dashboard-summary__helper">{helper}</p> : null}
        </div>
        <div className={`dashboard-summary__icon ${accent === 'primary' ? 'dashboard-summary__icon--primary' : accent === 'success' ? 'dashboard-summary__icon--success' : 'dashboard-summary__icon--warning'}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function formatAverageMinutes(value) {
  return value ? `${value} min` : '0 min';
}

export default function DashboardPage() {
  const { user, role } = useAuth();
  const { socket, connected } = useSocket();
  const { error: showError, success } = useToast();
  const isAdmin = role === ROLES.ADMINISTRADOR;
  const isReceptionist = role === ROLES.RECEPCIONISTA;
  const isDoctor = role === ROLES.MEDICO;
  const isPatient = role === ROLES.PACIENTE;
  const isAdministrative = isAdmin || isReceptionist;

  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [nextTurn, setNextTurn] = useState(null);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [pendingAppointmentId, setPendingAppointmentId] = useState('');
  const [receiptActionBusy, setReceiptActionBusy] = useState(false);
  const [rescheduleFormOpen, setRescheduleFormOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [dashboardSearch, setDashboardSearch] = useState('');
  const realtimeRef = useRef({});
  const initialSyncRef = useRef(false);

  const selectedSpecialty = useMemo(
    () => specialties.find((item) => getItemId(item) === selectedSpecialtyId) || null,
    [specialties, selectedSpecialtyId]
  );

  const selectedDoctor = useMemo(
    () => doctors.find((item) => getItemId(item) === selectedDoctorId) || null,
    [doctors, selectedDoctorId]
  );

  const selectedAppointment = useMemo(
    () => appointments.find((item) => getItemId(item) === pendingAppointmentId) || null,
    [appointments, pendingAppointmentId]
  );

  const metrics = useMemo(() => {
    const waitingTurns = queue.filter((turn) => turn.estado === 'Esperando');
    const attendedToday = history.filter((turn) => turn.estado === 'Finalizado');
    const pendingAppointments = appointments.filter((appointment) => appointment.estado === 'Pendiente');
    const avgWait = average(history.map((item) => item.tiempoTotalEspera));
    const avgConsult = average(history.map((item) => item.tiempoTotalConsulta));

    return {
      waitingTurns,
      attendedToday,
      pendingAppointments,
      avgWait,
      avgConsult
    };
  }, [appointments, history, queue]);

  const visibleQueue = useMemo(() => {
    const term = dashboardSearch.trim().toLowerCase();
    if (!term) return queue;

    return queue.filter((turn) => {
      const haystack = [
        turn.numeroTurno,
        turn.estado,
        turn.paciente?.nombre,
        turn.paciente?.apellido,
        turn.paciente?.cedula,
        turn.medico?.nombre,
        turn.medico?.apellido,
        turn.especialidad?.nombre
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [dashboardSearch, queue]);

  const visibleAppointments = useMemo(() => {
    const term = dashboardSearch.trim().toLowerCase();
    if (!term) return appointments;

    return appointments.filter((appointment) => {
      const haystack = [
        appointment.estado,
        appointment.hora,
        appointment.pacienteData?.nombre,
        appointment.pacienteData?.apellido,
        appointment.pacienteData?.cedula,
        appointment.pacienteData?.correo,
        appointment.medicoData?.nombre,
        appointment.medicoData?.apellido,
        appointment.especialidadData?.nombre
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [appointments, dashboardSearch]);

  const visiblePendingAppointments = useMemo(() => {
    const term = dashboardSearch.trim().toLowerCase();
    const base = metrics.pendingAppointments;
    if (!term) return base;

    return base.filter((appointment) => {
      const haystack = [
        appointment.estado,
        appointment.hora,
        appointment.pacienteData?.nombre,
        appointment.pacienteData?.apellido,
        appointment.pacienteData?.cedula,
        appointment.pacienteData?.correo,
        appointment.medicoData?.nombre,
        appointment.medicoData?.apellido,
        appointment.especialidadData?.nombre
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [dashboardSearch, metrics.pendingAppointments]);

  const loadDoctorProfile = async () => {
    if (!user?.nombre || !user?.apellido) return null;

    const response = await doctorsService.list({ page: 1, limit: 50, search: `${user.nombre} ${user.apellido}`, estado: 'Activo' });
    const items = response.items || [];
    return items.find((doctor) => doctor.nombre?.toLowerCase() === user.nombre?.toLowerCase() && doctor.apellido?.toLowerCase() === user.apellido?.toLowerCase()) || items[0] || null;
  };

  const loadPatientProfile = async () => {
    if (!user?.cedula && !user?.correo) return null;

    const searchValue = user?.cedula || user?.correo;
    const response = await patientsService.list({ page: 1, limit: 50, search: searchValue, estado: 'Activo' });
    const items = response.items || [];
    return (
      items.find(
        (patient) =>
          patient.cedula?.toLowerCase() === user?.cedula?.toLowerCase() ||
          patient.correo?.toLowerCase() === user?.correo?.toLowerCase()
      ) || items[0] || null
    );
  };

  const loadAdminData = async ({ specialtyId = selectedSpecialtyId, doctorId = selectedDoctorId } = {}) => {
    if (!specialtyId || !doctorId) {
      setCurrentTurn(null);
      setNextTurn(null);
      setQueue([]);
      setHistory([]);
      setAppointments([]);
      return;
    }

    setLoading(true);
    try {
      const today = todayKey();
      const [currentResponse, nextResponse, queueResponse, historyResponse, appointmentsResponse] = await Promise.all([
        turnosService.current({ medico: doctorId }),
        turnosService.next({ medico: doctorId }),
        turnosService.queue({ medico: doctorId, fecha: today }),
        turnosService.history({ medico: doctorId, fecha: today, page: 1, limit: 100 }),
        appointmentsService.list({ medico: doctorId, especialidad: specialtyId, page: 1, limit: 100 })
      ]);

      setCurrentTurn(currentResponse || null);
      setNextTurn(nextResponse || null);
      setQueue(queueResponse || []);
      setHistory(historyResponse.items || []);
      setAppointments(appointmentsResponse.items || []);
      setPendingAppointmentId((previous) => {
        const nextItems = appointmentsResponse.items || [];
        if (previous && nextItems.some((item) => getItemId(item) === previous)) {
          return previous;
        }
        return getItemId(nextItems[0]);
      });
    } catch (error) {
      showError({
        title: 'Error',
        description: getApiErrorMessage(error, 'No se pudo cargar la informacion del dashboard.')
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReceptionData = async ({ specialtyId = selectedSpecialtyId, doctorId = selectedDoctorId } = {}) => {
    if (!specialtyId || !doctorId) {
      setCurrentTurn(null);
      setNextTurn(null);
      setQueue([]);
      setHistory([]);
      setAppointments([]);
      return;
    }

    setLoading(true);
    try {
      const today = todayKey();
      const [currentResponse, nextResponse, queueResponse, historyResponse, appointmentsResponse] = await Promise.all([
        turnosService.current({ medico: doctorId }),
        turnosService.next({ medico: doctorId }),
        turnosService.queue({ medico: doctorId, fecha: today }),
        turnosService.history({ medico: doctorId, fecha: today, page: 1, limit: 100 }),
        appointmentsService.list({ medico: doctorId, especialidad: specialtyId, page: 1, limit: 100 })
      ]);

      setCurrentTurn(currentResponse || null);
      setNextTurn(nextResponse || null);
      setQueue(queueResponse || []);
      setHistory(historyResponse.items || []);
      setAppointments(appointmentsResponse.items || []);
      setPendingAppointmentId((previous) => {
        const nextItems = appointmentsResponse.items || [];
        if (previous && nextItems.some((item) => getItemId(item) === previous)) {
          return previous;
        }
        return getItemId(nextItems[0]);
      });
    } catch (error) {
      showError({
        title: 'Error',
        description: getApiErrorMessage(error, 'No se pudo cargar la recepcion.')
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorData = async () => {
    setLoading(true);
    try {
      const doctor = await loadDoctorProfile();
      setDoctorProfile(doctor);
      const doctorId = getItemId(doctor);

      const today = todayKey();
      const [currentResponse, nextResponse, queueResponse, historyResponse] = await Promise.all([
        turnosService.current(),
        turnosService.next(),
        turnosService.queue(),
        doctorId
          ? turnosService.history({ medico: doctorId, fecha: today, page: 1, limit: 100 })
          : Promise.resolve({ items: [] })
      ]);

      setCurrentTurn(currentResponse || null);
      setNextTurn(nextResponse || null);
      setQueue(queueResponse || []);
      setHistory(historyResponse.items || []);
    } catch (error) {
      showError({
        title: 'Error',
        description: getApiErrorMessage(error, 'No se pudo cargar el dashboard del medico.')
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPatientData = async () => {
    setLoading(true);
    try {
      const patient = await loadPatientProfile();
      setPatientProfile(patient);

      const [turnResponse, appointmentsResponse, historyResponse] = await Promise.all([
        turnosService.patient(),
        patient ? appointmentsService.list({ paciente: getItemId(patient), page: 1, limit: 20 }) : Promise.resolve({ items: [] }),
        patient ? turnosService.history({ paciente: getItemId(patient), page: 1, limit: 10 }) : Promise.resolve({ items: [] })
      ]);

      setCurrentTurn(turnResponse || null);
      setAppointments(
        (appointmentsResponse.items || [])
          .filter((appointment) => appointment.estado !== 'Cancelada' && new Date(appointment.fecha) >= new Date(todayKey()))
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      );
      setHistory(historyResponse.items || []);
    } catch (error) {
      showError({
        title: 'Error',
        description: getApiErrorMessage(error, 'No se pudo cargar el dashboard del paciente.')
      });
    } finally {
      setLoading(false);
    }
  };

  realtimeRef.current = {
    isAdministrative,
    isDoctor,
    isPatient,
    loadAdminData,
    loadReceptionData,
    loadDoctorData,
    loadPatientData,
    selectedSpecialtyId,
    selectedDoctorId
  };

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        if (isAdministrative) {
          const specialtiesResponse = await specialtiesService.list({ page: 1, limit: 200, estado: 'Activo' });
          if (!active) return;
          setSpecialties(specialtiesResponse.items || []);
          const doctorsResponse = await doctorsService.list({ page: 1, limit: 200, estado: 'Activo' });
          if (!active) return;
          setDoctors(doctorsResponse.items || []);
        } else if (isDoctor) {
          await loadDoctorData();
        } else if (isPatient) {
          await loadPatientData();
        } else {
          setLoading(false);
        }
      } catch (error) {
        if (!active) return;
        showError({
          title: 'Error',
          description: getApiErrorMessage(error, 'No se pudo inicializar el dashboard.')
        });
        setLoading(false);
      } finally {
        if (active && isAdministrative) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [isAdministrative, isDoctor, isPatient]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    let refreshTimeout = null;

    const refresh = async () => {
      const current = realtimeRef.current;

      if (current.isAdministrative) {
        if (!current.selectedSpecialtyId || !current.selectedDoctorId) {
          return;
        }

        await current.loadAdminData({
          specialtyId: current.selectedSpecialtyId,
          doctorId: current.selectedDoctorId
        });
        return;
      }

      if (current.isDoctor) {
        await current.loadDoctorData();
        return;
      }

      if (current.isPatient) {
        await current.loadPatientData();
      }
    };

    const scheduleRefresh = () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      refreshTimeout = setTimeout(() => {
        refreshTimeout = null;
        refresh();
      }, 50);
    };

    const events = ['patientCheckedIn', 'appointmentStarted', 'appointmentFinished', 'queueUpdated', 'dashboardUpdated', 'turnDeleted'];
    events.forEach((eventName) => socket.on(eventName, scheduleRefresh));

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      events.forEach((eventName) => socket.off(eventName, scheduleRefresh));
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || !connected) {
      return;
    }

    if (!initialSyncRef.current) {
      initialSyncRef.current = true;
      return;
    }

    const current = realtimeRef.current;

    if (current.isAdministrative) {
      if (!current.selectedSpecialtyId || !current.selectedDoctorId) {
        return;
      }

      current.loadAdminData({
        specialtyId: current.selectedSpecialtyId,
        doctorId: current.selectedDoctorId
      });
      return;
    }

    if (current.isDoctor) {
      current.loadDoctorData();
      return;
    }

    if (current.isPatient) {
      current.loadPatientData();
    }
  }, [socket, connected]);

  useEffect(() => {
    if (!isAdministrative) return;

    const fetchDoctors = async () => {
      try {
        const response = await doctorsService.list({
          page: 1,
          limit: 200,
          estado: 'Activo',
          especialidad: selectedSpecialtyId
        });
        setDoctors(response.items || []);
        if (selectedDoctorId && !(response.items || []).some((item) => getItemId(item) === selectedDoctorId)) {
          setSelectedDoctorId('');
        }
      } catch (error) {
        showError({
          title: 'Error',
          description: getApiErrorMessage(error, 'No se pudieron cargar los medicos disponibles.')
        });
      }
    };

    fetchDoctors();
  }, [isAdministrative, selectedSpecialtyId]);

  useEffect(() => {
    if (!isAdministrative) return;

    if (!selectedSpecialtyId || !selectedDoctorId) {
      setCurrentTurn(null);
      setNextTurn(null);
      setQueue([]);
      setHistory([]);
      setAppointments([]);
      return;
    }

    loadAdminData({ specialtyId: selectedSpecialtyId, doctorId: selectedDoctorId });
  }, [isAdministrative, selectedSpecialtyId, selectedDoctorId]);

  const handleSelectPendingAppointment = (appointment) => {
    setPendingAppointmentId(getItemId(appointment));
  };

  const handleRegisterArrival = async () => {
    if (!selectedAppointment) return;

    setReceiptActionBusy(true);
    try {
      await turnosService.registerArrival({ cita: getItemId(selectedAppointment) });
      success({
        title: 'Llegada registrada',
        description: 'El turno se genero correctamente.'
      });
      await loadReceptionData();
    } catch (error) {
      showError({
        title: 'Error',
        description: getApiErrorMessage(error, 'No se pudo registrar la llegada.')
      });
    } finally {
      setReceiptActionBusy(false);
    }
  };

  const handleConfirmAttendance = async () => {
    if (!selectedAppointment) return;

    setReceiptActionBusy(true);
    try {
      await appointmentsService.update(getItemId(selectedAppointment), { estado: 'Confirmada' });
      success({
        title: 'Asistencia confirmada',
        description: 'La cita quedo marcada como confirmada.'
      });
      await loadReceptionData();
    } catch (error) {
      showError({
        title: 'Error',
        description: getApiErrorMessage(error, 'No se pudo confirmar la asistencia.')
      });
    } finally {
      setReceiptActionBusy(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    setReceiptActionBusy(true);
    try {
      await appointmentsService.update(getItemId(selectedAppointment), { estado: 'Cancelada' });
      success({
        title: 'Cita cancelada',
        description: 'La cita fue cancelada correctamente.'
      });
      await loadReceptionData();
    } catch (error) {
      showError({
        title: 'Error',
        description: getApiErrorMessage(error, 'No se pudo cancelar la cita.')
      });
    } finally {
      setReceiptActionBusy(false);
    }
  };

  const handleRescheduleAppointment = async (event) => {
    event.preventDefault();

    if (!selectedAppointment || !rescheduleDate || !rescheduleTime) return;

    setReceiptActionBusy(true);
    try {
      await appointmentsService.update(getItemId(selectedAppointment), {
        fecha: new Date(rescheduleDate).toISOString(),
        hora: rescheduleTime
      });
      success({
        title: 'Cita reagendada',
        description: 'La nueva fecha fue guardada correctamente.'
      });
      setRescheduleFormOpen(false);
      setRescheduleDate('');
      setRescheduleTime('');
      await loadReceptionData();
    } catch (error) {
      showError({
        title: 'Error',
        description: getApiErrorMessage(error, 'No se pudo reagendar la cita.')
      });
    } finally {
      setReceiptActionBusy(false);
    }
  };

  const handleDoctorStartAttention = async (turn = nextTurn) => {
    if (!turn) return;

    setReceiptActionBusy(true);
    try {
      await turnosService.startAttention({ turnoId: getItemId(turn) });
      success({
        title: 'Atencion iniciada',
        description: 'El paciente fue enviado a consulta.'
      });
      await loadDoctorData();
    } catch (error) {
      showError({
        title: 'Error',
        description: getApiErrorMessage(error, 'No se pudo iniciar la atencion.')
      });
    } finally {
      setReceiptActionBusy(false);
    }
  };

  const handleDoctorFinishAttention = async () => {
    if (!currentTurn) return;

    setReceiptActionBusy(true);
    try {
      await turnosService.finishAttention({ turnoId: getItemId(currentTurn) });
      success({
        title: 'Consulta finalizada',
        description: 'El siguiente paciente fue activado automaticamente.'
      });
      await loadDoctorData();
    } catch (error) {
      showError({
        title: 'Error',
        description: getApiErrorMessage(error, 'No se pudo finalizar la consulta.')
      });
    } finally {
      setReceiptActionBusy(false);
    }
  };

  const roleLabel = role || 'Usuario';

  return (
    <PageContainer className="space-y-6">
      <DashboardTitle
        title={
          isAdmin
            ? 'Dashboard Administrador'
            : isReceptionist
              ? 'Dashboard Recepcionista'
              : isDoctor
                ? 'Dashboard Medico'
                : 'Dashboard Paciente'
        }
        description={
          isAdmin
            ? 'Supervision general del flujo de atencion, turnos y citas.'
            : isReceptionist
              ? 'Control operativo de llegada, asistencia y estado de las citas.'
              : isDoctor
                ? 'Vista en tiempo real de la cola, el paciente actual y el siguiente turno.'
                : 'Seguimiento personal de su turno actual, proximas citas e historial reciente.'
        }
        right={<Badge tone="secondary">{roleLabel}</Badge>}
      />

      {loading ? <Alert type="info" title="Cargando" description="Actualizando datos del dashboard..." /> : null}

      {isAdministrative ? (
        <div className="space-y-6">
          <SearchBar
            value={dashboardSearch}
            onChange={(event) => setDashboardSearch(event.target.value)}
            placeholder="Buscar pacientes, turnos o citas..."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Filter
              title="Especialidad"
              description="Seleccione una especialidad para filtrar el dashboard."
            >
              <Select value={selectedSpecialtyId} onChange={(event) => setSelectedSpecialtyId(event.target.value)}>
                <option value="">Seleccione una especialidad</option>
                {specialties.map((item) => (
                  <option key={getItemId(item)} value={getItemId(item)}>
                    {item.nombre}
                  </option>
                ))}
              </Select>
            </Filter>

            <Filter
              title="Médico"
              description="Seleccione el médico de la especialidad activa."
            >
              <Select value={selectedDoctorId} onChange={(event) => setSelectedDoctorId(event.target.value)} disabled={!selectedSpecialtyId}>
                <option value="">Seleccione un médico</option>
                {doctors.map((item) => (
                  <option key={getItemId(item)} value={getItemId(item)}>
                    {item.nombre} {item.apellido}
                  </option>
                ))}
              </Select>
            </Filter>
          </div>

          {!selectedSpecialtyId || !selectedDoctorId ? (
            <Card className="flex min-h-[320px] items-center justify-center">
              <div className="max-w-xl text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  <FilterIcon className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground">Seleccione una especialidad y un médico para visualizar la información.</h2>
                <p className="mt-3 text-sm text-muted">
                  El panel mostrará el turno actual, el siguiente turno, las citas pendientes y las métricas operativas del día.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
                <Card className="dashboard-hero-card">
                  <div className="space-y-4">
                    <div className="dashboard-hero-card__header">
                      <div>
                        <p className="ui-eyebrow ui-eyebrow--inverted">Turno actual</p>
                        <h2 className="dashboard-hero-card__title">{currentTurn?.numeroTurno || 'Sin turno activo'}</h2>
                        <p className="dashboard-hero-card__text">
                          {currentTurn
                            ? `${currentTurn.paciente?.nombre} ${currentTurn.paciente?.apellido}`
                            : 'No hay paciente en atencion en este momento.'}
                        </p>
                      </div>
                      <Badge tone="secondary">{selectedSpecialty?.nombre || 'Especialidad'}</Badge>
                    </div>
                    <div className="dashboard-hero-card__turns">
                      <TurnCard
                        className="dashboard-turn-card"
                        title="Próximo turno"
                        subtitle={nextTurn ? `${nextTurn.numeroTurno} - ${nextTurn.paciente?.nombre} ${nextTurn.paciente?.apellido}` : 'Sin turno en espera'}
                        meta={nextTurn ? `${nextTurn.tiempoEstimado || 0} min` : '0 min'}
                      />
                      <TurnCard
                        className="dashboard-turn-card"
                        title="Consultorio"
                        subtitle={selectedDoctor?.consultorio || doctorProfile?.consultorio || '-'}
                        meta={selectedDoctor?.tiempoPromedioConsulta ? `${selectedDoctor.tiempoPromedioConsulta} min por consulta` : 'Tiempo promedio'}
                      />
                    </div>
                  </div>
                </Card>

                <div className="grid gap-4">
                  <SummaryCard
                    icon={Users}
                    label="Pacientes esperando"
                    value={queue.filter((turn) => turn.estado === 'Esperando').length}
                    helper="Cola activa en tiempo real"
                    accent="primary"
                  />
                  <SummaryCard
                    icon={CalendarClock}
                    label="Pacientes atendidos hoy"
                    value={metrics.attendedToday.length}
                    helper="Turnos finalizados en la jornada"
                    accent="success"
                  />
                </div>
              </div>

              <MetricStrip
                items={[
                  {
                    label: 'Tiempo promedio espera',
                    value: formatAverageMinutes(metrics.avgWait),
                    helper: 'Calculado sobre la jornada actual'
                  },
                  {
                    label: 'Tiempo promedio consulta',
                    value: formatAverageMinutes(metrics.avgConsult),
                    helper: 'Historial de consultas finalizadas'
                  },
                  {
                    label: 'Citas pendientes',
                    value: metrics.pendingAppointments.length,
                    helper: 'Citas sin registrar llegada'
                  }
                ]}
              />

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <TurnTable
                  turns={visibleQueue}
                  emptyMessage="Todavía no hay turnos activos para esta selección."
                />

                <div className="space-y-4">
                  <InfoCard
                    title="Métricas del día"
                    description="Resumen ejecutivo del estado operativo del consultorio seleccionado."
                  />
                  <Card className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Citas pendientes</p>
                      <Badge tone="warning">{metrics.pendingAppointments.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {visiblePendingAppointments.slice(0, 4).map((item) => (
                        <div key={getItemId(item)} className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">
                              {item.pacienteData?.nombre} {item.pacienteData?.apellido}
                            </p>
                            <p className="text-xs text-muted">{formatDate(item.fecha)} - {item.hora}</p>
                          </div>
                          <Badge tone={statusTone[item.estado] || 'primary'}>{item.estado}</Badge>
                        </div>
                      ))}
                      {visiblePendingAppointments.length === 0 ? <p className="text-sm text-muted">No hay citas pendientes para esta selección.</p> : null}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {isReceptionist ? (
        <div className="space-y-6">
          <SearchBar
            value={dashboardSearch}
            onChange={(event) => setDashboardSearch(event.target.value)}
            placeholder="Buscar pacientes, turnos o citas..."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Filter title="Especialidad" description="Filtre la agenda por especialidad.">
              <Select value={selectedSpecialtyId} onChange={(event) => setSelectedSpecialtyId(event.target.value)}>
                <option value="">Seleccione una especialidad</option>
                {specialties.map((item) => (
                  <option key={getItemId(item)} value={getItemId(item)}>
                    {item.nombre}
                  </option>
                ))}
              </Select>
            </Filter>

            <Filter title="Médico" description="Filtre la cola por médico.">
              <Select value={selectedDoctorId} onChange={(event) => setSelectedDoctorId(event.target.value)} disabled={!selectedSpecialtyId}>
                <option value="">Seleccione un médico</option>
                {doctors.map((item) => (
                  <option key={getItemId(item)} value={getItemId(item)}>
                    {item.nombre} {item.apellido}
                  </option>
                ))}
              </Select>
            </Filter>
          </div>

          {!selectedSpecialtyId || !selectedDoctorId ? (
            <Card className="flex min-h-[260px] items-center justify-center">
              <div className="max-w-xl text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  <FilterIcon className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground">Seleccione una especialidad y un médico para visualizar la información.</h2>
              </div>
            </Card>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-6">
                <MetricStrip
                  items={[
                    { label: 'Cola de pacientes', value: visibleQueue.length, helper: 'Turnos activos del médico seleccionado' },
                    { label: 'Estado', value: currentTurn ? currentTurn.estado : 'Sin atención', helper: currentTurn ? 'Atención en curso' : 'Esperando turnos' },
                    { label: 'Tiempo estimado', value: nextTurn ? `${nextTurn.tiempoEstimado || 0} min` : '0 min', helper: 'Próximo paciente' }
                  ]}
                />

                <TurnTable
                  turns={visibleQueue}
                  emptyMessage="La cola seleccionada todavía no tiene turnos."
                  actionLabel="Atender"
                  onAction={handleDoctorStartAttention}
                  actionDisabled={(turn) => turn.estado !== 'Esperando' || receiptActionBusy}
                />
              </div>

              <div className="space-y-4">
                <Card className="space-y-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Acciones rápidas</p>
                  <div className="grid gap-3">
                    <Button type="button" onClick={handleRegisterArrival} disabled={!selectedAppointment || receiptActionBusy}>
                      Registrar llegada
                    </Button>
                    <Button type="button" variant="outline" onClick={handleConfirmAttendance} disabled={!selectedAppointment || receiptActionBusy}>
                      Confirmar asistencia
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancelAppointment} disabled={!selectedAppointment || receiptActionBusy}>
                      Cancelar cita
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRescheduleFormOpen(true)}
                      disabled={!selectedAppointment || receiptActionBusy}
                    >
                      Reagendar cita
                    </Button>
                  </div>
                </Card>

                <Card className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Seleccionar cita</p>
                    <Badge tone="secondary">{appointments.length}</Badge>
                  </div>
                <AppointmentList
                    appointments={visibleAppointments}
                    emptyMessage="No hay citas para la selección actual."
                    selectedId={pendingAppointmentId}
                    onSelect={handleSelectPendingAppointment}
                  />
                </Card>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {isDoctor ? (
        <div className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <Card className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard
                  icon={Stethoscope}
                  label="Nombre"
                  value={doctorProfile ? `${doctorProfile.nombre} ${doctorProfile.apellido}` : user?.nombre ? `${user.nombre} ${user.apellido}` : 'Médico'}
                  helper="Cuenta autenticada"
                />
                <SummaryCard
                  icon={FilterIcon}
                  label="Especialidad"
                  value={doctorProfile?.especialidad?.nombre || currentTurn?.especialidad?.nombre || '-'}
                  helper="Asignación del profesional"
                />
                <SummaryCard
                  icon={CalendarDays}
                  label="Consultorio"
                  value={doctorProfile?.consultorio || currentTurn?.medico?.consultorio || '-'}
                  helper="Ubicación de atención"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <TurnCard
                  title="Paciente actual"
                  subtitle={currentTurn ? `${currentTurn.paciente?.nombre} ${currentTurn.paciente?.apellido}` : 'Sin paciente en atención'}
                  meta={currentTurn ? currentTurn.numeroTurno : 'Disponible'}
                />
                <TurnCard
                  title="Próximo paciente"
                  subtitle={nextTurn ? `${nextTurn.paciente?.nombre} ${nextTurn.paciente?.apellido}` : 'No hay paciente en espera'}
                  meta={nextTurn ? nextTurn.numeroTurno : '0'}
                />
              </div>

              <MetricStrip
                items={[
                  { label: 'Pacientes pendientes', value: queue.filter((turn) => turn.estado === 'Esperando').length, helper: 'Pacientes en espera' },
                  { label: 'Pacientes atendidos hoy', value: history.filter((turn) => turn.estado === 'Finalizado').length, helper: 'Consultas cerradas' },
                  { label: 'Tiempo promedio consulta', value: formatAverageMinutes(average(history.map((item) => item.tiempoTotalConsulta))), helper: 'Promedio del día' }
                ]}
              />

              <TurnTable
                turns={queue}
                emptyMessage="No hay pacientes en la cola del médico."
                actionLabel="Atender paciente"
                onAction={handleDoctorStartAttention}
                actionDisabled={(turn) => turn.estado !== 'Esperando' || receiptActionBusy}
              />
            </Card>

            <div className="space-y-4">
              <Card className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Acciones</p>
                <Button type="button" className="w-full" onClick={() => handleDoctorStartAttention()} disabled={!nextTurn || receiptActionBusy}>
                  Atender paciente
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={handleDoctorFinishAttention} disabled={!currentTurn || receiptActionBusy}>
                  Finalizar consulta
                </Button>
              </Card>

              <InfoCard
                title="Resumen"
                description="El dashboard reconoce automáticamente al médico autenticado y carga su cola en tiempo real."
              />
            </div>
          </div>
        </div>
      ) : null}

      {isPatient ? (
        <div className="space-y-6">
          <Card className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Especialidad"
                value={currentTurn?.especialidad?.nombre || appointments[0]?.especialidadData?.nombre || patientProfile?.especialidad?.nombre || '-'}
                helper="Consulta activa o próxima cita"
              />
              <StatCard
                label="Médico"
                value={
                  currentTurn?.medico
                    ? `${currentTurn.medico.nombre} ${currentTurn.medico.apellido}`
                    : appointments[0]?.medicoData
                      ? `${appointments[0].medicoData.nombre} ${appointments[0].medicoData.apellido}`
                      : '-'
                }
                helper="Profesional asignado"
              />
              <StatCard
                label="Turno actual"
                value={currentTurn?.numeroTurno || 'Sin turno'}
                helper={currentTurn ? currentTurn.estado : 'Sin turno activo'}
              />
              <StatCard
                label="Mi turno"
                value={currentTurn?.numeroTurno || 'Sin turno'}
                helper="Estado de seguimiento"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <TurnCard
                title="Pacientes antes"
                subtitle={`${currentTurn?.personasDelante ?? 0} personas`}
                meta="Posición en la cola"
              />
              <TurnCard
                title="Tiempo estimado"
                subtitle={currentTurn?.tiempoEstimado ? `${currentTurn.tiempoEstimado} min` : '0 min'}
                meta="Se actualiza automáticamente"
              />
              <TurnCard
                title="Estado"
                subtitle={currentTurn?.estado || 'Sin estado'}
                meta={currentTurn?.horaLlegada ? formatDateTime(currentTurn.horaLlegada) : 'Sin registro'}
              />
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Mis próximas citas</p>
                <Badge tone="secondary">{appointments.length}</Badge>
              </div>
              <AppointmentList
                appointments={appointments}
                emptyMessage="No tiene próximas citas registradas."
                selectedId={pendingAppointmentId}
                onSelect={handleSelectPendingAppointment}
              />
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Historial reciente</p>
                <Badge tone="secondary">{history.length}</Badge>
              </div>
              <HistoryTable items={history.slice(0, 5)} emptyMessage="Aún no tiene historial reciente." />
            </Card>
          </div>
        </div>
      ) : null}

      {rescheduleFormOpen ? (
        <Card className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl space-y-4 border-primary bg-card shadow-soft lg:bottom-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Reagendar cita</h3>
              <p className="text-sm text-muted">
                {selectedAppointment ? `${selectedAppointment.pacienteData?.nombre} ${selectedAppointment.pacienteData?.apellido}` : 'Seleccione una cita'}
              </p>
            </div>
            <button type="button" className="rounded-2xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface" onClick={() => setRescheduleFormOpen(false)}>
              Cerrar
            </button>
          </div>

          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleRescheduleAppointment}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nueva fecha</label>
              <Input type="date" value={rescheduleDate} onChange={(event) => setRescheduleDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nueva hora</label>
              <Input type="time" value={rescheduleTime} onChange={(event) => setRescheduleTime(event.target.value)} />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setRescheduleFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={receiptActionBusy}>
                Guardar cambio
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </PageContainer>
  );
}
