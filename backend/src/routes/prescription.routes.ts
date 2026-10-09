import { Router } from 'express';
import { prescriptionController } from '../controllers/prescription.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate as any);

router.post(
  '/upload',
  requireRole(['caregiver', 'admin']) as any,
  upload.single('file'),
  prescriptionController.upload as any
);

router.post(
  '/:id/verify',
  requireRole(['caregiver', 'admin']) as any,
  prescriptionController.verifyAndActivate as any
);

router.get('/patient/:patientId', prescriptionController.listForPatient as any);
router.get('/:id', prescriptionController.getOne as any);

export default router;
