import { Router } from 'express';
import { pairingController } from '../controllers/pairing.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Senior submits pairing code to link phone (Public or auth-agnostic)
router.post('/pair', pairingController.pairDevice);

// Caregiver generates pairing code & QR code
router.post(
  '/generate',
  authenticate as any,
  requireRole(['caregiver', 'admin']) as any,
  pairingController.generateCode as any
);

// Check pairing status of a patient
router.get(
  '/status/:patientId',
  authenticate as any,
  pairingController.getPairingStatus as any
);

export default router;
