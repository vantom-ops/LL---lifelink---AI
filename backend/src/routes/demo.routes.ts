import { Router } from 'express';
import { demoController } from '../controllers/demo.controller';

const router = Router();

// Demo seeding endpoint
router.post('/seed', demoController.seed);

// Demo instant 5-minute timeout escalation simulation
router.post('/simulate-timeout', demoController.simulateTimeout);

export default router;
