import User from '../../models/user.model.js';
import Cart from '../../models/cart.model.js';
import { redis } from '../../config/database/index.js';
import logger from '../../config/logger/winston.config.js';
import crypto from 'crypto';
import { sendEmail } from '../communication/email.service.js';
import { sendSMS } from '../communication/sms.service.js';

class AuthService {
  async register(userData) {
    try {
      const existingUser = await User.findOne({
        $or: [{ email: userData.email }, { phone: userData.phone }]
      });
      
      if (existingUser) {
        throw new Error('User already exists with this email or phone');
      }
      
      const user = await User.create(userData);
      
      // Create cart for user
      await Cart.create({ user: user._id });
      
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
      user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
      await user.save({ validateBeforeSave: false });
      
      // Send verification email
      const verificationUrl = `${process.env.BASE_URL}/api/v1/auth/verify-email/${verificationToken}`;
      await sendEmail({
        email: user.email,
        subject: 'Email Verification',
        template: 'emailVerification',
        data: { name: user.name, url: verificationUrl }
      });
      
      // Generate tokens
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();
      
      // Store refresh token in Redis
      await redis.set(`refresh_token:${user._id}`, refreshToken, 7 * 24 * 60 * 60);
      
      // Remove password from output
      user.password = undefined;
      
      return { user, accessToken, refreshToken };
    } catch (error) {
      logger.error('AuthService.register error:', error);
      throw error;
    }
  }
  
  async login(email, password) {
    try {
      const user = await User.findOne({ email }).select('+password');
      
      if (!user || !(await user.comparePassword(password))) {
        throw new Error('Invalid email or password');
      }
      
      if (!user.isActive) {
        throw new Error('Your account has been deactivated');
      }
      
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
      
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();
      
      await redis.set(`refresh_token:${user._id}`, refreshToken, 7 * 24 * 60 * 60);
      
      user.password = undefined;
      
      return { user, accessToken, refreshToken };
    } catch (error) {
      logger.error('AuthService.login error:', error);
      throw error;
    }
  }
  
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      const storedToken = await redis.get(`refresh_token:${decoded.id}`);
      
      if (!storedToken || storedToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }
      
      const user = await User.findById(decoded.id);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const accessToken = user.generateAccessToken();
      const newRefreshToken = user.generateRefreshToken();
      
      await redis.set(`refresh_token:${user._id}`, newRefreshToken, 7 * 24 * 60 * 60);
      
      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      logger.error('AuthService.refreshToken error:', error);
      throw error;
    }
  }
  
  async logout(userId) {
    await redis.del(`refresh_token:${userId}`);
  }
  
  async forgotPassword(email) {
    const user = await User.findOne({ email });
    
    if (!user) {
      throw new Error('No user found with this email');
    }
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    
    const resetUrl = `${process.env.BASE_URL}/api/v1/auth/reset-password/${resetToken}`;
    
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      template: 'resetPassword',
      data: { name: user.name, url: resetUrl }
    });
    
    return { message: 'Password reset email sent' };
  }
  
  async resetPassword(token, newPassword) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }
    
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    return { message: 'Password reset successful' };
  }
  
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    
    if (!(await user.comparePassword(currentPassword))) {
      throw new Error('Current password is incorrect');
    }
    
    user.password = newPassword;
    await user.save();
    
    return { message: 'Password changed successfully' };
  }
  
  async sendPhoneOTP(phone) {
    const user = await User.findOne({ phone });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000;
    
    user.phoneOTP = otp;
    user.phoneOTPExpires = expires;
    await user.save({ validateBeforeSave: false });
    
    await sendSMS(phone, `Your verification OTP is: ${otp}. Valid for 10 minutes.`);
    
    return { message: 'OTP sent successfully' };
  }
  
  async verifyPhoneOTP(phone, otp) {
    const user = await User.findOne({
      phone,
      phoneOTP: otp,
      phoneOTPExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      throw new Error('Invalid or expired OTP');
    }
    
    user.isPhoneVerified = true;
    user.phoneOTP = undefined;
    user.phoneOTPExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    return { message: 'Phone verified successfully' };
  }
}

export default new AuthService();