import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { comparePassword } from '../utils/password.utils.js';
import { config } from '../config/index.js';

/**
 * Generates JWT access and refresh tokens.
 */
const generateTokens = (userId, userRole) => {
  const accessToken = jwt.sign(
    { id: userId, role: userRole },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiry }
  );

  const refreshToken = jwt.sign({ id: userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });

  return { accessToken, refreshToken };
};

// --- Controller Functions ---

/**
 * @route POST /api/v1/auth/register
 * @desc Register a new user
 * @access Public
 */
export const registerUser = asyncHandler(async (req, res) => {
  // 1. Explicitly pull only the fields we want from the request body.
  //    This prevents any malicious fields (like roleId or roleName) from being processed.
  const {
    firstName,
    lastName,
    email,
    mobile,
    password,
    age,
    gender,
  } = req.body;

  // 2. Validation
  if (
    !firstName ||
    !lastName ||
    !email ||
    !mobile ||
    !password
  ) {
    throw new ApiError(400, 'All required fields (firstName, lastName, email, mobile, password) must be provided.');
  }

  // 3. Check if user already exists
  const existingUser = await User.findByEmailOrMobile(email, mobile);
  if (existingUser) {
    throw new ApiError(409, 'User with this email or mobile already exists.');
  }

  // 4. Create the user object, HARDCODING the role.
  //    THIS IS THE SECURITY FIX: We construct the user data ourselves
  //    and explicitly set the role to 'Customer', ignoring anything from req.body.
  const newUserPayload = {
    firstName,
    lastName,
    email,
    mobile,
    password,
    age,
    gender,
    roleName: 'Customer', // Securely hardcoded
  };

  const newUser = await User.create(newUserPayload);

  // 5. Send response
  return res
    .status(201)
    .json(new ApiResponse(201, newUser, 'User registered successfully.'));
});


/**
 * @route POST /api/v1/auth/login
 * @desc Log in a user and return JWTs
 * @access Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { emailOrMobile, password } = req.body;

  // 1. Validation
  if (!emailOrMobile || !password) {
    throw new ApiError(400, 'Email/Mobile and password are required.');
  }

  // 2. Find user
  const user = await User.findByEmailOrMobile(emailOrMobile, emailOrMobile);
  if (!user) {
    throw new ApiError(401, 'Invalid credentials.');
  }

  // 3. Check password
  const isPasswordValid = await comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials.');
  }

  // 4. Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id, user.role_name);

  // 5. Prepare user data to return (remove sensitive info)
  const { password_hash, ...loggedInUser } = user;

  // 6. Set tokens in secure, HttpOnly cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  return res
    .status(200)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken },
        'User logged in successfully.'
      )
    );
});

/**
 * @route POST /api/v1/auth/logout
 * @desc Log out a user by clearing cookies
 * @access Private (requires valid access token)
 */
export const logoutUser = asyncHandler(async (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  return res
    .status(200)
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(new ApiResponse(200, {}, 'User logged out successfully.'));
});