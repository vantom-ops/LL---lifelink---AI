import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { User } from '../models/User';

export class AuthController {
  public async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, phone, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      }

      const result = await authService.registerCaregiver({ name, email, phone, password });
      res.status(201).json({
        success: true,
        message: 'Caregiver account registered successfully.',
        data: {
          user: {
            id: result.user._id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role
          },
          tokens: result.tokens
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { emailOrPhone, email, password } = req.body;
      const target = emailOrPhone || email;
      if (!target || !password) {
        return res.status(400).json({ success: false, message: 'Email/phone and password are required.' });
      }

      const result = await authService.login(target, password);
      res.json({
        success: true,
        message: 'Logged in successfully.',
        data: {
          user: {
            id: result.user._id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role
          },
          tokens: result.tokens
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const user = await User.findById(req.user.userId).select('-passwordHash');
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      res.json({
        success: true,
        data: { user }
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateFcmToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { fcmToken } = req.body;
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      await User.findByIdAndUpdate(req.user.userId, { fcmToken });
      res.json({ success: true, message: 'FCM token updated.' });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
