import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  isAdmin,
  isAdminOrProductManager,
} from '../middlewares/role.middleware.js';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller.js';

const router = Router();

// --- Public Routes (for Customers) ---
router.route('/').get(getAllProducts);
router.route('/:id').get(getProductById);

// --- Secured Routes (for Admin/Product Manager) ---
router.route('/').post(verifyJWT, isAdminOrProductManager, createProduct);
router.route('/:id').patch(verifyJWT, isAdminOrProductManager, updateProduct);

// Only a full Admin can delete (deactivate) a product
router.route('/:id').delete(verifyJWT, isAdmin, deleteProduct);

export default router;