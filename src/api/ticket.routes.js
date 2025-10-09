import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/role.middleware.js';
import { checkRole } from '../middlewares/role.middleware.js';
import { 
    getOpenTickets, 
    processCouponTicket,
    getRefundTickets,
    processRefundTicket
} from '../controllers/ticket.controller.js';

const router = Router();

// --- Admin Only Routes for Coupon Approval ---
// This gets all ticket types, useful for an overall admin view
router.route('/').get(verifyJWT, isAdmin, getOpenTickets);
router.route('/coupon/:ticketId').patch(verifyJWT, isAdmin, processCouponTicket);


// --- Finance Manager Routes for Refund Processing ---
router.route('/refunds').get(
    verifyJWT,
    checkRole(['Admin', 'Finance Manager']),
    getRefundTickets
);
router.route('/refund/:ticketId').patch(
    verifyJWT,
    checkRole(['Admin', 'Finance Manager']),
    processRefundTicket
);

export default router;

