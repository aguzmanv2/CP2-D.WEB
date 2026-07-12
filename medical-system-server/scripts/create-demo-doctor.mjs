import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';
import User from '../src/models/User.js';
import Doctor from '../src/models/Doctor.js';
import Specialty from '../src/models/Specialty.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error('MONGODB_URI no esta configurada');
}

const userData = {
  cedula: '700000001',
  nombre: 'Carlos',
  apellido: 'Perez',
  correo: 'medico.demo@medicalsystem.local',
  password: 'Medico1234!',
  rol: 'Medico',
  estado: true
};

const run = async () => {
  await mongoose.connect(mongoUri);

  const existingUser = await User.findOne({
    $or: [{ cedula: userData.cedula }, { correo: userData.correo }]
  });

  if (existingUser) {
    console.log(
      JSON.stringify(
        {
          created: false,
          reason: 'El usuario medico ya existia',
          cedula: existingUser.cedula,
          correo: existingUser.correo,
          rol: existingUser.rol
        },
        null,
        2
      )
    );
    return;
  }

  let specialty = await Specialty.findOne({ estado: 'Activo' }).sort({ createdAt: 1 });

  if (!specialty) {
    specialty = await Specialty.create({
      nombre: 'Medicina General',
      descripcion: 'Especialidad generada para la cuenta demo de medico',
      estado: 'Activo'
    });
  }

  const user = await User.create(userData);

  const doctor = await Doctor.create({
    nombre: user.nombre,
    apellido: user.apellido,
    especialidad: specialty._id,
    consultorio: '201',
    tiempoPromedioConsulta: 20,
    estado: 'Activo'
  });

  console.log(
    JSON.stringify(
      {
        created: true,
        user: {
          cedula: user.cedula,
          correo: user.correo,
          rol: user.rol
        },
        doctor: {
          id: doctor.id,
          nombre: doctor.nombre,
          apellido: doctor.apellido,
          especialidad: specialty.nombre,
          consultorio: doctor.consultorio
        },
        credentials: {
          identificador: userData.cedula,
          password: userData.password
        }
      },
      null,
      2
    )
  );
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
