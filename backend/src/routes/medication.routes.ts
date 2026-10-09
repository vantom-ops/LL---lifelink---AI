import { Router } from 'express';
import { medicationController } from '../controllers/medication.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.post('/', requireRole(['caregiver', 'admin']) as any, medicationController.create as any);
router.get('/patient/:patientId', medicationController.listForPatient as any);
router.get('/:id', medicationController.getOne as any);
router.patch('/:id', requireRole(['caregiver', 'admin']) as any, medicationController.update as any);
router.post('/:id/archive', requireRole(['caregiver', 'admin']) as any, medicationController.archive as any);

export default router;
