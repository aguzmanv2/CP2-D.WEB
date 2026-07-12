import mongoose from 'mongoose';
import { SPECIALTY_STATUS } from '../constants/crud-statuses.js';

const specialtySchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true
    },
    descripcion: {
      type: String,
      required: true,
      trim: true
    },
    estado: {
      type: String,
      enum: SPECIALTY_STATUS,
      default: 'Activo',
      required: true
    }
  },
  {
    timestamps: true
  }
);

specialtySchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Specialty = mongoose.models.Specialty || mongoose.model('Specialty', specialtySchema);

export default Specialty;

