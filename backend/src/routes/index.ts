import { Router } from 'express';
import authRoutes from './auth.routes';
import patientRoutes from './patient.routes';
import caregiverRoutes from './caregiver.routes';
import doctorAccessRoutes from './doctor-access.routes';
import pairingRoutes from './pairing.routes';
import medicationRoutes from './medication.routes';
import scheduleRoutes from './schedule.routes';
import eventRoutes from './event.routes';
import prescriptionRoutes from './prescription.routes';
import documentRoutes from './document.routes';
import notificationRoutes from './notification.routes';
import reportRoutes from './report.routes';
import demoRoutes from './demo.routes';
import careCircleRoutes from './careCircle.routes';
import assistanceRoutes from './assistance.routes';
import professionalCaregiverRoutes from './professionalCaregiver.routes';
import paymentRoutes from './payment.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/caregivers', caregiverRoutes);
router.use('/doctor-access', doctorAccessRoutes);
router.use('/pairing', pairingRoutes);
router.use('/medications', medicationRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/medication-events', eventRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/documents', documentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/demo', demoRoutes);

// Phase 2 Routes
router.use('/care-circle', careCircleRoutes);
router.use('/assistance', assistanceRoutes);
router.use('/professional-caregivers', professionalCaregiverRoutes);
router.use('/payments', paymentRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'LL LifeLink API',
    version: '2.0.0',
    phase: 'Phase 2 - Disability Medication Assistance and CareChain',
    timestamp: new Date().toISOString()
  });
});

export default router;
