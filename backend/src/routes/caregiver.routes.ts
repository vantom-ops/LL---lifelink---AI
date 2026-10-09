import { Router } from 'express';
import { caregiverController } from '../controllers/caregiver.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.get('/me', requireRole(['caregiver', 'admin']) as any, caregiverController.getMe as any);
router.put('/me', requireRole(['caregiver', 'admin']) as any, caregiverController.updateMe as any);

export default router;
