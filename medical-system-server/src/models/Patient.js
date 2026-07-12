import mongoose from 'mongoose';
import { PATIENT_STATUS } from '../constants/crud-statuses.js';

const patientSchema = new mongoose.Schema(
  {
    cedula: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true
    },
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
    correo: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true
    },
    telefono: {
      type: String,
      required: true,
      trim: true
    },
    direccion: {
      type: String,
      required: true,
      trim: true
    },
    fechaNacimiento: {
      type: Date,
      required: true
    },
    estado: {
      type: String,
      enum: PATIENT_STATUS,
      default: 'Activo',
      required: true
    }
  },
  {
    timestamps: true
  }
);

patientSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Patient = mongoose.models.Patient || mongoose.model('Patient', patientSchema);

export default Patient;
