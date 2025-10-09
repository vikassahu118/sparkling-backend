import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/role.middleware.js';
import { 
    createUserByAdmin, 
    updateUserRole,
    getCurrentUserProfile,
    addAddress,
    getAddresses
} from '../controllers/user.controller.js';

const router = Router();

// --- Admin Only Routes ---
router.route('/').post(verifyJWT, isAdmin, createUserByAdmin);
router.route('/:id/role').patch(verifyJWT, isAdmin, updateUserRole);


// --- Logged-in User Routes ---
router.route('/me').get(verifyJWT, getCurrentUserProfile);

router.route('/me/addresses')
  .post(verifyJWT, addAddress)
  .get(verifyJWT, getAddresses);

export default router;
