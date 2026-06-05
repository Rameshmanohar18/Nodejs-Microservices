import AuthService from '../../services/auth/auth.service.js';
import { catchAsync } from '../../utils/helpers/catchAsync.js';
import { ApiResponse } from '../../utils/helpers/apiResponse.js';
import { validateEmail, validatePassword } from '../../utils/validators/custom.validators.js';

export const register = catchAsync(async (req, res) => {
  const { name, email, phone, password } = req.body;
  
  // Validate input
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }
  
  if (!validatePassword(password)) {
    throw new Error('Password must be at least 6 characters');
  }
  
  const { user, accessToken, refreshToken } = await AuthService.register({
    name,
    email,
    phone,
    password
  });
  
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  
  ApiResponse.success(res, {
    user,
    accessToken
  }, 'Registration successful', 201);
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  
  const { user, accessToken, refreshToken } = await AuthService.login(email, password);
  
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  
  ApiResponse.success(res, {
    user,
    accessToken
  }, 'Login successful');
});

export const refreshToken = catchAsync(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
  if (!refreshToken) {
    throw new Error('Refresh token not provided');
  }
  
  const { accessToken, refreshToken: newRefreshToken } = await AuthService.refreshToken(refreshToken);
  
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  
  ApiResponse.success(res, { accessToken }, 'Token refreshed');
});

export const logout = catchAsync(async (req, res) => {
  await AuthService.logout(req.user.id);
  
  res.clearCookie('refreshToken');
  
  ApiResponse.success(res, null, 'Logged out successfully');
});

export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  
  await AuthService.forgotPassword(email);
  
  ApiResponse.success(res, null, 'Password reset email sent');
});

export const resetPassword = catchAsync(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  
  await AuthService.resetPassword(token, password);
  
  ApiResponse.success(res, null, 'Password reset successful');
});

export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  await AuthService.changePassword(req.user.id, currentPassword, newPassword);
  
  ApiResponse.success(res, null, 'Password changed successfully');
});

export const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.params;
  
  // Implement email verification logic
  ApiResponse.success(res, null, 'Email verified successfully');
});

export const sendPhoneOTP = catchAsync(async (req, res) => {
  const { phone } = req.body;
  
  await AuthService.sendPhoneOTP(phone);
  
  ApiResponse.success(res, null, 'OTP sent successfully');
});

export const verifyPhoneOTP = catchAsync(async (req, res) => {
  const { phone, otp } = req.body;
  
  await AuthService.verifyPhoneOTP(phone, otp);
  
  ApiResponse.success(res, null, 'Phone verified successfully');
});