import { ApiError } from '../utils/ApiError.js';

/**
 * Higher-order function to create a role-checking middleware.
 * @param {Array<string>} allowedRoles - Array of role names (e.g., ['Admin', 'Product Manager'])
 */
export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // This middleware must run *after* verifyJWT, so req.user will exist
    if (!req.user) {
      throw new ApiError(401, 'Authentication required.');
    }

    const userRole = req.user.role_name; // 'role_name' comes from our User.findById query

    if (!allowedRoles.includes(userRole)) {
      throw new ApiError(
        403,
        'Forbidden: You do not have permission to perform this action.'
      );
    }

    // User has the required role, proceed
    next();
  };
};

// Export pre-configured middleware for convenience
export const isAdmin = checkRole(['Admin']);
export const isProductManager = checkRole(['Product Manager']);
export const isOrderManager = checkRole(['Order Manager']);
export const isFinanceManager = checkRole(['Finance Manager']);

// Example for combined roles:
export const isAdminOrProductManager = checkRole(['Admin', 'Product Manager']);