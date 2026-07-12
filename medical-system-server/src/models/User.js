import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { ROLE_VALUES, ROLES } from '../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    cedula: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      sparse: true,
      index: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
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
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    rol: {
      type: String,
      enum: ROLE_VALUES,
      default: ROLES.PACIENTE,
      required: true
    },
    estado: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function hashPassword(next) {
  if (this.correo) {
    this.email = this.correo;
  }

  if (!this.isModified('password')) {
    return next();
  }

  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
