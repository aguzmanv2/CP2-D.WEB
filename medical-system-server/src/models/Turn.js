import mongoose from 'mongoose';
import { TURN_STATUS_VALUES } from '../constants/turn-statuses.js';

const turnSchema = new mongoose.Schema(
  {
    numeroTurno: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true
    },
    paciente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    medico: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    especialidad: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Specialty',
      required: true
    },
    cita: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
      index: true
    },
    estado: {
      type: String,
      enum: TURN_STATUS_VALUES,
      default: TURN_STATUS_VALUES[0],
      required: true
    },
    horaLlegada: {
      type: Date,
      default: null
    },
    horaInicio: {
      type: Date,
      default: null
    },
    horaFin: {
      type: Date,
      default: null
    },
    tiempoEstimado: {
      type: Number,
      default: 0,
      min: 0
    },
    personasDelante: {
      type: Number,
      default: 0,
      min: 0
    },
    fecha: {
      type: String,
      required: true,
      index: true
    },
    tiempoTotalEspera: {
      type: Number,
      default: 0,
      min: 0
    },
    tiempoTotalConsulta: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

turnSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Turn = mongoose.models.Turn || mongoose.model('Turn', turnSchema);

export default Turn;

