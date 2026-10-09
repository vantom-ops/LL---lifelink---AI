import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.get('/adherence/:patientId', reportController.getAdherence as any);

export default router;
