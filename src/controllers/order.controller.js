import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { db } from '../config/db.config.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import { Coupon } from '../models/coupon.model.js';
import { Order } from '../models/order.model.js';
import { Ticket } from '../models/ticket.model.js';

/**
 * @route POST /api/v1/orders
 * @desc Create a new order (for Customers)
 * @access Private (Authenticated Users)
 */
export const createOrder = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const { shippingAddressId, billingAddressId, products, couponCode } = req.body;

  if (!shippingAddressId || !billingAddressId || !products || !products.length) {
    throw new ApiError(400, 'Shipping/billing addresses and products are required.');
  }

  // Use a transaction to ensure all-or-nothing database operations
  try {
    // Start transaction
    await db.query('BEGIN');
    
    let subtotal = 0;
    const orderItemsData = [];

    // 1. Validate products and calculate subtotal
    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product || product.stock_quantity < item.quantity) {
        throw new ApiError(400, `Product not available or insufficient stock for: ${product?.name}`);
      }
      subtotal += product.price * item.quantity;
      orderItemsData.push({ ...item, priceAtPurchase: product.price });
    }

    let totalAmount = subtotal;
    let appliedCouponId = null;

    // 2. Validate coupon and calculate total amount
    if (couponCode) {
      const coupon = await Coupon.findByCode(couponCode);
      if (!coupon || coupon.status !== 'Active') throw new ApiError(400, 'Invalid coupon.');
      let discount = coupon.discount_type === 'percentage' ? (subtotal * coupon.discount_value) / 100 : coupon.discount_value;
      totalAmount = Math.max(0, subtotal - discount);
      appliedCouponId = coupon.id;
    }

    // 3. Create the order
    const orderQuery = `INSERT INTO orders (customer_id, shipping_address_id, billing_address_id, total_amount, applied_coupon_id) VALUES ($1, $2, $3, $4, $5) RETURNING id;`;
    const orderResult = await db.query(orderQuery, [customerId, shippingAddressId, billingAddressId, totalAmount, appliedCouponId]);
    const newOrderId = orderResult.rows[0].id;

    // 4. Create order items and update product stock
    for (const item of orderItemsData) {
      await db.query(`INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4);`, [newOrderId, item.productId, item.quantity, item.priceAtPurchase]);
      await db.query(`UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2;`, [item.quantity, item.productId]);
    }

    // Commit transaction
    await db.query('COMMIT');
    res.status(201).json(new ApiResponse(201, { orderId: newOrderId }, 'Order created successfully.'));

  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
});

/**
 * @route GET /api/v1/orders
 * @desc Get the current user's order history (for Customers)
 * @access Private (Authenticated Users)
 */
export const getOrderHistory = asyncHandler(async (req, res) => {
    const customerId = req.user.id;
    const orders = await Order.findOrdersByCustomerId(customerId);
    res.status(200).json(new ApiResponse(200, orders, "Order history fetched successfully."));
});

/**
 * @route POST /api/v1/orders/:id/return-request
 * @desc Allows a customer to request a return for a delivered order.
 * @access Private (Authenticated Users)
 */
export const requestReturn = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const customerId = req.user.id;

    const order = await Order.findById(id);
    if (!order) {
        throw new ApiError(404, "Order not found.");
    }
    
    // Security check: ensure the order belongs to the person making the request
    if (order.customer.id !== customerId) {
        throw new ApiError(403, "You are not authorized to perform this action on this order.");
    }

    // Business logic check: You can only return an order that has been delivered.
    if (order.status !== 'Delivered') {
        throw new ApiError(400, `Order cannot be returned. Current status: ${order.status}`);
    }

    const updatedOrder = await Order.updateStatus(id, 'Returned');

    return res
        .status(200)
        .json(new ApiResponse(200, updatedOrder, "Return request submitted successfully. The order status is now 'Returned'."));
});

/**
 * @route GET /api/v1/orders/all
 * @desc Get all orders for management (for Managers)
 * @access Private (Admin, Order Manager)
 */
export const getAllOrders = asyncHandler(async (req, res) => {
    const orders = await Order.findAll();
    return res
        .status(200)
        .json(new ApiResponse(200, orders, "All orders fetched successfully."));
});

/**
 * @route GET /api/v1/orders/:id/details
 * @desc Get detailed information for a single order (for Managers)
 * @access Private (Admin, Order Manager)
 */
export const getOrderDetailsForManager = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) throw new ApiError(404, "Order not found.");
    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order details fetched successfully."));
});

/**
 * @route PATCH /api/v1/orders/:id/status
 * @desc Update the status of an order (for Managers)
 * @access Private (Admin, Order Manager)
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const allowedStatuses = ['Processing', 'Dispatched', 'Delivered', 'Cancelled', 'Returned'];
    if (!status || !allowedStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`);
    }

    const updatedOrder = await Order.updateStatus(id, status);
    if (!updatedOrder) throw new ApiError(404, "Order not found.");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedOrder, "Order status updated successfully."));
});

/**
 * @route POST /api/v1/orders/:id/raise-refund
 * @desc Allows an Order Manager to raise a refund ticket for a returned order.
 * @access Private (Admin, Order Manager)
 */
export const raiseRefundTicket = asyncHandler(async (req, res) => {
    const { id } = req.params; // This is the Order ID
    const managerId = req.user.id;

    const order = await Order.findById(id);
    if (!order) {
        throw new ApiError(404, "Order not found.");
    }

    // Business logic check: A refund can only be raised for an order marked as 'Returned'.
    if (order.status !== 'Returned') {
        throw new ApiError(400, `Cannot raise refund ticket. Order status is '${order.status}', not 'Returned'.`);
    }

    // Create a ticket for the Finance Manager
    const ticketDetails = {
        orderId: order.order_id,
        customerId: order.customer.id,
        customerEmail: order.customer.email,
        totalAmount: order.total_amount,
        message: `Refund request for returned order #${order.order_id}. Please process.`
    };

    const newTicket = await Ticket.create({
        ticketType: 'Refund Request',
        details: ticketDetails,
        createdById: managerId
    });

    return res
        .status(201)
        .json(new ApiResponse(201, newTicket, "Refund ticket successfully raised for the Finance team."));
});

