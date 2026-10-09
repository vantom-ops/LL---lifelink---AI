import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { paymentController } from '../controllers/payment.controller';

const router = Router();

router.use(authenticate);

router.post('/create-order', paymentController.createOrder.bind(paymentController));
router.post('/confirm', paymentController.confirm.bind(paymentController));
router.get('/history', paymentController.getHistory.bind(paymentController));

export default router;
