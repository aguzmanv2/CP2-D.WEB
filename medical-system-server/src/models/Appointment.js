import mongoose from 'mongoose';
import { APPOINTMENT_STATUS } from '../constants/crud-statuses.js';

const appointmentSchema = new mongoose.Schema(
  {
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
    fecha: {
      type: Date,
      required: true
    },
    hora: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/
    },
    estado: {
      type: String,
      enum: APPOINTMENT_STATUS,
      default: 'Pendiente',
      required: true
    }
  },
  {
    timestamps: true
  }
);

appointmentSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

export default Appointment;

