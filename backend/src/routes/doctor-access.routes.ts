import { Router } from 'express';
import { doctorQrController } from '../controllers/doctor-qr.controller';

const router = Router();

// Public doctor routes - secured by cryptographic QR token & session identifier
router.post('/validate-qr', doctorQrController.validateQr as any);
router.post('/session', doctorQrController.createSession as any);
router.get('/session/:sessionId', doctorQrController.getSessionData as any);
router.post('/session/:sessionId/end', doctorQrController.endSession as any);

export default router;
