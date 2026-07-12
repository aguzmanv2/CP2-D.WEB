import { memo, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, RefreshCw } from 'lucide-react';
import PageContainer from '../components/common/PageContainer.jsx';
import {
  Alert,
  Badge,
  Button,
  Card,
  DatePicker,
  Filter,
  InfoCard,
  Pagination,
  SearchBar,
  Select,
  StatCard,
  Table
} from '../components/ui/index.jsx';
import { useToast } from '../hooks/useToast.js';
import { doctorsService } from '../services/doctors.service.js';
import { reportsService } from '../services/reports.service.js';
import { specialtiesService } from '../services/specialties.service.js';
import { getApiErrorMessage } from '../utils/errors.js';

const getItemId = (item) => item?.id || item?._id || '';
const formatNumber = (value) => new Intl.NumberFormat('es-CO').format(Number(value || 0));
const formatMinutes = (value) => `${formatNumber(value || 0)} min`;
const chartColors = ['#2563EB', '#60A5FA', '#22C55E', '#F59E0B', '#EF4444', '#94A3B8'];

const sortIcons = {
  none: ArrowUpDown,
  asc: ArrowUp,
  desc: ArrowDown
};

const todayKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
const startOfMonthKey = () => {
  const now = new Date();
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date(now.getFullYear(), now.getMonth(), 1));
};

function DashboardTitle({ title, description, actions }) {
  return (
    <div className="reports-title">
      <div>
        <p className="ui-eyebrow">Reportes y Analitica</p>
        <h1 className="ui-page-title">{title}</h1>
        {description ? <p className="ui-page-description">{description}</p> : null}
      </div>
      {actions ? <div className="reports-title__actions">{actions}</div> : null}
    </div>
  );
}

function ChartCard({ title, description, children, className }) {
  return (
    <Card className={className}>
      <div className="reports-chart-card__header">
        <div>
          <h3 className="reports-chart-card__title">{title}</h3>
          {description ? <p className="reports-chart-card__description">{description}</p> : null}
        </div>
      </div>
      {children}
    </Card>
  );
}

const SimpleBarChart = memo(function SimpleBarChart({ data, horizontal = false, unit = '' }) {
  const maxValue = Math.max(...data.map((item) => Number(item.value) || 0), 1);

  if (horizontal) {
    return (
      <div className="space-y-4">
        {data.map((item, index) => {
          const width = `${((Number(item.value) || 0) / maxValue) * 100}%`;
          return (
            <div key={`${item.label}-${index}`} className="space-y-2">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="truncate font-medium text-foreground">{item.label}</span>
                <span className="text-muted">
                  {formatNumber(item.value)}
                  {unit}
                </span>
              </div>
              <div className="h-3 rounded-full bg-surface">
                <div
                  className="h-3 rounded-full bg-primary"
                  style={{ width }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex h-72 items-end gap-3 overflow-x-auto pb-2">
      {data.map((item, index) => {
        const height = `${((Number(item.value) || 0) / maxValue) * 100}%`;
        return (
          <div key={`${item.label}-${index}`} className="flex min-w-14 flex-1 flex-col items-center justify-end gap-2">
            <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-surface">
              <div
                className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-primary"
                style={{ height }}
              />
            </div>
            <span className="text-xs font-medium text-muted">{item.label}</span>
            <span className="text-xs font-semibold text-foreground">{formatNumber(item.value)}</span>
          </div>
        );
      })}
    </div>
  );
});

const DonutChart = memo(function DonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0) || 1;
  let cursor = 0;
  const segments = data.map((item, index) => {
    const percent = ((Number(item.value) || 0) / total) * 100;
    const start = cursor;
    const end = cursor + percent;
    cursor = end;
    return `${chartColors[index % chartColors.length]} ${start}% ${end}%`;
  });
  const background = segments.length > 0 ? `conic-gradient(${segments.join(', ')})` : 'linear-gradient(135deg, #e2e8f0, #f8fafc)';

  return (
    <div className="reports-donut">
      <div className="reports-donut__ring" style={{ background }}>
        <div className="reports-donut__center">
          <div className="reports-donut__content">
            <p className="ui-eyebrow">Total</p>
            <p className="ui-page-title">{formatNumber(total)}</p>
          </div>
        </div>
      </div>

      <div className="reports-donut__legend">
        {data.map((item, index) => {
          const percent = ((Number(item.value) || 0) / total) * 100;
          const color = chartColors[index % chartColors.length];

          return (
            <div key={`${item.label}-${index}`} className="reports-donut__legend-item">
              <div className="reports-donut__legend-left">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="reports-donut__legend-label">{item.label}</span>
              </div>
              <div className="reports-donut__legend-right">
                <p className="reports-donut__legend-value">{formatNumber(item.value)}</p>
                <p className="reports-donut__legend-percent">{percent.toFixed(1)}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

function DataTable({ rows, onSort, sortBy, sortOrder, loading }) {
  const headers = [
    { key: 'paciente', label: 'Paciente' },
    { key: 'medico', label: 'Medico' },
    { key: 'especialidad', label: 'Especialidad' },
    { key: 'horaLlegada', label: 'Hora llegada' },
    { key: 'horaInicio', label: 'Hora inicio' },
    { key: 'horaFin', label: 'Hora fin' },
    { key: 'tiempoTotalEspera', label: 'Tiempo espera' },
    { key: 'tiempoTotalConsulta', label: 'Tiempo consulta' },
    { key: 'estado', label: 'Estado' }
  ];

  return (
    <Table>
      <div className="overflow-x-auto">
        <table className="reports-table">
          <thead className="reports-table__head">
            <tr>
              {headers.map((header) => {
                const active = sortBy === header.key;
                const Icon = active ? sortIcons[sortOrder === 1 ? 'asc' : 'desc'] : ArrowUpDown;
                return (
                  <th key={header.key} className="reports-table-head-cell">
                    <button type="button" className="reports-table-head-cell__button" onClick={() => onSort(header.key)}>
                      <span>{header.label}</span>
                      <Icon className="reports-table-head-cell__icon" />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={headers.length} className="reports-table__empty">
                  Cargando informacion...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="reports-table__empty">
                  No se encontraron registros para los filtros actuales.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={getItemId(row)} className="reports-table__row">
                  <td className="reports-table__cell">
                    <div>
                      <p className="reports-table__cell-title">
                        {row.paciente?.nombre} {row.paciente?.apellido}
                      </p>
                      <p className="reports-table__cell-meta">{row.paciente?.cedula || row.paciente?.correo || '-'}</p>
                    </div>
                  </td>
                  <td className="reports-table__cell">
                    <div>
                      <p className="reports-table__cell-title">
                        {row.medico?.nombre} {row.medico?.apellido}
                      </p>
                      <p className="reports-table__cell-meta">{row.medico?.consultorio || '-'}</p>
                    </div>
                  </td>
                  <td className="reports-table__cell reports-table__cell--muted">{row.especialidad?.nombre || '-'}</td>
                  <td className="reports-table__cell reports-table__cell--muted">{row.horaLlegada ? new Date(row.horaLlegada).toLocaleString('es-CO') : '-'}</td>
                  <td className="reports-table__cell reports-table__cell--muted">{row.horaInicio ? new Date(row.horaInicio).toLocaleString('es-CO') : '-'}</td>
                  <td className="reports-table__cell reports-table__cell--muted">{row.horaFin ? new Date(row.horaFin).toLocaleString('es-CO') : '-'}</td>
                  <td className="reports-table__cell reports-table__cell--muted">{formatMinutes(row.tiempoTotalEspera)}</td>
                  <td className="reports-table__cell reports-table__cell--muted">{formatMinutes(row.tiempoTotalConsulta)}</td>
                  <td className="reports-table__cell">
                    <Badge tone={row.estado === 'Finalizado' ? 'success' : row.estado === 'Esperando' ? 'warning' : row.estado === 'En Atencion' ? 'primary' : 'secondary'}>
                      {row.estado}
                    </Badge>
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

function exportBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export default function ReportesPage() {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('horaLlegada');
  const [sortOrder, setSortOrder] = useState(-1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    fechaInicio: startOfMonthKey(),
    fechaFin: todayKey(),
    especialidad: '',
    medico: ''
  });

  const appliedParams = useMemo(
    () => ({
      ...filters,
      search,
      page,
      limit,
      sortBy,
      sortOrder: sortOrder === 1 ? 'asc' : 'desc'
    }),
    [filters, search, page, limit, sortBy, sortOrder]
  );

  const loadReport = async (params = appliedParams) => {
    setLoading(true);
    try {
      const response = await reportsService.dashboard(params);
      setData(response);
    } catch (error) {
      showError({
        title: 'Error',
        description: getApiErrorMessage(error, 'No se pudo cargar el reporte.')
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFilters = async () => {
    try {
      const [specialtiesResponse, doctorsResponse] = await Promise.all([
        specialtiesService.list({ page: 1, limit: 200, estado: 'Activo' }),
        doctorsService.list({ page: 1, limit: 200, estado: 'Activo' })
      ]);

      setSpecialties(specialtiesResponse.items || []);
      setDoctors(doctorsResponse.items || []);
    } catch (error) {
      showError({
        title: 'Error',
        description: getApiErrorMessage(error, 'No se pudieron cargar los filtros.')
      });
    }
  };

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadReport();
  }, [appliedParams]);

  const handleApplyFilters = () => {
      setPage(1);
  };

  const handleResetFilters = () => {
    const nextFilters = {
      fechaInicio: startOfMonthKey(),
      fechaFin: todayKey(),
      especialidad: '',
      medico: ''
    };
    setFilters(nextFilters);
    setSearch('');
    setPage(1);
    setSortBy('horaLlegada');
    setSortOrder(-1);
  };

  const handleSort = (key) => {
    setPage(1);
    setSortBy(key);
    setSortOrder((previous) => (sortBy === key ? (previous === 1 ? -1 : 1) : -1));
  };

  const currentSortOrder = sortOrder;
  const summary = data?.summary || {};
  const charts = data?.charts || {};
  const table = data?.table || { items: [], pagination: { page: 1, totalPages: 1, total: 0 } };

  const exportAction = async (format) => {
    setSubmitting(true);
    try {
      const exporter =
        format === 'csv' ? reportsService.exportCsv : format === 'excel' ? reportsService.exportExcel : reportsService.exportPdf;
      const { blob, filename } = await exporter({
        ...filters,
        search,
        sortBy,
        sortOrder: sortOrder === 1 ? 'asc' : 'desc'
      });
      exportBlob(blob, filename);
      success({
        title: 'Exportacion lista',
        description: `El archivo ${filename} se genero correctamente.`
      });
    } catch (error) {
      showError({
        title: 'Error',
        description: getApiErrorMessage(error, 'No se pudo exportar el reporte.')
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer className="reports-view">
      <DashboardTitle
        title="Reportes y Analitica"
        description="Indicadores diarios de atencion, tiempos operativos y exportacion profesional para la clinica."
        actions={[
          <Button key="refresh" type="button" variant="outline" onClick={() => loadReport()}>
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>,
          <Button key="csv" type="button" variant="outline" onClick={() => exportAction('csv')} disabled={submitting}>
            <Download className="h-4 w-4" />
            CSV
          </Button>,
          <Button key="excel" type="button" variant="outline" onClick={() => exportAction('excel')} disabled={submitting}>
            <Download className="h-4 w-4" />
            Excel
          </Button>,
          <Button key="pdf" type="button" onClick={() => exportAction('pdf')} disabled={submitting}>
            <Download className="h-4 w-4" />
            PDF
          </Button>
        ]}
      />

      <Filter title="Filtros superiores" description="Los filtros pueden combinarse para explorar periodos, especialidades y medicos.">
        <div className="reports-filter-grid">
          <DatePicker
            value={filters.fechaInicio}
            onChange={(event) => setFilters((previous) => ({ ...previous, fechaInicio: event.target.value }))}
          />
          <DatePicker
            value={filters.fechaFin}
            onChange={(event) => setFilters((previous) => ({ ...previous, fechaFin: event.target.value }))}
          />
          <Select
            value={filters.especialidad}
            onChange={(event) => setFilters((previous) => ({ ...previous, especialidad: event.target.value }))}
          >
            <option value="">Todas las especialidades</option>
            {specialties.map((item) => (
              <option key={getItemId(item)} value={getItemId(item)}>
                {item.nombre}
              </option>
            ))}
          </Select>
          <Select
            value={filters.medico}
            onChange={(event) => setFilters((previous) => ({ ...previous, medico: event.target.value }))}
          >
            <option value="">Todos los medicos</option>
            {doctors.map((item) => (
              <option key={getItemId(item)} value={getItemId(item)}>
                {item.nombre} {item.apellido}
              </option>
            ))}
          </Select>
          <div className="reports-title__actions">
            <Button type="button" onClick={handleApplyFilters} disabled={loading}>
              Aplicar
            </Button>
            <Button type="button" variant="outline" onClick={handleResetFilters} disabled={loading}>
              Limpiar
            </Button>
          </div>
        </div>

        <div className="reports-filter-grid">
          <SearchBar
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar paciente, medico, especialidad o turno..."
          />
          <Select value={String(limit)} onChange={(event) => setLimit(Number(event.target.value))}>
            <option value="10">10 por pagina</option>
            <option value="20">20 por pagina</option>
            <option value="50">50 por pagina</option>
          </Select>
        </div>
      </Filter>

      {loading && !data ? <Alert type="info" title="Cargando" description="Generando analitica de reportes..." /> : null}

      <div className="reports-summary-grid">
        <StatCard label="Pacientes atendidos" value={summary.pacientesAtendidos || 0} helper="Turnos finalizados" />
        <StatCard label="Pacientes pendientes" value={summary.pacientesPendientes || 0} helper="Esperando o en atencion" />
        <StatCard label="Citas canceladas" value={summary.citasCanceladas || 0} helper="Rango filtrado" />
        <StatCard label="Tiempo prom. espera" value={summary.tiempoPromedioEspera ? `${summary.tiempoPromedioEspera} min` : '0 min'} helper="Jornada actual" />
        <StatCard label="Tiempo prom. consulta" value={summary.tiempoPromedioConsulta ? `${summary.tiempoPromedioConsulta} min` : '0 min'} helper="Jornada actual" />
        <StatCard label="Mayor demanda" value={summary.especialidadMayorDemanda?.label || '-'} helper={summary.especialidadMayorDemanda ? formatNumber(summary.especialidadMayorDemanda.value) : '0 pacientes'} />
        <StatCard label="Médico principal" value={summary.medicoMayorPacientes?.label || '-'} helper={summary.medicoMayorPacientes ? formatNumber(summary.medicoMayorPacientes.value) : '0 pacientes'} />
      </div>

      <div className="reports-charts-grid">
        <ChartCard title="Pacientes atendidos por dia" description="Volumen diario de atenciones finalizadas">
          <SimpleBarChart data={charts.pacientesAtendidosPorDia || []} />
        </ChartCard>
        <ChartCard title="Pacientes por medico" description="Distribucion de pacientes atendidos entre medicos">
          <SimpleBarChart data={charts.pacientesPorMedico || []} horizontal />
        </ChartCard>
        <ChartCard title="Pacientes por especialidad" description="Demanda atendida por especialidad">
          <DonutChart data={charts.pacientesPorEspecialidad || []} />
        </ChartCard>
        <ChartCard title="Citas canceladas por mes" description="Evolucion de cancelaciones por mes">
          <SimpleBarChart data={charts.citasCanceladasPorMes || []} />
        </ChartCard>
        <ChartCard title="Tiempo promedio de espera por medico" description="Promedio en minutos por profesional">
          <SimpleBarChart data={charts.tiempoPromedioEsperaPorMedico || []} horizontal unit=" min" />
        </ChartCard>
        <ChartCard title="Tiempo promedio de consulta por especialidad" description="Promedio en minutos por especialidad">
          <SimpleBarChart data={charts.tiempoPromedioConsultaPorEspecialidad || []} horizontal unit=" min" />
        </ChartCard>
      </div>

      <Card className="space-y-4">
        <div className="reports-title">
          <div>
            <h2 className="reports-chart-card__title">Tabla de detalle</h2>
            <p className="reports-chart-card__description">Busqueda, ordenamiento y paginacion de los registros del reporte.</p>
          </div>
          <Badge tone="secondary">
            {formatNumber(table.pagination?.total || 0)} registros
          </Badge>
        </div>

        <DataTable
          rows={table.items || []}
          onSort={handleSort}
          sortBy={sortBy}
          sortOrder={currentSortOrder}
          loading={loading}
        />

        <Pagination>
          <div className="reports-title__actions">
            <span className="ui-page-description">
              Pagina {table.pagination?.page || 1} de {table.pagination?.totalPages || 1}
            </span>
          </div>
          <div className="reports-title__actions">
            <Button type="button" variant="outline" size="sm" disabled={!table.pagination?.hasPrevPage} onClick={() => setPage((previous) => Math.max(previous - 1, 1))}>
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!table.pagination?.hasNextPage}
              onClick={() => setPage((previous) => previous + 1)}
            >
              Siguiente
            </Button>
          </div>
        </Pagination>
      </Card>

      <InfoCard
        title="Exportacion"
        description="Los reportes pueden descargarse en CSV, Excel y PDF con los filtros y el orden actual."
      />

      {data?.charts?.pacientesAtendidosPorDia?.length === 0 ? (
        <Alert type="warning" title="Sin datos" description="No se encontraron resultados para el rango y filtros seleccionados." />
      ) : null}
    </PageContainer>
  );
}
