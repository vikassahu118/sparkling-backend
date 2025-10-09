import { Router } from 'express';
import authRouter from './auth.routes.js';
import productRouter from './product.routes.js';
import orderRouter from './order.routes.js';
import couponRouter from './coupon.routes.js';
import ticketRouter from './ticket.routes.js';
import userRouter from './user.routes.js';
// --- IMPORT THE NEW ROUTER ---
import analyticsRouter from './analytics.routes.js';

const router = Router();

// --- Register All Routers ---
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/products', productRouter);
router.use('/orders', orderRouter);
router.use('/coupons', couponRouter);
router.use('/tickets', ticketRouter);
// --- REGISTER THE NEW ROUTER ---
router.use('/analytics', analyticsRouter);

export default router;
