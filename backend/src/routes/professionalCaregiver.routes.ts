import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { professionalCaregiverController } from '../controllers/professionalCaregiver.controller';

const router = Router();

router.get('/', optionalAuthenticate, professionalCaregiverController.adminListAll.bind(professionalCaregiverController));
router.post('/register', optionalAuthenticate, professionalCaregiverController.register.bind(professionalCaregiverController));
router.get('/me', authenticate, professionalCaregiverController.getMe.bind(professionalCaregiverController));
router.put('/availability', authenticate, professionalCaregiverController.updateAvailability.bind(professionalCaregiverController));
router.patch('/:id/availability', optionalAuthenticate, professionalCaregiverController.updateAvailability.bind(professionalCaregiverController));
router.get('/nearby-requests', optionalAuthenticate, professionalCaregiverController.getNearbyRequests.bind(professionalCaregiverController));

// Admin & Monitor review endpoints
router.get('/admin/all', optionalAuthenticate, professionalCaregiverController.adminListAll.bind(professionalCaregiverController));
router.post('/admin/:id/review', optionalAuthenticate, professionalCaregiverController.adminReview.bind(professionalCaregiverController));
router.post('/:id/review', optionalAuthenticate, professionalCaregiverController.adminReview.bind(professionalCaregiverController));
router.patch('/:id/verify', optionalAuthenticate, professionalCaregiverController.adminReview.bind(professionalCaregiverController));

// Two-way messaging between family monitor and professional caregiver
router.get('/:id/messages', optionalAuthenticate, professionalCaregiverController.getMessages.bind(professionalCaregiverController));
router.post('/:id/messages', optionalAuthenticate, professionalCaregiverController.sendMessage.bind(professionalCaregiverController));

export default router;
