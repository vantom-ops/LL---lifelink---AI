import { Router } from 'express';
import { patientController } from '../controllers/patient.controller';
import { doctorQrController } from '../controllers/doctor-qr.controller';
import { privacyController } from '../controllers/privacy.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);

// Senior profile management
router.post('/', requireRole(['caregiver', 'admin']) as any, patientController.create as any);
router.get('/', patientController.list as any);
router.get('/:id', patientController.getOne as any);
router.put('/:id', patientController.update as any);
router.patch('/:id', patientController.update as any);

// Health condition endpoints
router.get('/:id/health-condition', patientController.getHealthCondition as any);
router.put('/:id/health-condition', patientController.updateHealthCondition as any);

// Doctor QR endpoints for patient/caregiver
router.post('/:id/doctor-qr', doctorQrController.generateQr as any);
router.get('/:id/doctor-qr', doctorQrController.getActiveQr as any);
router.post('/:id/doctor-qr/regenerate', doctorQrController.regenerateQr as any);

// Privacy & sharing preferences
router.get('/:id/privacy', privacyController.getPrivacy as any);
router.put('/:id/privacy', privacyController.updatePrivacy as any);

// Access history & audit logs
router.get('/:id/access-history', privacyController.getAccessHistory as any);

export default router;
