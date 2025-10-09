import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// --- Public Routes ---
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- Secured Routes ---
// verifyJWT middleware runs first, then logoutUser
router.post('/logout', verifyJWT, logoutUser);

// TODO:
// router.post('/refresh-token', ...);
// router.post('/request-otp', ...);
// router.post('/login-otp', ...);
// router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// router.get('/google/callback', ...);

export default router;