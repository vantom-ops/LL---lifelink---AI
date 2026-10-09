import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { paymentService } from '../services/payment.service';
import { PaymentOrder } from '../models/PaymentOrder';

export class PaymentController {
  public async createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const caregiverId = req.user!.userId;
      const { requestId, patientId, amount, professionalId } = req.body;

      const order = await paymentService.createAssistanceOrder(
        requestId,
        patientId,
        caregiverId,
        amount || 350,
        professionalId
      );

      res.status(201).json({
        success: true,
        message: 'Payment order created.',
        data: { order, orderId: order.providerOrderId, currency: order.currency }
      });
    } catch (err) {
      next(err);
    }
  }

  public async confirm(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { orderId, paymentId, signature } = req.body;
      const order = await paymentService.confirmPayment(orderId, paymentId, signature);
      res.json({
        success: true,
        message: 'Payment confirmed successfully.',
        data: { order }
      });
    } catch (err) {
      next(err);
    }
  }

  public async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const orders = await PaymentOrder.find({
        $or: [{ caregiverId: userId }, { professionalId: userId }]
      }).sort({ createdAt: -1 });

      res.json({ success: true, data: { orders } });
    } catch (err) {
      next(err);
    }
  }
}

export const paymentController = new PaymentController();
