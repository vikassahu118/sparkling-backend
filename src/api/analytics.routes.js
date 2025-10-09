import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { checkRole } from '../middlewares/role.middleware.js';
import { getDashboardData } from '../controllers/analytics.controller.js';

const router = Router();

// Secure the route so only Admins and Finance Managers can access it
router.route('/dashboard').get(
    verifyJWT,
    checkRole(['Admin', 'Finance Manager']),
    getDashboardData
);

export default router;
