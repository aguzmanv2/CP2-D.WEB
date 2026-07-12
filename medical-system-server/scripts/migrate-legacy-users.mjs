import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import { ROLES } from '../src/constants/roles.js';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const titleCase = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const legacyByEmail = {
  'joel@admin.com': {
    cedula: '900000001',
    rol: ROLES.ADMINISTRADOR
  },
  'juan@example.com': {
    cedula: '900000002',
    rol: ROLES.MEDICO
  },
  'usuario1@gmail.com': {
    cedula: '900000003',
    rol: ROLES.PACIENTE
  },
  '1234@admin.com': {
    cedula: '900000004',
    rol: ROLES.RECEPCIONISTA
  },
  'joel@hotmail.com': {
    cedula: '900000005',
    rol: ROLES.PACIENTE
  },
  'admin@medicalsystem.local': {
    cedula: '900000006',
    rol: ROLES.ADMINISTRADOR
  }
};

const splitName = (legacyName = '', role = '') => {
  const cleaned = String(legacyName || '').trim().replace(/\s+/g, ' ');

  if (!cleaned) {
    return {
      nombre: 'Usuario',
      apellido: titleCase(role || 'Sistema')
    };
  }

  const parts = cleaned.split(' ').filter(Boolean);

  if (parts.length >= 2) {
    return {
      nombre: titleCase(parts[0]),
      apellido: titleCase(parts.slice(1).join(' '))
    };
  }

  return {
    nombre: titleCase(cleaned),
    apellido: titleCase(role || 'Sistema')
  };
};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const users = await User.find({}).select('_id name nombre apellido correo email cedula rol estado').lean();

  const report = [];

  for (const user of users) {
    const sourceEmail = normalizeEmail(user.correo || user.email);
    const legacyMeta = legacyByEmail[sourceEmail] || {};
    const role = user.rol || legacyMeta.rol || ROLES.PACIENTE;
    const cedula = String(user.cedula || legacyMeta.cedula || '').trim();
    const legacyName = user.nombre || user.name || '';
    const legacyNames = splitName(legacyName, role);

    const update = {
      $set: {
        correo: sourceEmail || normalizeEmail(user.email),
        email: sourceEmail || normalizeEmail(user.correo || user.email),
        cedula,
        rol: role,
        estado: typeof user.estado === 'boolean' ? user.estado : true
      }
    };

    if (!user.nombre) {
      update.$set.nombre = legacyNames.nombre;
    }

    if (!user.apellido) {
      update.$set.apellido = legacyNames.apellido;
    }

    if (user.name) {
      update.$unset = { name: '' };
    }

    await User.updateOne({ _id: user._id }, update);

    report.push({
      id: String(user._id),
      email: sourceEmail,
      cedula,
      rol: role,
      nombre: update.$set.nombre || user.nombre,
      apellido: update.$set.apellido || user.apellido
    });
  }

  console.log(JSON.stringify({ migrated: report.length, report }, null, 2));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
