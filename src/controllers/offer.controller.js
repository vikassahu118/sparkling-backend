import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Offer } from '../models/offer.model.js';

/**
 * @route GET /api/v1/offers/active
 * @desc Get the currently active site-wide offer description.
 * @access Public
 */
export const getActiveOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findActive();
  // If no offer is set, return a default or empty response
  const offerData = offer || { description: '' };
  return res
    .status(200)
    .json(
      new ApiResponse(200, offerData, 'Active offer fetched successfully.')
    );
});

/**
 * @route POST /api/v1/offers
 * @desc Set or update the site-wide offer description.
 * @access Private (Admin, Product Manager)
 */
export const setOffer = asyncHandler(async (req, res) => {
  const { description } = req.body;
  if (!description) {
    throw new ApiError(400, 'Description is required.');
  }

  const newOffer = await Offer.set(description);

  return res
    .status(201)
    .json(new ApiResponse(201, newOffer, 'Offer set successfully.'));
});

