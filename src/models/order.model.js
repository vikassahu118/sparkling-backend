import { db } from '../config/db.config.js';

export const Order = {
  /**
   * Finds all orders for a specific customer.
   */
  findOrdersByCustomerId: async (customerId) => {
    const query = `
      SELECT
        o.id as order_id,
        o.total_amount,
        o.status,
        o.created_at,
        json_agg(
          json_build_object(
            'product_id', p.id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price_at_purchase', oi.price_at_purchase
          )
        ) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.customer_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC;
    `;
    const { rows } = await db.query(query, [customerId]);
    return rows;
  },

  /**
   * Finds all orders in the system for management purposes.
   * @returns {Promise<Array>} A list of all orders with customer details.
   */
  findAll: async () => {
    const query = `
      SELECT 
        o.id, o.total_amount, o.status, o.created_at,
        u.first_name, u.last_name, u.email
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      ORDER BY o.created_at DESC;
    `;
    const { rows } = await db.query(query);
    return rows;
  },

  /**
   * Finds a single, detailed order by its ID for management.
   * @param {string} orderId - The UUID of the order.
   * @returns {Promise<object|null>} A single detailed order object.
   */
  findById: async (orderId) => {
    const query = `
      SELECT
        o.id as order_id, o.total_amount, o.status, o.created_at, o.payment_type,
        json_build_object(
            'id', u.id,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'email', u.email
        ) as customer,
        sa.address_line_1 || ', ' || sa.city as shipping_address,
        ba.address_line_1 || ', ' || ba.city as billing_address,
        json_agg(
          json_build_object(
            'product_id', p.id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price_at_purchase', oi.price_at_purchase
          )
        ) as items
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      JOIN addresses sa ON o.shipping_address_id = sa.id
      JOIN addresses ba ON o.billing_address_id = ba.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1
      GROUP BY o.id, u.id, sa.id, ba.id;
    `;
    const { rows } = await db.query(query, [orderId]);
    return rows[0];
  },

  /**
   * Updates the status of a specific order.
   * @param {string} orderId - The UUID of the order.
   * @param {string} status - The new status.
   * @returns {Promise<object|null>} The updated order object.
   */
  updateStatus: async (orderId, status) => {
    const query = `
      UPDATE orders SET status = $1 WHERE id = $2 RETURNING *;
    `;
    const { rows } = await db.query(query, [status, orderId]);
    return rows[0];
  }
};

