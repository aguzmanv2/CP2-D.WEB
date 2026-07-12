import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Input,
  Modal,
  SearchBar,
  Select,
  StatCard,
  Table,
  Textarea,
  TurnCard
} from '../components/ui/index.jsx';
import PageContainer from '../components/common/PageContainer.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useSocket } from '../hooks/useSocket.js';
import { useToast } from '../hooks/useToast.js';
import { appointmentsService } from '../services/appointments.service.js';
import { doctorsService } from '../services/doctors.service.js';
import { patientsService } from '../services/patients.service.js';
import { turnosService } from '../services/turnos.service.js';
import { formatDateTime } from '../utils/date.js';
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

function SectionTitle({ title, description }) {
  return (
    <div className="turnos-title">
      <h1 className="ui-page-title">{title}</h1>
      {description ? <p className="ui-page-description">{description}</p> : null}
    </div>
  );
}

function AppointmentTable({ appointments, onRegisterArrival, disabled }) {
  return (
    <Table>
      <div className="overflow-x-auto">
        <table className="turnos-table">
          <thead className="turnos-table__head">
            <tr>
              <th className="turnos-table__head-cell">Paciente</th>
              <th className="turnos-table__head-cell">Medico</th>
              <th className="turnos-table__head-cell">Fecha</th>
              <th className="turnos-table__head-cell">Estado</th>
              <th className="turnos-table__head-cell turnos-table__head-cell--right">Accion</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={5} className="turnos-table__empty">
                  Seleccione un paciente para ver sus citas confirmadas.
                </td>
              </tr>
            ) : (
              appointments.map((appointment) => (
                <tr key={getItemId(appointment)} className="turnos-table__row">
                  <td className="turnos-table__cell">
                    <div>
                      <p className="font-semibold">
                        {appointment.pacienteData?.nombre} {appointment.pacienteData?.apellido}
                      </p>
                      <p className="text-xs text-muted">{appointment.pacienteData?.cedula || appointment.pacienteData?.correo || '-'}</p>
                    </div>
                  </td>
                  <td className="turnos-table__cell">
                    <div>
                      <p className="font-semibold">
                        {appointment.medicoData?.nombre} {appointment.medicoData?.apellido}
                      </p>
                      <p className="text-xs text-muted">{appointment.especialidadData?.nombre || '-'}</p>
                    </div>
                  </td>
                  <td className="turnos-table__cell">{formatDateTime(appointment.fecha, appointment.hora)}</td>
                  <td className="turnos-table__cell">
                    <Badge tone={statusTone[appointment.estado] || 'primary'}>{appointment.estado}</Badge>
                  </td>
                  <td className="turnos-table__cell turnos-table__cell--right">
                    <Button
                      type="button"
                      size="sm"
                      disabled={disabled}
                      onClick={() => onRegisterArrival(appointment)}
                    >
                      Registrar llegada
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Table>
  );
}

function TurnTable({ turns, emptyMessage }) {
  return (
    <Table>
      <div className="overflow-x-auto">
        <table className="turnos-table">
          <thead className="turnos-table__head">
            <tr>
              <th className="turnos-table__head-cell">Turno</th>
              <th className="turnos-table__head-cell">Paciente</th>
              <th className="turnos-table__head-cell">Estado</th>
              <th className="turnos-table__head-cell">Llegada</th>
              <th className="turnos-table__head-cell">Estimado</th>
            </tr>
          </thead>
          <tbody>
            {turns.length === 0 ? (
              <tr>
                <td colSpan={5} className="turnos-table__empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              turns.map((turn) => (
                <tr key={getItemId(turn)} className="turnos-table__row">
                  <td className="turnos-table__cell turnos-table__cell--strong">{turn.numeroTurno}</td>
                  <td className="turnos-table__cell">
                    <div>
                      <p className="font-semibold">
                        {turn.paciente?.nombre} {turn.paciente?.apellido}
                      </p>
                      <p className="text-xs text-muted">{turn.paciente?.cedula || turn.paciente?.correo || '-'}</p>
                    </div>
                  </td>
                  <td className="turnos-table__cell">
                    <Badge tone={statusTone[turn.estado] || 'primary'}>{turn.estado}</Badge>
                  </td>
                  <td className="turnos-table__cell turnos-table__cell--muted">{turn.horaLlegada ? formatDateTime(turn.horaLlegada) : '-'}</td>
                  <td className="turnos-table__cell turnos-table__cell--muted">{turn.tiempoEstimado ? `${turn.tiempoEstimado} min` : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Table>
  );
}

export default function TurnosPage() {
  const { user, role } = useAuth();
  const { socket, connected } = useSocket();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [nextTurn, setNextTurn] = useState(null);
  const [patientTurn, setPatientTurn] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [registeringArrival, setRegisteringArrival] = useState(false);
  const [processingTurn, setProcessingTurn] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
  const realtimeRef = useRef({});
  const initialSyncRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      motivo: '',
      notas: ''
    }
  });

  const isReceptionView = role === ROLES.ADMINISTRADOR || role === ROLES.RECEPCIONISTA;
  const isDoctorView = role === ROLES.MEDICO;
  const isPatientView = role === ROLES.PACIENTE;

  const loadReceptionData = async ({
    patientQuery = patientSearch,
    doctorQuery = doctorSearch,
    nextPatientId = selectedPatientId,
    nextDoctorId = selectedDoctorId
  } = {}) => {
    setLoading(true);
    try {
      const [patientsResponse, doctorsResponse] = await Promise.all([
        patientsService.list({ page: 1, limit: 20, search: patientQuery, estado: 'Activo' }),
        doctorsService.list({ page: 1, limit: 20, search: doctorQuery, estado: 'Activo' })
      ]);

      const nextPatients = patientsResponse.items || [];
      const nextDoctors = doctorsResponse.items || [];
      const resolvedPatientId =
        nextPatientId && nextPatients.some((patient) => getItemId(patient) === nextPatientId)
          ? nextPatientId
          : getItemId(nextPatients[0]);
      const resolvedDoctorId =
        nextDoctorId && nextDoctors.some((doctor) => getItemId(doctor) === nextDoctorId)
          ? nextDoctorId
          : getItemId(nextDoctors[0]);

      setPatients(nextPatients);
      setDoctors(nextDoctors);
      setSelectedPatientId(resolvedPatientId);
      setSelectedDoctorId(resolvedDoctorId);

      const [appointmentsResponse, queueResponse] = await Promise.all([
        resolvedPatientId
          ? appointmentsService.list({
              page: 1,
              limit: 20,
              paciente: resolvedPatientId,
              estado: 'Confirmada'
            })
          : Promise.resolve({ items: [] }),
        resolvedDoctorId ? turnosService.queue({ medico: resolvedDoctorId }) : Promise.resolve([])
      ]);

      setAppointments(appointmentsResponse.items || []);
      setQueue(queueResponse || []);
    } catch (error) {
      showError({
        title: 'Error',
        description: getApiErrorMessage(error, 'No se pudo cargar la informacion de recepcion.')
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorData = async () => {
    setLoading(true);
    try {
      const [currentResponse, nextResponse, queueResponse] = await Promise.all([
        turnosService.current(),
        turnosService.next(),
        turnosService.queue()
      ]);

      setCurrentTurn(currentResponse || null);
      setNextTurn(nextResponse || null);
      setQueue(queueResponse || []);
      setConsultationOpen(Boolean(currentResponse));
    } catch (error) {
      showError({
        title: 'Error',
        description: getApiErrorMessage(error, 'No se pudo cargar la cola del medico.')
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPatientData = async () => {
    setLoading(true);
    try {
      const response = await turnosService.patient();
      setPatientTurn(response || null);
    } catch (error) {
      showError({
        title: 'Error',
        description: getApiErrorMessage(error, 'No se pudo cargar su turno actual.')
      });
    } finally {
      setLoading(false);
    }
  };

  realtimeRef.current = {
    isReceptionView,
    isDoctorView,
    isPatientView,
    loadReceptionData,
    loadDoctorData,
    loadPatientData,
    patientSearch,
    doctorSearch,
    selectedPatientId,
    selectedDoctorId
  };

  useEffect(() => {
    if (isReceptionView) {
      loadReceptionData();
      return;
    }

    if (isDoctorView) {
      loadDoctorData();
      return;
    }

    if (isPatientView) {
      loadPatientData();
      return;
    }

    setLoading(false);
  }, [isReceptionView, isDoctorView, isPatientView]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    let refreshTimeout = null;

    const refresh = async () => {
      const current = realtimeRef.current;

      if (current.isReceptionView) {
        await current.loadReceptionData({
          patientQuery: current.patientSearch,
          doctorQuery: current.doctorSearch,
          nextPatientId: current.selectedPatientId,
          nextDoctorId: current.selectedDoctorId
        });
        return;
      }

      if (current.isDoctorView) {
        await current.loadDoctorData();
        return;
      }

      if (current.isPatientView) {
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

    if (current.isReceptionView) {
      current.loadReceptionData({
        patientQuery: current.patientSearch,
        doctorQuery: current.doctorSearch,
        nextPatientId: current.selectedPatientId,
        nextDoctorId: current.selectedDoctorId
      });
      return;
    }

    if (current.isDoctorView) {
      current.loadDoctorData();
      return;
    }

    if (current.isPatientView) {
      current.loadPatientData();
    }
  }, [socket, connected]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => getItemId(patient) === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => getItemId(doctor) === selectedDoctorId) || null,
    [doctors, selectedDoctorId]
  );

  const handleSearchPatients = async (value) => {
    setPatientSearch(value);
    await loadReceptionData({ patientQuery: value, doctorQuery: doctorSearch, nextDoctorId: selectedDoctorId });
  };

  const handleSearchDoctors = async (value) => {
    setDoctorSearch(value);
    await loadReceptionData({ patientQuery: patientSearch, doctorQuery: value, nextPatientId: selectedPatientId });
  };

  const handleRegisterArrival = async (appointment) => {
    setRegisteringArrival(true);
    try {
      await turnosService.registerArrival({ cita: getItemId(appointment) });
      success({
        title: 'Llegada registrada',
        description: 'El turno fue generado correctamente.'
      });
      await loadReceptionData({
        patientQuery: patientSearch,
        doctorQuery: doctorSearch,
        nextPatientId: selectedPatientId,
        nextDoctorId: selectedDoctorId
      });
    } catch (error) {
      showError({
        title: 'Error',
        description: getApiErrorMessage(error, 'No se pudo registrar la llegada.')
      });
    } finally {
      setRegisteringArrival(false);
    }
  };

  const handleStartAttention = async () => {
    if (!nextTurn) {
      return;
    }

    setProcessingTurn(true);
    try {
      await turnosService.startAttention({ turnoId: getItemId(nextTurn) });
      success({
        title: 'Atencion iniciada',
        description: 'El turno paso a estado En Atencion.'
      });
      await loadDoctorData();
    } catch (error) {
      showError({
        title: 'Error',
        description: getApiErrorMessage(error, 'No se pudo iniciar la atencion.')
      });
    } finally {
      setProcessingTurn(false);
    }
  };

  const handleFinishAttention = async (values) => {
    if (!currentTurn) {
      return;
    }

    setProcessingTurn(true);
    try {
      await turnosService.finishAttention({
        turnoId: getItemId(currentTurn),
        ...values
      });
      success({
        title: 'Consulta finalizada',
        description: 'El siguiente paciente quedo listo automaticamente.'
      });
      setFinishConfirmOpen(false);
      setConsultationOpen(false);
      reset({ motivo: '', notas: '' });
      await loadDoctorData();
    } catch (error) {
      showError({
        title: 'Error',
        description: getApiErrorMessage(error, 'No se pudo finalizar la atencion.')
      });
    } finally {
      setProcessingTurn(false);
    }
  };

  return (
    <PageContainer className="turnos-view">
      <SectionTitle
        title="Sistema Inteligente de Gestion de Turnos Medicos"
        description="Operacion en tiempo real para recepcion, medico y paciente sin cambiar la arquitectura existente."
      />

      {loading ? <Alert type="info" title="Cargando" description="Actualizando la informacion del modulo de turnos..." /> : null}

      {isReceptionView ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <SearchBar
                value={patientSearch}
                onChange={(event) => handleSearchPatients(event.target.value)}
                placeholder="Buscar paciente por nombre, cedula o correo"
              />
              <SearchBar
                value={doctorSearch}
                onChange={(event) => handleSearchDoctors(event.target.value)}
                placeholder="Buscar medico por nombre"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Pacientes encontrados" value={patients.length} />
              <StatCard label="Citas confirmadas" value={appointments.length} />
              <StatCard label="Pacientes en cola" value={queue.length} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Pacientes</p>
                <Select
                  value={selectedPatientId}
                  onChange={(event) => {
                    setSelectedPatientId(event.target.value);
                    loadReceptionData({
                      patientQuery: patientSearch,
                      doctorQuery: doctorSearch,
                      nextPatientId: event.target.value,
                      nextDoctorId: selectedDoctorId
                    });
                  }}
                >
                  <option value="">Seleccione un paciente</option>
                  {patients.map((patient) => (
                    <option key={getItemId(patient)} value={getItemId(patient)}>
                      {patient.nombre} {patient.apellido}
                    </option>
                  ))}
                </Select>

                {selectedPatient ? (
                  <Card className="space-y-2">
                    <p className="font-semibold text-foreground">
                      {selectedPatient.nombre} {selectedPatient.apellido}
                    </p>
                    <p className="text-sm text-muted">{selectedPatient.cedula}</p>
                    <p className="text-sm text-muted">{selectedPatient.correo}</p>
                    <Badge tone={selectedPatient.estado === 'Activo' ? 'success' : 'secondary'}>{selectedPatient.estado}</Badge>
                  </Card>
                ) : null}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Medico</p>
                <Select
                  value={selectedDoctorId}
                  onChange={(event) => {
                    setSelectedDoctorId(event.target.value);
                    loadReceptionData({
                      patientQuery: patientSearch,
                      doctorQuery: doctorSearch,
                      nextPatientId: selectedPatientId,
                      nextDoctorId: event.target.value
                    });
                  }}
                >
                  <option value="">Seleccione un medico</option>
                  {doctors.map((doctor) => (
                    <option key={getItemId(doctor)} value={getItemId(doctor)}>
                      {doctor.nombre} {doctor.apellido}
                    </option>
                  ))}
                </Select>

                {selectedDoctor ? (
                  <Card className="space-y-2">
                    <p className="font-semibold text-foreground">
                      {selectedDoctor.nombre} {selectedDoctor.apellido}
                    </p>
                    <p className="text-sm text-muted">{selectedDoctor.consultorio}</p>
                    <p className="text-sm text-muted">{selectedDoctor.tiempoPromedioConsulta} min por consulta</p>
                    <Badge tone={selectedDoctor.estado === 'Activo' ? 'success' : 'secondary'}>{selectedDoctor.estado}</Badge>
                  </Card>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Citas confirmadas</p>
              <AppointmentTable
                appointments={appointments}
                disabled={registeringArrival}
                onRegisterArrival={handleRegisterArrival}
              />
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Cola del medico</p>
              <div className="space-y-3">
                {queue.map((turn) => (
                  <TurnCard
                    key={getItemId(turn)}
                    title={`${turn.numeroTurno} - ${turn.paciente?.nombre || ''} ${turn.paciente?.apellido || ''}`}
                    subtitle={turn.especialidad?.nombre || 'Sin especialidad'}
                    meta={`${turn.estado} | ${turn.tiempoEstimado || 0} min`}
                  />
                ))}
                {queue.length === 0 ? <p className="text-sm text-muted">La cola seleccionada no tiene turnos activos.</p> : null}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {isDoctorView ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Pacientes pendientes" value={queue.filter((turn) => turn.estado === 'Esperando').length} />
              <StatCard label="En atencion" value={queue.filter((turn) => turn.estado === 'En Atencion').length} />
              <StatCard label="Total en cola" value={queue.length} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <TurnCard
                title="Paciente actual"
                subtitle={
                  currentTurn
                    ? `${currentTurn.numeroTurno} - ${currentTurn.paciente?.nombre} ${currentTurn.paciente?.apellido}`
                    : 'No hay paciente en atencion'
                }
                meta={currentTurn ? currentTurn.estado : 'Disponible'}
              />
              <TurnCard
                title="Siguiente paciente"
                subtitle={
                  nextTurn
                    ? `${nextTurn.numeroTurno} - ${nextTurn.paciente?.nombre} ${nextTurn.paciente?.apellido}`
                    : 'No hay paciente en espera'
                }
                meta={nextTurn ? `${nextTurn.tiempoEstimado || 0} min` : '0 min'}
              />
            </div>

            <TurnTable turns={queue} emptyMessage="Todavia no hay pacientes en la cola." />
          </Card>

          <div className="space-y-4">
            <Card className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Acciones</p>
              <Button type="button" className="w-full" onClick={handleStartAttention} disabled={!nextTurn || processingTurn}>
                Atender paciente
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!currentTurn || processingTurn}
                onClick={() => setFinishConfirmOpen(true)}
              >
                Finalizar cita
              </Button>
            </Card>

            <Card className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Consulta en curso</p>
              {currentTurn ? (
                <div className="space-y-3">
                  <TurnCard
                    title={`${currentTurn.paciente?.nombre} ${currentTurn.paciente?.apellido}`}
                    subtitle={currentTurn.numeroTurno}
                    meta={currentTurn.especialidad?.nombre || 'Sin especialidad'}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Motivo</label>
                    <Input
                      placeholder="Motivo de la consulta"
                      {...register('motivo', { required: 'El motivo es obligatorio' })}
                    />
                    {errors.motivo ? <p className="text-sm text-error">{errors.motivo.message}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Notas clinicas</label>
                    <Textarea placeholder="Observaciones clinicas..." {...register('notas')} />
                  </div>
                  <Button type="button" className="w-full" onClick={() => setFinishConfirmOpen(true)} disabled={processingTurn}>
                    Finalizar cita
                  </Button>
                </div>
              ) : (
                <Alert type="info" title="Sin consulta activa" description="Cuando el medico atienda un turno, aqui aparecera la consulta en curso." />
              )}
            </Card>
          </div>
        </div>
      ) : null}

      {isPatientView ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                label="Turno actual"
                value={patientTurn?.numeroTurno || 'Sin turno'}
                helper={patientTurn ? patientTurn.estado : 'Sin turno'}
              />
              <StatCard
                label="Pacientes antes de mi"
                value={patientTurn?.personasDelante ?? 0}
                helper="Posicion actual en la cola"
              />
              <StatCard
                label="Tiempo estimado"
                value={patientTurn?.tiempoEstimado ? `${patientTurn.tiempoEstimado} min` : '0 min'}
                helper="Se actualiza automaticamente"
              />
            </div>

            {patientTurn ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <TurnCard
                  title="Especialidad"
                  subtitle={patientTurn.especialidad?.nombre || '-'}
                  meta={patientTurn.especialidad?.descripcion || ''}
                />
                <TurnCard
                  title="Medico"
                  subtitle={patientTurn.medico ? `${patientTurn.medico.nombre} ${patientTurn.medico.apellido}` : '-'}
                  meta={patientTurn.medico?.consultorio || ''}
                />
              </div>
            ) : (
              <Alert type="info" title="Sin turno activo" description="En este momento no tiene un turno en espera o en atencion." />
            )}
          </Card>

          <div className="space-y-4">
            <Card className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Datos visibles</p>
              <p className="text-sm text-muted">Este panel solo muestra informacion clinica esencial para el paciente.</p>
              <div className="space-y-2">
                <Badge tone="primary">Paciente: {user?.nombre || '-'}</Badge>
                <Badge tone="secondary">Cédula: {user?.cedula || user?.correo || '-'}</Badge>
              </div>
            </Card>
            <Card className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Estado</p>
              <Badge tone={statusTone[patientTurn?.estado] || 'secondary'}>{patientTurn?.estado || 'Sin estado'}</Badge>
            </Card>
          </div>
        </div>
      ) : null}

      <Modal open={consultationOpen} className="max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Consulta en curso</h2>
              <p className="mt-1 text-sm text-muted">
                {currentTurn
                  ? `${currentTurn.paciente?.nombre} ${currentTurn.paciente?.apellido} - ${currentTurn.numeroTurno}`
                  : 'No hay consulta activa en este momento.'}
              </p>
            </div>
            <button
              type="button"
              className="rounded-2xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface"
              onClick={() => setConsultationOpen(false)}
            >
              Cerrar
            </button>
          </div>

          {currentTurn ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <Card className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <TurnCard
                    title="Paciente"
                    subtitle={`${currentTurn.paciente?.nombre} ${currentTurn.paciente?.apellido}`}
                    meta={currentTurn.paciente?.correo || ''}
                  />
                  <TurnCard title="Turno" subtitle={currentTurn.numeroTurno} meta={`Estado: ${currentTurn.estado}`} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Motivo</label>
                    <Input placeholder="Motivo de la consulta" {...register('motivo', { required: 'El motivo es obligatorio' })} />
                    {errors.motivo ? <p className="text-sm text-error">{errors.motivo.message}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Notas clinicas</label>
                    <Textarea placeholder="Observaciones clinicas..." {...register('notas')} />
                  </div>
                </div>
              </Card>

              <Card className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Resumen</p>
                <p className="text-sm text-muted">La informacion del formulario es de apoyo para la atencion en curso.</p>
                <Button type="button" className="w-full" onClick={() => setFinishConfirmOpen(true)} disabled={processingTurn}>
                  Finalizar cita
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => setConsultationOpen(false)}>
                  Seguir atencion
                </Button>
              </Card>
            </div>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={finishConfirmOpen}
        title="Finalizar cita"
        description="Se cerrara el turno actual y se activara automaticamente el siguiente paciente de la cola."
        confirmLabel={processingTurn ? 'Procesando...' : 'Finalizar'}
        cancelLabel="Cancelar"
        onCancel={() => setFinishConfirmOpen(false)}
        onConfirm={handleSubmit(handleFinishAttention)}
      />
    </PageContainer>
  );
}
