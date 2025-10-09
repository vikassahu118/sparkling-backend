import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { checkRole } from '../middlewares/role.middleware.js';
import { 
    createOrder, 
    getOrderHistory,
    getAllOrders,
    getOrderDetailsForManager,
    updateOrderStatus,
    requestReturn,
    raiseRefundTicket
} from '../controllers/order.controller.js';

const router = Router();

// --- Management Routes (for Admin & Order Manager) ---
router.route('/all').get(
    verifyJWT, 
    checkRole(['Admin', 'Order Manager']), 
    getAllOrders
);

router.route('/:id/details').get(
    verifyJWT, 
    checkRole(['Admin', 'Order Manager']), 
    getOrderDetailsForManager
);

router.route('/:id/status').patch(
    verifyJWT, 
    checkRole(['Admin', 'Order Manager']), 
    updateOrderStatus
);

// New endpoint for Order Manager to raise a refund ticket
router.route('/:id/raise-refund').post(
    verifyJWT,
    checkRole(['Admin', 'Order Manager']),
    raiseRefundTicket
);


// --- Customer-facing Routes ---
router.route('/')
  .post(verifyJWT, createOrder)
  .get(verifyJWT, getOrderHistory);

// New endpoint for a customer to request a return
router.route('/:id/return-request').post(verifyJWT, requestReturn);


export default router;

