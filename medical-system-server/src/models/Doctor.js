import mongoose from 'mongoose';
import { DOCTOR_STATUS } from '../constants/crud-statuses.js';

const doctorSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    apellido: {
      type: String,
      required: true,
      trim: true
    },
    especialidad: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Specialty',
      required: true
    },
    consultorio: {
      type: String,
      required: true,
      trim: true
    },
    tiempoPromedioConsulta: {
      type: Number,
      required: true,
      min: 5
    },
    estado: {
      type: String,
      enum: DOCTOR_STATUS,
      default: 'Activo',
      required: true
    }
  },
  {
    timestamps: true
  }
);

doctorSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema);

export default Doctor;

