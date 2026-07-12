import { Router } from 'express';
import authRoutes from './auth.routes.js';
import patientRoutes from './patient.routes.js';
import doctorRoutes from './doctor.routes.js';
import specialtyRoutes from './specialty.routes.js';
import appointmentRoutes from './appointment.routes.js';
import turnRoutes from './turn.routes.js';
import reportRoutes from './report.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/specialties', specialtyRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/turnos', turnRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);

export default router;
