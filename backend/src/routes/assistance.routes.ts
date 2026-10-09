import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { assistanceController } from '../controllers/assistance.controller';

const router = Router();

router.get('/', optionalAuthenticate, assistanceController.getAll.bind(assistanceController));
router.post('/', optionalAuthenticate, assistanceController.create.bind(assistanceController));
router.post('/request', optionalAuthenticate, assistanceController.create.bind(assistanceController));
router.get('/active/:patientId', optionalAuthenticate, assistanceController.getActive.bind(assistanceController));
router.post('/:requestId/respond', optionalAuthenticate, assistanceController.respond.bind(assistanceController));
router.post('/:requestId/arrived', optionalAuthenticate, assistanceController.markArrived.bind(assistanceController));
router.post('/:requestId/start', optionalAuthenticate, assistanceController.markStarted.bind(assistanceController));
router.post('/:requestId/complete', optionalAuthenticate, assistanceController.markCompleted.bind(assistanceController));
router.post('/:requestId/confirm', optionalAuthenticate, assistanceController.confirm.bind(assistanceController));
router.post('/:requestId/cancel', optionalAuthenticate, assistanceController.cancel.bind(assistanceController));
router.get('/history/:patientId', optionalAuthenticate, assistanceController.getHistory.bind(assistanceController));
router.get('/:requestId/helper-view', optionalAuthenticate, assistanceController.getHelperView.bind(assistanceController));
router.get('/:requestId/events', optionalAuthenticate, assistanceController.getEvents.bind(assistanceController));
router.post('/:requestId/force-advance', optionalAuthenticate, assistanceController.forceAdvance.bind(assistanceController));
router.post('/:requestId/offer', optionalAuthenticate, assistanceController.submitOffer.bind(assistanceController));
router.post('/:requestId/offers/:offerId/accept', optionalAuthenticate, assistanceController.acceptOffer.bind(assistanceController));
router.post('/:requestId/offers/:offerId/reject', optionalAuthenticate, assistanceController.rejectOffer.bind(assistanceController));
router.get('/config', authenticate, assistanceController.getConfig.bind(assistanceController));
router.put('/config', authenticate, assistanceController.updateConfig.bind(assistanceController));

export default router;
