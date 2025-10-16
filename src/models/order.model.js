import { db } from '../config/db.config.js';

export const Order = {
  /**
   * Finds all orders for a specific customer, including details about each product variant.
   */
  findOrdersByCustomerId: async (customerId) => {
    // CORRECTED QUERY: Joins through product_variants to get product details.
    const query = `
      SELECT
        o.id as order_id,
        o.total_amount,
        o.status,
        o.created_at,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'product_name', p.name,
            'quantity', oi.quantity,
            'price_at_purchase', oi.price_at_purchase,
            'color', c.name,
            'size', s.age_range,
            'image', pv.image_urls ->> 0
          )
        ) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN product_variants pv ON oi.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      JOIN colors c ON pv.color_id = c.id
      JOIN sizes s ON pv.size_id = s.id
      WHERE o.customer_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC;
    `;
    const { rows } = await db.query(query, [customerId]);
    return rows;
  },

  /**
   * Finds all orders in the system for management purposes.
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
   */
  findById: async (orderId) => {
    // CORRECTED QUERY: Also joins through product_variants to get item details.
    const query = `
      SELECT
        o.id as order_id, o.total_amount, o.status, o.created_at,
        json_build_object(
            'id', u.id,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'email', u.email
        ) as customer,
        sa.address_line_1 || ', ' || sa.city as shipping_address,
        ba.address_line_1 || ', ' || ba.city as billing_address,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'product_name', p.name,
            'quantity', oi.quantity,
            'price_at_purchase', oi.price_at_purchase,
            'color', c.name,
            'size', s.age_range
          )
        ) as items
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      JOIN addresses sa ON o.shipping_address_id = sa.id
      JOIN addresses ba ON o.billing_address_id = ba.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN product_variants pv ON oi.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      JOIN colors c ON pv.color_id = c.id
      JOIN sizes s ON pv.size_id = s.id
      WHERE o.id = $1
      GROUP BY o.id, u.id, sa.id, ba.id;
    `;
    const { rows } = await db.query(query, [orderId]);
    return rows[0];
  },

  /**
   * Updates the status of a specific order.
   */
  updateStatus: async (orderId, status) => {
    const query = `
      UPDATE orders SET status = $1 WHERE id = $2 RETURNING *;
    `;
    const { rows } = await db.query(query, [status, orderId]);
    return rows[0];
  }
};
