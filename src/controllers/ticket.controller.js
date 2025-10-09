import { Ticket } from '../models/ticket.model.js';
import { Coupon } from '../models/coupon.model.js';
import { Order } from '../models/order.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @route GET /api/v1/tickets
 * @desc Get all open tickets of any type.
 * @access Private (Admin only)
 */
export const getOpenTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.findOpen();
  return res
    .status(200)
    .json(new ApiResponse(200, tickets, 'Open tickets fetched successfully.'));
});

/**
 * @route PATCH /api/v1/tickets/coupon/:ticketId
 * @desc Process a coupon approval ticket.
 * @access Private (Admin only)
 */
export const processCouponTicket = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { action } = req.body; // Expects 'Approved' or 'Denied'
  const resolvedById = req.user.id;

  if (!['Approved', 'Denied'].includes(action)) {
    throw new ApiError(400, 'Invalid action. Must be "Approved" or "Denied".');
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket || ticket.status !== 'Open' || ticket.ticket_type !== 'Coupon Approval') {
    throw new ApiError(404, 'Open coupon approval ticket not found or already processed.');
  }

  const couponId = ticket.details.couponId;
  const newCouponStatus = action === 'Approved' ? 'Active' : 'Denied';
  const updatedCoupon = await Coupon.updateStatus(couponId, newCouponStatus);
  if (!updatedCoupon) {
      throw new ApiError(404, 'Associated coupon not found.');
  }

  const updatedTicket = await Ticket.updateStatus(ticketId, action, resolvedById);

  return res
    .status(200)
    .json(new ApiResponse(200, { updatedTicket, updatedCoupon }, `Ticket ${action.toLowerCase()} successfully.`));
});

/**
 * @route GET /api/v1/tickets/refunds
 * @desc Get all open refund request tickets.
 * @access Private (Admin, Finance Manager)
 */
export const getRefundTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.findOpenByType('Refund Request');
  return res
    .status(200)
    .json(new ApiResponse(200, tickets, 'Open refund tickets fetched successfully.'));
});

/**
 * @route PATCH /api/v1/tickets/refund/:ticketId
 * @desc Process a refund ticket (Approve/Deny).
 * @access Private (Admin, Finance Manager)
 */
export const processRefundTicket = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { action } = req.body; // Expects 'Approved' or 'Denied'
  const resolvedById = req.user.id;

  if (!['Approved', 'Denied'].includes(action)) {
    throw new ApiError(400, 'Invalid action. Must be "Approved" or "Denied".');
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket || ticket.status !== 'Open' || ticket.ticket_type !== 'Refund Request') {
    throw new ApiError(404, 'Open refund ticket not found or already processed.');
  }

  if (action === 'Approved') {
    const orderId = ticket.details.orderId;
    const updatedOrder = await Order.updateStatus(orderId, 'Refunded');
    if (!updatedOrder) {
      throw new ApiError(404, `Associated order with ID ${orderId} not found.`);
    }
    console.log(`FINANCE ACTION: Refund for order ${orderId} has been processed.`);
  }

  const updatedTicket = await Ticket.updateStatus(ticketId, action, resolvedById);

  return res
    .status(200)
    .json(new ApiResponse(200, { updatedTicket }, `Ticket ${action.toLowerCase()} successfully.`));
});

