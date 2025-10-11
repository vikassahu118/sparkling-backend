import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { checkRole } from '../middlewares/role.middleware.js';
import { getActiveOffer, setOffer } from '../controllers/offer.controller.js';

const router = Router();

// --- Public Route ---
router.route('/active').get(getActiveOffer);

// --- Secured Management Route ---
router.route('/').post(
    verifyJWT,
    checkRole(['Admin', 'Product Manager']),
    setOffer
);

export default router;

