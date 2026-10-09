import { Router } from 'express';
import { scheduleController } from '../controllers/schedule.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.post('/', requireRole(['caregiver', 'admin']) as any, scheduleController.create as any);
router.get('/patient/:patientId', scheduleController.listForPatient as any);
router.patch('/:id/toggle', requireRole(['caregiver', 'admin']) as any, scheduleController.toggle as any);
router.delete('/:id', requireRole(['caregiver', 'admin']) as any, scheduleController.delete as any);

export default router;
