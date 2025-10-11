import { Router } from 'express';
import authRouter from './auth.routes.js';
import productRouter from './product.routes.js';
import orderRouter from './order.routes.js';
import couponRouter from './coupon.routes.js';
import ticketRouter from './ticket.routes.js';
import userRouter from './user.routes.js';
import analyticsRouter from './analytics.routes.js';
// --- IMPORT THE NEW ROUTER ---
import offerRouter from './offer.routes.js';

const router = Router();

// --- Register All Routers ---
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/products', productRouter);
router.use('/orders', orderRouter);
router.use('/coupons', couponRouter);
router.use('/tickets', ticketRouter);
router.use('/analytics', analyticsRouter);
// --- REGISTER THE NEW ROUTER ---
router.use('/offers', offerRouter);

export default router;

