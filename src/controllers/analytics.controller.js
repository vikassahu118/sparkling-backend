import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Analytics } from '../models/analytics.model.js';

/**
 * @route GET /api/v1/analytics/dashboard
 * @desc Get key dashboard analytics.
 * @access Private (Admin, Finance Manager)
 */
export const getDashboardData = asyncHandler(async (req, res) => {
  const analyticsData = await Analytics.getDashboardAnalytics();
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        analyticsData,
        'Dashboard analytics fetched successfully.'
      )
    );
});
