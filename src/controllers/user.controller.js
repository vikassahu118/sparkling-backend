import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @route POST /api/v1/users
 * @desc Create a new user with a specified role.
 * @access Private (Admin only)
 */
export const createUserByAdmin = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, mobile, password, roleId } = req.body;

  // --- Validation ---
  if (!email || !password || !roleId) {
    throw new ApiError(400, "Email, password, and roleId are required.");
  }
  if (![1, 2, 3, 4, 5].includes(roleId)) {
    throw new ApiError(400, "A valid roleId (1-5) is required.");
  }

  // --- Check for existing user ---
  const existingUser = await User.findByEmailOrMobile(email, mobile);
  if (existingUser) {
    throw new ApiError(409, "User with this email or mobile already exists.");
  }
  
  // --- Create user ---
  const newUser = await User.createByAdmin({
    firstName, lastName, email, mobile, password, roleId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newUser, "User created successfully by admin."));
});

/**
 * @route PATCH /api/v1/users/:id/role
 * @desc Update a user's role.
 * @access Private (Admin only)
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params; // The ID of the user to update
  const { roleId } = req.body; // The new role ID to assign

  // --- Validation ---
  if (!roleId || ![1, 2, 3, 4, 5].includes(roleId)) {
    throw new ApiError(400, 'A valid roleId (1-5) is required.');
  }

  // --- Update user role ---
  const updatedUser = await User.updateRole(id, roleId);

  if (!updatedUser) {
    throw new ApiError(404, 'User not found.');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User role updated successfully."));
});


// --- NEWLY ADDED FUNCTIONS ---

/**
 * @route GET /api/v1/users/me
 * @desc Get the current logged-in user's profile
 * @access Private (Authenticated Users)
 */
export const getCurrentUserProfile = asyncHandler(async (req, res) => {
  // req.user is attached by the verifyJWT middleware
  return res.status(200).json(new ApiResponse(200, req.user, "User profile fetched successfully."));
});

/**
 * @route POST /api/v1/users/me/addresses
 * @desc Add a new address for the logged-in user
 * @access Private (Authenticated Users)
 */
export const addAddress = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const newAddress = await User.addAddress(userId, req.body);
    return res.status(201).json(new ApiResponse(201, newAddress, "Address added successfully."));
});

/**
 * @route GET /api/v1/users/me/addresses
 * @desc Get all addresses for the logged-in user
 * @access Private (Authenticated Users)
 */
export const getAddresses = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const addresses = await User.findAddressesByUserId(userId);
    return res.status(200).json(new ApiResponse(200, addresses, "Addresses fetched successfully."));
});

