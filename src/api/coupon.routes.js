import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { isAdminOrProductManager } from '../middlewares/role.middleware.js';
import { createCoupon } from '../controllers/coupon.controller.js';

const router = Router();

// Anyone who can manage products can create coupons
router.route('/').post(verifyJWT, isAdminOrProductManager, createCoupon);

export default router;