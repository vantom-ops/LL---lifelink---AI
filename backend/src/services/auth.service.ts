import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { config } from '../config/env';
import { UserRole } from '../types';

export interface TokenPayload {
  userId: string;
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
}

export class AuthService {
  public async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  public async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  public generateTokens(payload: TokenPayload): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: '7d'
    });
    const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: '30d'
    });
    return { accessToken, refreshToken };
  }

  public verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwtSecret) as TokenPayload;
  }

  public verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwtRefreshSecret) as TokenPayload;
  }

  public async registerCaregiver(data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<{ user: IUser; tokens: { accessToken: string; refreshToken: string } }> {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new Error('A user with this email already exists.');
    }

    const passwordHash = await this.hashPassword(data.password);
    const user = new User({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      passwordHash,
      role: 'caregiver',
      isActive: true
    });
    await user.save();

    const tokens = this.generateTokens({
      userId: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email
    });

    return { user, tokens };
  }

  public async login(
    emailOrPhone: string,
    password: string
  ): Promise<{ user: IUser; tokens: { accessToken: string; refreshToken: string } }> {
    const query = emailOrPhone.includes('@')
      ? { email: emailOrPhone.toLowerCase() }
      : { phone: emailOrPhone };

    const user = await User.findOne(query);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (!user.passwordHash) {
      throw new Error('User does not have a password configured.');
    }

    const match = await this.comparePassword(password, user.passwordHash);
    if (!match) {
      throw new Error('Invalid email or password.');
    }

    const tokens = this.generateTokens({
      userId: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email
    });

    return { user, tokens };
  }
}

export const authService = new AuthService();
