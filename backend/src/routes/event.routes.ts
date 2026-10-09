import { Router } from 'express';
import { eventController } from '../controllers/event.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.get('/today/:patientId', eventController.getToday as any);
router.post('/:id/confirm-taken', eventController.confirmTaken as any);
router.post('/:id/mark-not-taken', eventController.markNotTaken as any);
router.post('/:id/resend-reminder', requireRole(['caregiver', 'admin']) as any, eventController.resendReminder as any);
router.post('/sync-offline', eventController.syncOffline as any);

export default router;
