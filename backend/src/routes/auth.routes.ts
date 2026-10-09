import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate as any, authController.me as any);
router.post('/fcm-token', authenticate as any, authController.updateFcmToken as any);

export default router;
