import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { AdminUser } from '../models/adminuser.model';
import { User, IUser } from '../models/user.model';
import env from '../config/env';

export class AuthService {
  private generateAccessToken(user: IUser): string {
    return jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRE as any }
    );
  }

  private generateRefreshToken(user: IUser): string {
    return jwt.sign(
      { id: user._id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRE as any }
    );
  }

  async register(data: any): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const { name, email, password } = data;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create verification token (simple hex string)
    const verificationToken = Math.random().toString(36).substring(2, 15);

    const user = await userRepository.create({
      name,
      email,
      password: hashedPassword,
      role: 'CUSTOMER',
      isVerified: false,
      emailVerificationToken: verificationToken,
      addresses: []
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return { user, accessToken, refreshToken };
  }

  async login(data: any): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const { email, password } = data;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    // If admin, update AdminUser log
    if (user.role === 'ADMIN') {
      await AdminUser.findOneAndUpdate(
        { user: user._id },
        { lastActive: new Date() },
        { upsert: true }
      );
    }

    return { user, accessToken, refreshToken };
  }

  async refresh(token: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string };
      const user = await userRepository.findById(decoded.id);
      
      if (!user || user.refreshToken !== token) {
        throw new Error('Invalid refresh token');
      }

      const accessToken = this.generateAccessToken(user);
      return { accessToken };
    } catch (error) {
      throw new Error('Session expired. Please log in again.');
    }
  }

  async logout(userId: string): Promise<void> {
    await userRepository.update(userId, { refreshToken: '' });
  }

  async verifyEmail(token: string): Promise<IUser> {
    const user = await userRepository.findByVerificationToken(token);
    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    return user;
  }

  async forgotPassword(email: string): Promise<string> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = Math.random().toString(36).substring(2, 15);
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Return token directly for simple integration (in production, send email)
    return resetToken;
  }

  async resetPassword(token: string, newPassword: any): Promise<void> {
    const user = await userRepository.findByResetToken(token);
    if (!user) {
      throw new Error('Reset token is invalid or has expired');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  }
}

export const authService = new AuthService();
export default authService;
