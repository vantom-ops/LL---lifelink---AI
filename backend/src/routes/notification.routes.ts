import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.get('/', notificationController.list as any);
router.patch('/:id/read', notificationController.markRead as any);
router.post('/read-all', notificationController.markAllRead as any);
router.post('/request-contact', notificationController.requestCaregiverContact as any);

export default router;
