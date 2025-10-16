import { Coupon } from '../models/coupon.model.js';
import { Ticket } from '../models/ticket.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createCoupon = asyncHandler(async (req, res) => {
  // --- DIAGNOSTIC LOG ---
  // This will show us the exact content of the request body.
  console.log('Received request body in controller:', req.body);

  const createdBy = req.user.id; // From verifyJWT middleware
  
  // 1. Create the coupon with a 'Pending Approval' status
  const coupon = await Coupon.create({ ...req.body, createdBy });

  // 2. Automatically create an approval ticket for the Admin
  await Ticket.create({
    ticketType: 'Coupon Approval',
    details: {
      couponId: coupon.id,
      couponCode: coupon.code,
      message: `Request to approve coupon: ${coupon.code}`,
    },
    createdById: createdBy,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, coupon, 'Coupon created and submitted for approval.')
    );
});
