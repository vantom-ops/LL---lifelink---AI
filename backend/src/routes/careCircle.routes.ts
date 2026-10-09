import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { careCircleController } from '../controllers/careCircle.controller';

const router = Router();

router.use(authenticate);

router.get('/', careCircleController.getContacts.bind(careCircleController));
router.get('/patient/:patientId', careCircleController.getContacts.bind(careCircleController));
router.post('/', careCircleController.addContact.bind(careCircleController));
router.put('/:id', careCircleController.updateContact.bind(careCircleController));
router.patch('/:id/availability', careCircleController.toggleAvailability.bind(careCircleController));
router.delete('/:id', careCircleController.removeContact.bind(careCircleController));

export default router;
