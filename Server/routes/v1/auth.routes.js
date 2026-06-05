import express from 'express';
import * as authController from '../../controllers/v1/auth.controller.js';
import { protect } from '../../middleware/auth/auth.middleware.js';
import { validate } from '../../middleware/validation/validation.middleware.js';
import { authValidation } from '../../validations/auth.validation.js';

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', protect, authController.logout);
router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/reset-password/:token', validate(authValidation.resetPassword), authController.resetPassword);
router.post('/change-password', protect, validate(authValidation.changePassword), authController.changePassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/send-otp', authController.sendPhoneOTP);
router.post('/verify-otp', authController.verifyPhoneOTP);

export default router;