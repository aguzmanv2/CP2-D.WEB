import Turn from '../models/Turn.js';
import Appointment from '../models/Appointment.js';
import Specialty from '../models/Specialty.js';
import Doctor from '../models/Doctor.js';
import { AppError } from '../errors/AppError.js';
import { buildPagination } from '../utils/pagination.js';
import { TURN_STATUS } from '../constants/turn-statuses.js';

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DAY_MS = 24 * 60 * 60 * 1000;

const todayKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());

const startOfMonthKey = (value = new Date()) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date(date.getFullYear(), date.getMonth(), 1));
};

const dateKeyFromValue = (value) => {
  if (!value) return null;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date(value));
};

const parseFilters = (queryParams = {}) => {
  const fechaInicio = queryParams.fechaInicio ? dateKeyFromValue(queryParams.fechaInicio) : startOfMonthKey();
  const fechaFin = queryParams.fechaFin ? dateKeyFromValue(queryParams.fechaFin) : todayKey();

  if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
    throw new AppError('La fecha inicial no puede ser mayor a la fecha final', 400);
  }

  return {
    fechaInicio,
    fechaFin,
    especialidad: queryParams.especialidad || '',
    medico: queryParams.medico || '',
    search: (queryParams.search || '').trim(),
    page: Math.max(Number(queryParams.page) || 1, 1),
    limit: Math.max(Number(queryParams.limit) || 10, 1),
    sortBy: queryParams.sortBy || 'horaLlegada',
    sortOrder: queryParams.sortOrder === 'asc' ? 1 : -1
  };
};

const buildTurnMatch = (filters) => {
  const match = {
    fecha: {
      $gte: filters.fechaInicio,
      $lte: filters.fechaFin
    }
  };

  if (filters.especialidad) {
    match.especialidad = filters.especialidad;
  }

  if (filters.medico) {
    match.medico = filters.medico;
  }

  return match;
};

const buildAppointmentMatch = (filters) => {
  const match = {
    fecha: {
      $gte: new Date(`${filters.fechaInicio}T00:00:00.000Z`),
      $lte: new Date(`${filters.fechaFin}T23:59:59.999Z`)
    }
  };

  if (filters.especialidad) {
    match.especialidad = filters.especialidad;
  }

  if (filters.medico) {
    match.medico = filters.medico;
  }

  return match;
};

const buildLookupStages = () => [
  {
    $lookup: {
      from: 'patients',
      localField: 'paciente',
      foreignField: '_id',
      as: 'pacienteData'
    }
  },
  { $unwind: '$pacienteData' },
  {
    $lookup: {
      from: 'doctors',
      localField: 'medico',
      foreignField: '_id',
      as: 'medicoData'
    }
  },
  { $unwind: '$medicoData' },
  {
    $lookup: {
      from: 'specialties',
      localField: 'especialidad',
      foreignField: '_id',
      as: 'especialidadData'
    }
  },
  { $unwind: '$especialidadData' }
];

const buildSearchStage = (search) => {
  if (!search) return [];

  const query = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return [
    {
      $match: {
        $or: [
          { numeroTurno: { $regex: query, $options: 'i' } },
          { estado: { $regex: query, $options: 'i' } },
          { 'pacienteData.nombre': { $regex: query, $options: 'i' } },
          { 'pacienteData.apellido': { $regex: query, $options: 'i' } },
          { 'pacienteData.cedula': { $regex: query, $options: 'i' } },
          { 'medicoData.nombre': { $regex: query, $options: 'i' } },
          { 'medicoData.apellido': { $regex: query, $options: 'i' } },
          { 'especialidadData.nombre': { $regex: query, $options: 'i' } }
        ]
      }
    }
  ];
};

const buildSortStage = (sortBy, sortOrder) => {
  const allowed = {
    numeroTurno: 'numeroTurno',
    paciente: 'pacienteData.nombre',
    medico: 'medicoData.nombre',
    especialidad: 'especialidadData.nombre',
    horaLlegada: 'horaLlegada',
    horaInicio: 'horaInicio',
    horaFin: 'horaFin',
    tiempoTotalEspera: 'tiempoTotalEspera',
    tiempoTotalConsulta: 'tiempoTotalConsulta',
    estado: 'estado',
    fecha: 'fecha',
    createdAt: 'createdAt'
  };

  return { [allowed[sortBy] || 'horaLlegada']: sortOrder };
};

const buildTablePipeline = (filters, { includePagination = true } = {}) => {
  const baseStages = [
    { $match: buildTurnMatch(filters) },
    ...buildLookupStages(),
    ...buildSearchStage(filters.search)
  ];

  const projection = {
    _id: 1,
    numeroTurno: 1,
    estado: 1,
    fecha: 1,
    horaLlegada: 1,
    horaInicio: 1,
    horaFin: 1,
    tiempoEstimado: 1,
    personasDelante: 1,
    tiempoTotalEspera: 1,
    tiempoTotalConsulta: 1,
    createdAt: 1,
    paciente: '$pacienteData',
    medico: '$medicoData',
    especialidad: '$especialidadData'
  };

  const sortStage = { $sort: buildSortStage(filters.sortBy, filters.sortOrder) };

  if (!includePagination) {
    return [...baseStages, sortStage, { $project: projection }];
  }

  const skip = (filters.page - 1) * filters.limit;

  return [
    ...baseStages,
    sortStage,
    {
      $facet: {
        items: [{ $skip: skip }, { $limit: filters.limit }, { $project: projection }],
        total: [{ $count: 'count' }]
      }
    }
  ];
};

const mapTopResult = (result = [], labelField = 'name') => {
  const item = result[0];
  if (!item) return null;

  return {
    label: item[labelField] || item.nombre || item._id || 'N/A',
    value: item.value || item.total || 0
  };
};

const getCountsByField = async ({ filters, field, model }) => {
  const pipeline = [
    { $match: { ...buildTurnMatch(filters), estado: TURN_STATUS.FINISHED } },
    {
      $group: {
        _id: `$${field}`,
        value: { $sum: 1 },
        avgWait: { $avg: '$tiempoTotalEspera' },
        avgConsult: { $avg: '$tiempoTotalConsulta' }
      }
    },
    { $sort: { value: -1 } },
    { $limit: 10 }
  ];

  const items = await Turn.aggregate(pipeline);
  const ids = items.map((item) => item._id).filter(Boolean);
  const docs = ids.length ? await model.find({ _id: { $in: ids } }).select('nombre apellido descripcion') : [];
  const docMap = new Map(docs.map((doc) => [String(doc._id), doc]));

  return items.map((item) => {
    const doc = docMap.get(String(item._id));
    const name = doc
      ? `${doc.nombre || ''} ${doc.apellido || ''}`.trim() || doc.nombre || doc.descripcion || 'N/A'
      : String(item._id || 'N/A');

    return {
      label: name,
      value: item.value,
      avgWait: Math.round(item.avgWait || 0),
      avgConsult: Math.round(item.avgConsult || 0)
    };
  });
};

const getDailyAttendance = async (filters) => {
  const items = await Turn.aggregate([
    { $match: { ...buildTurnMatch(filters), estado: TURN_STATUS.FINISHED } },
    {
      $group: {
        _id: '$fecha',
        value: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return items.map((item) => ({
    label: item._id,
    value: item.value
  }));
};

const getMonthlyCancellations = async (filters) => {
  const items = await Appointment.aggregate([
    { $match: { ...buildAppointmentMatch(filters), estado: 'Cancelada' } },
    {
      $group: {
        _id: { year: { $year: '$fecha' }, month: { $month: '$fecha' } },
        value: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  return items.map((item) => ({
    label: `${MONTH_LABELS[(item._id.month || 1) - 1]} ${item._id.year}`,
    value: item.value
  }));
};

const getSummary = async (filters) => {
  const [turnStats] = await Turn.aggregate([
    { $match: buildTurnMatch(filters) },
    {
      $group: {
        _id: null,
        attended: {
          $sum: {
            $cond: [{ $eq: ['$estado', TURN_STATUS.FINISHED] }, 1, 0]
          }
        },
        pending: {
          $sum: {
            $cond: [
              { $in: ['$estado', [TURN_STATUS.WAITING, TURN_STATUS.IN_ATTENTION]] },
              1,
              0
            ]
          }
        },
        avgWait: {
          $avg: {
            $cond: [{ $eq: ['$estado', TURN_STATUS.FINISHED] }, '$tiempoTotalEspera', null]
          }
        },
        avgConsult: {
          $avg: {
            $cond: [{ $eq: ['$estado', TURN_STATUS.FINISHED] }, '$tiempoTotalConsulta', null]
          }
        }
      }
    }
  ]);

  const canceledAppointments = await Appointment.countDocuments({
    ...buildAppointmentMatch(filters),
    estado: 'Cancelada'
  });

  const [topSpecialtyRaw, topDoctorRaw] = await Promise.all([
    Turn.aggregate([
      { $match: { ...buildTurnMatch(filters), estado: TURN_STATUS.FINISHED } },
      { $group: { _id: '$especialidad', value: { $sum: 1 } } },
      { $sort: { value: -1 } },
      { $limit: 1 },
      { $lookup: { from: 'specialties', localField: '_id', foreignField: '_id', as: 'specialty' } },
      { $unwind: '$specialty' },
      {
        $project: {
          _id: 0,
          label: '$specialty.nombre',
          value: 1
        }
      }
    ]),
    Turn.aggregate([
      { $match: { ...buildTurnMatch(filters), estado: TURN_STATUS.FINISHED } },
      { $group: { _id: '$medico', value: { $sum: 1 } } },
      { $sort: { value: -1 } },
      { $limit: 1 },
      { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'doctor' } },
      { $unwind: '$doctor' },
      {
        $project: {
          _id: 0,
          label: { $concat: ['$doctor.nombre', ' ', '$doctor.apellido'] },
          value: 1
        }
      }
    ])
  ]);

  return {
    pacientesAtendidos: turnStats?.attended || 0,
    pacientesPendientes: turnStats?.pending || 0,
    citasCanceladas: canceledAppointments,
    tiempoPromedioEspera: Math.round(turnStats?.avgWait || 0),
    tiempoPromedioConsulta: Math.round(turnStats?.avgConsult || 0),
    especialidadMayorDemanda: topSpecialtyRaw[0] || null,
    medicoMayorPacientes: topDoctorRaw[0] || null
  };
};

const getTable = async (filters) => {
  const [result] = await Turn.aggregate(buildTablePipeline(filters));
  const total = result?.total?.[0]?.count || 0;

  return {
    items: result?.items || [],
    pagination: buildPagination({
      page: filters.page,
      limit: filters.limit,
      total
    })
  };
};

const getCharts = async (filters) => {
  const [atendidosPorDia, pacientesPorMedico, pacientesPorEspecialidad, canceladasPorMes, esperaPorMedico, consultaPorEspecialidad] =
    await Promise.all([
      getDailyAttendance(filters),
      getCountsByField({ filters, field: 'medico', model: Doctor }),
      getCountsByField({ filters, field: 'especialidad', model: Specialty }),
      getMonthlyCancellations(filters),
      getCountsByField({ filters, field: 'medico', model: Doctor }),
      getCountsByField({ filters, field: 'especialidad', model: Specialty })
    ]);

  return {
    pacientesAtendidosPorDia: atendidosPorDia,
    pacientesPorMedico,
    pacientesPorEspecialidad,
    citasCanceladasPorMes: canceladasPorMes,
    tiempoPromedioEsperaPorMedico: esperaPorMedico.map((item) => ({
      label: item.label,
      value: item.avgWait
    })),
    tiempoPromedioConsultaPorEspecialidad: consultaPorEspecialidad.map((item) => ({
      label: item.label,
      value: item.avgConsult
    }))
  };
};

const toCsvValue = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
};

const buildCsv = (rows) => {
  const headers = [
    'Paciente',
    'Medico',
    'Especialidad',
    'Hora llegada',
    'Hora inicio',
    'Hora fin',
    'Tiempo espera',
    'Tiempo consulta',
    'Estado'
  ];

  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(
      [
        toCsvValue(`${row.paciente?.nombre || ''} ${row.paciente?.apellido || ''}`.trim()),
        toCsvValue(`${row.medico?.nombre || ''} ${row.medico?.apellido || ''}`.trim()),
        toCsvValue(row.especialidad?.nombre || ''),
        toCsvValue(row.horaLlegada ? new Date(row.horaLlegada).toISOString() : ''),
        toCsvValue(row.horaInicio ? new Date(row.horaInicio).toISOString() : ''),
        toCsvValue(row.horaFin ? new Date(row.horaFin).toISOString() : ''),
        toCsvValue(row.tiempoTotalEspera || 0),
        toCsvValue(row.tiempoTotalConsulta || 0),
        toCsvValue(row.estado)
      ].join(',')
    );
  }

  return lines.join('\n');
};

const buildExcelHtml = (rows) => {
  const bodyRows = rows
    .map(
      (row) => `
        <tr>
          <td>${`${row.paciente?.nombre || ''} ${row.paciente?.apellido || ''}`.trim()}</td>
          <td>${`${row.medico?.nombre || ''} ${row.medico?.apellido || ''}`.trim()}</td>
          <td>${row.especialidad?.nombre || ''}</td>
          <td>${row.horaLlegada ? new Date(row.horaLlegada).toISOString() : ''}</td>
          <td>${row.horaInicio ? new Date(row.horaInicio).toISOString() : ''}</td>
          <td>${row.horaFin ? new Date(row.horaFin).toISOString() : ''}</td>
          <td>${row.tiempoTotalEspera || 0}</td>
          <td>${row.tiempoTotalConsulta || 0}</td>
          <td>${row.estado}</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; }
        th { background: #e5efff; }
      </style>
    </head>
    <body>
      <h2>Reporte de clinica</h2>
      <table>
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Medico</th>
            <th>Especialidad</th>
            <th>Hora llegada</th>
            <th>Hora inicio</th>
            <th>Hora fin</th>
            <th>Tiempo espera</th>
            <th>Tiempo consulta</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </body>
  </html>`;
};

const escapePdfText = (text) =>
  String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const buildPdf = (rows, summary) => {
  const lines = [
    'Reporte de clinica',
    `Pacientes atendidos: ${summary.pacientesAtendidos}`,
    `Pacientes pendientes: ${summary.pacientesPendientes}`,
    `Citas canceladas: ${summary.citasCanceladas}`,
    `Tiempo promedio espera: ${summary.tiempoPromedioEspera} min`,
    `Tiempo promedio consulta: ${summary.tiempoPromedioConsulta} min`,
    '',
    'Paciente | Medico | Especialidad | Llegada | Inicio | Fin | Espera | Consulta | Estado'
  ];

  for (const row of rows.slice(0, 24)) {
    lines.push(
      [
        `${row.paciente?.nombre || ''} ${row.paciente?.apellido || ''}`.trim(),
        `${row.medico?.nombre || ''} ${row.medico?.apellido || ''}`.trim(),
        row.especialidad?.nombre || '',
        row.horaLlegada ? new Date(row.horaLlegada).toISOString() : '',
        row.horaInicio ? new Date(row.horaInicio).toISOString() : '',
        row.horaFin ? new Date(row.horaFin).toISOString() : '',
        String(row.tiempoTotalEspera || 0),
        String(row.tiempoTotalConsulta || 0),
        row.estado
      ].join(' | ')
    );
  }

  const contentLines = [];
  let y = 760;
  for (const line of lines) {
    if (y < 50) break;
    contentLines.push(`BT /F1 10 Tf 40 ${y} Td (${escapePdfText(line)}) Tj ET`);
    y -= 18;
  }

  const content = contentLines.join('\n');
  const objects = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefPosition = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
};

export const getDashboardReport = async (queryParams) => {
  const filters = parseFilters(queryParams);
  const [summary, charts, table] = await Promise.all([
    getSummary(filters),
    getCharts(filters),
    getTable(filters)
  ]);

  return {
    filters,
    summary,
    charts,
    table
  };
};

export const getTableReport = async (queryParams) => {
  const filters = parseFilters(queryParams);
  return getTable(filters);
};

export const exportReport = async (format, queryParams) => {
  const filters = parseFilters(queryParams);
  const summary = await getSummary(filters);
  const table = await getTable({ ...filters, page: 1, limit: 1000 });

  if (format === 'csv') {
    return {
      fileName: `reporte-${filters.fechaInicio}-${filters.fechaFin}.csv`,
      mimeType: 'text/csv; charset=utf-8',
      content: Buffer.from(buildCsv(table.items), 'utf8')
    };
  }

  if (format === 'excel') {
    return {
      fileName: `reporte-${filters.fechaInicio}-${filters.fechaFin}.xls`,
      mimeType: 'application/vnd.ms-excel',
      content: Buffer.from(buildExcelHtml(table.items), 'utf8')
    };
  }

  return {
    fileName: `reporte-${filters.fechaInicio}-${filters.fechaFin}.pdf`,
    mimeType: 'application/pdf',
    content: buildPdf(table.items, summary)
  };
};
