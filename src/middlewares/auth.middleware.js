import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { config } from '../config/index.js';
import { User } from '../models/user.model.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // 1. Get token
    const token =
      req.cookies?.accessToken ||
      req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'Unauthorized request. No token provided.');
    }

    // 2. Verify token
    const decodedToken = jwt.verify(token, config.jwt.accessSecret);

    // 3. Find user in database
    const user = await User.findById(decodedToken.id);

    if (!user) {
      // User doesn't exist (e.g., deleted) or token is invalid
      throw new ApiError(401, 'Invalid access token.');
    }

    // 4. Attach user object to the request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid access token.');
    }
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Access token expired.');
    }
    throw new ApiError(401, error?.message || 'Invalid access token.');
  }
});